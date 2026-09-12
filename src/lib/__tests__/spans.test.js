import { describe, expect, it } from 'vitest';
import {
    formatSpan, formatSpans, formatTimestamp, isolateLtr, seekTargetFor,
} from '@/lib/spans';
import { ar } from '@/i18n/ar';

/**
 * Turning a detector's flagged stretches into something a person can read.
 *
 * <p><b>Worth testing rather than eyeballing because the failure is invisible in review.</b> Every
 * string here lands in an RTL paragraph, and to the bidi algorithm an en dash between two numbers
 * is neutral — so a range renders as `0:45–0:05`, the end before the start, and a list of them
 * reverses. It does not survive a copy-paste either: the clipboard carries logical order and only
 * the screen is wrong, which is exactly how it got past review the first time.
 *
 * <p>The verdict half of this file — what an owner is told, and which states hide a video —
 * moved to review.test.js when the notice became per-detector.
 */
describe('formatTimestamp', () => {
    it('reads as a timestamp the owner can scrub to, not a number of seconds', () => {
        expect(formatTimestamp(0)).toBe('0:00');
        expect(formatTimestamp(31.2)).toBe('0:31');
        expect(formatTimestamp(91)).toBe('1:31');
        expect(formatTimestamp(3725)).toBe('1:02:05');
    });

    it('returns null rather than a broken string for anything that is not a time', () => {
        // The spans come from a JSON document the worker is still tuning; a malformed one must
        // cost the jump-list, never the notice itself.
        expect(formatTimestamp(undefined)).toBeNull();
        expect(formatTimestamp(null)).toBeNull();
        expect(formatTimestamp(-1)).toBeNull();
        expect(formatTimestamp(NaN)).toBeNull();
        expect(formatTimestamp('12')).toBeNull();
    });
});

describe('formatSpan', () => {
    it('joins the two ends with an en dash', () => {
        // An en dash, not a hyphen: these sit inside right-to-left Arabic text, where a hyphen
        // reads as part of the adjacent number.
        expect(formatSpan({ start: 12, end: 31.2 })).toBe('0:12–0:31');
    });

    it('is null when either end is unusable', () => {
        expect(formatSpan({ start: 12 })).toBeNull();
        expect(formatSpan(null)).toBeNull();
    });
});

describe('isolateLtr', () => {
    it('wraps text in a bidi isolate', () => {
        // U+2066 LRI ... U+2069 PDI. Without it an en dash between two numbers is neutral, takes
        // the RTL paragraph's direction, and the range renders end-first: `0:45–0:05`. It does not
        // survive a copy-paste -- the clipboard carries logical order -- so only the screen is
        // wrong, which is exactly how it got past review the first time.
        expect(isolateLtr('0:05–0:45')).toBe('\u20660:05–0:45\u2069');
    });

    it('leaves nothing alone', () => {
        expect(isolateLtr(null)).toBeNull();
        expect(isolateLtr('')).toBe('');
    });
});

describe('formatSpans', () => {
    const many = [
        { start: 0, end: 31.2 }, { start: 60, end: 75 }, { start: 120, end: 140 },
        { start: 200, end: 215 }, { start: 300, end: 330 },
    ];

    it('shows the first few and counts the rest, in one phrase', () => {
        // The spans are gappy by nature: measured on a recording that is music from end to end
        // they come back as eight separate stretches covering 63% of it, because the classifier
        // dips below threshold mid-track. Listing all of them reads as eight problems rather
        // than one thing to go and listen to.
        const result = formatSpans(many);

        expect(result.shown).toBe(3);
        expect(result.total).toBe(5);
        expect(result.text).toContain('0:00–0:31');
        expect(result.text).not.toContain('5:00');
        // The remainder belongs to THIS phrase. It used to render as its own paragraph, landing
        // the fragment after the body had already finished with a different sentence -- two
        // sentences away from the list it agrees with.
        expect(result.text).toContain(ar.video.review.moreSpans.replace('{count}', '2'));
    });

    it('isolates every range, so none of them renders backwards', () => {
        const result = formatSpans([{ start: 5, end: 45.2 }, { start: 55, end: 65.2 }]);

        expect(result.text).toContain('\u20660:05–0:45\u2069');
        expect(result.text).toContain('\u20660:55–1:05\u2069');
    });

    it('agrees with the number of remaining spans, which Arabic requires', () => {
        // A single form cannot serve both: one takes the singular and 3-10 takes the plural, so
        // one of the two readings is always ungrammatical.
        const one = formatSpans([...many.slice(0, 3), { start: 400, end: 410 }]);
        expect(one.text).toContain(ar.video.review.moreSpansOne);
        expect(one.text).not.toContain('{count}');

        expect(formatSpans(many).text).toContain('2');
    });

    it('says nothing about a remainder when there is none', () => {
        const result = formatSpans([{ start: 5, end: 45.2 }]);

        expect(result.text).toBe('\u20660:05–0:45\u2069');
        expect(result.text).not.toContain(ar.video.review.moreSpansOne);
    });

    it('is null when there is nothing to point at', () => {
        expect(formatSpans([])).toBeNull();
        expect(formatSpans(null)).toBeNull();
        expect(formatSpans(undefined)).toBeNull();
    });

    it('counts only the spans it could actually render', () => {
        // An unusable span must not inflate the "and N more" count, or the owner is told there
        // are places to go and listen to that were never named and never could be.
        expect(formatSpans([{ start: 'x', end: 'y' }])).toBeNull();

        const mixed = formatSpans([{ start: 'x' }, { start: 10, end: 20 }]);
        expect(mixed.shown).toBe(1);
        expect(mixed.total).toBe(1);
        expect(mixed.text).not.toContain(ar.video.review.moreSpansOne);
    });
});

describe('seekTargetFor', () => {
    it('lands a couple of seconds before the span, not on its boundary', () => {
        // The flagged window is 10.24s wide and the sound that tripped it can sit anywhere
        // inside, so seeking to the exact start regularly drops the reviewer into the silence
        // just before the music — which reads as a false positive when it is not one.
        expect(seekTargetFor({ start: 30, end: 45 })).toBe(28);
    });

    it('never seeks before the beginning of the video', () => {
        // The commonest flagged shape is an intro sting starting at 0.
        expect(seekTargetFor({ start: 0, end: 15 })).toBe(0);
        expect(seekTargetFor({ start: 1, end: 15 })).toBe(0);
    });

    it('is null for a span it cannot seek to', () => {
        expect(seekTargetFor({ end: 15 })).toBeNull();
        expect(seekTargetFor({ start: 'x', end: 15 })).toBeNull();
        expect(seekTargetFor(null)).toBeNull();
    });
});
