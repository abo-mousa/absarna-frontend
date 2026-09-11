import { describe, expect, it } from 'vitest';
import {
    DECISIONS, MUSIC_REVIEW, formatSpan, formatSpans, formatTimestamp, hidesVideo, isolateLtr,
    musicBadge, musicNotice, reviewRow, seekTargetFor,
} from '@/lib/musicReview';
import { ar } from '@/i18n/ar';

/**
 * What an owner is told when their video is held for music — the last step of a rule that starts
 * in absarna-worker and ends here.
 *
 * <p>Two things make this worth testing rather than eyeballing. The first is that only two of the
 * five verdicts actually hide a video, and flattening that into "there is a problem" would tell
 * owners their published video is gone. The second is that this notice IS the notification
 * mechanism: a held video is READY, visible, and reachable by nobody, and there is no email or
 * SSE channel anywhere in this design, so if this renders nothing the owner's only evidence is
 * that their upload silently vanished.
 */
describe('hidesVideo', () => {
    it('is true only for the two verdicts that keep a video off the platform', () => {
        expect(hidesVideo(MUSIC_REVIEW.HELD)).toBe(true);
        expect(hidesVideo(MUSIC_REVIEW.REJECTED)).toBe(true);
    });

    it('is false for the verdicts on a video that is published and playing', () => {
        // ADVISORY and UNCHECKED publish: a rule measured on one reciter is not enough to hide
        // anything on, and a model outage must not stop publishing. Getting this backwards here
        // would tell an owner their working video is blocked.
        expect(hidesVideo(MUSIC_REVIEW.ADVISORY)).toBe(false);
        expect(hidesVideo(MUSIC_REVIEW.UNCHECKED)).toBe(false);
        expect(hidesVideo(MUSIC_REVIEW.CLEARED)).toBe(false);
        expect(hidesVideo(null)).toBe(false);
        expect(hidesVideo(undefined)).toBe(false);
    });
});

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
        expect(result.text).toContain(ar.video.musicReview.moreSpans.replace('{count}', '2'));
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
        expect(one.text).toContain(ar.video.musicReview.moreSpansOne);
        expect(one.text).not.toContain('{count}');

        expect(formatSpans(many).text).toContain('2');
    });

    it('says nothing about a remainder when there is none', () => {
        const result = formatSpans([{ start: 5, end: 45.2 }]);

        expect(result.text).toBe('\u20660:05–0:45\u2069');
        expect(result.text).not.toContain(ar.video.musicReview.moreSpansOne);
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
        expect(mixed.text).not.toContain(ar.video.musicReview.moreSpansOne);
    });
});

describe('musicNotice', () => {
    const held = {
        musicReview: MUSIC_REVIEW.HELD,
        musicSpans: [{ start: 12, end: 31.2 }],
    };

    it('tells the owner of a held video that it is held, and where the music is', () => {
        const notice = musicNotice(held, true);

        expect(notice.hidden).toBe(true);
        expect(notice.tone).toBe('warning');
        expect(notice.title).toBe(ar.video.musicReview.held.title);
        // The timestamps are the actionable half — "held for review" alone gives the owner
        // nothing to go and check.
        expect(notice.body).toContain('0:12–0:31');
        expect(notice.body).not.toContain('{spans}');
    });

    it('falls back to the span-less wording when there are no usable spans', () => {
        // UNSCANNED carries no spans at all by construction, and a malformed timeline reaches
        // here as an empty list. Neither may leave a literal {spans} on the page.
        const notice = musicNotice({ musicReview: MUSIC_REVIEW.HELD, musicSpans: [] }, true);

        expect(notice.body).toBe(ar.video.musicReview.held.body);
        expect(notice.body).not.toContain('{spans}');
    });

    it('says nothing to anyone who is not the owner', () => {
        // The backend does not send musicReview to a stranger at all, so this is the second lock
        // on that door. A CLEARED video is fully public, and announcing on it that it was once
        // reviewed for music is a disclosure nobody asked for.
        expect(musicNotice(held, false)).toBeNull();
    });

    it('says nothing about a clean, cleared, or never-scanned video', () => {
        // Null is the answer for almost every video on the platform: everything that never
        // entered the upload pipeline was never scanned and never will be.
        expect(musicNotice({ musicReview: null }, true)).toBeNull();
        expect(musicNotice({}, true)).toBeNull();
        expect(musicNotice(null, true)).toBeNull();
        expect(musicNotice({ musicReview: MUSIC_REVIEW.CLEARED }, true)).toBeNull();
    });

    it('does not dress a published video as a blocked one', () => {
        // The asymmetry that matters most. ADVISORY and UNCHECKED are notes on a video that is
        // playing normally; rendering them in the same alarming tone as HELD would train owners
        // to ignore the tone entirely, which is exactly when the one that matters arrives.
        for (const review of [MUSIC_REVIEW.ADVISORY, MUSIC_REVIEW.UNCHECKED]) {
            const notice = musicNotice({ musicReview: review }, true);
            expect(notice.hidden).toBe(false);
            expect(notice.tone).toBe('info');
        }
    });

    it('has a real string for every verdict it can show', () => {
        // t() returns the key itself when there is no string for it, so a missing translation is
        // a dotted key rendered on the page rather than a crash. This is what catches it.
        for (const review of [MUSIC_REVIEW.HELD, MUSIC_REVIEW.REJECTED, MUSIC_REVIEW.ADVISORY,
            MUSIC_REVIEW.UNCHECKED]) {
            const notice = musicNotice({ musicReview: review, musicSpans: [{ start: 1, end: 2 }] },
                true);
            expect(notice.title).not.toContain('video.musicReview');
            expect(notice.body).not.toContain('video.musicReview');
        }
    });
});

describe('musicBadge', () => {
    it('gives a card two words and no reason', () => {
        // A grid of the owner's own videos is the one place several of these appear at once, and
        // "music at 0:12–0:31" repeated down a column is noise. The badge says which video to
        // open; the detail page says why.
        const badge = musicBadge({ musicReview: MUSIC_REVIEW.HELD }, true);

        expect(badge.label).toBe(ar.video.musicReview.held.badge);
        expect(badge.hidden).toBe(true);
    });

    it('marks a published-but-noted video as not hidden', () => {
        expect(musicBadge({ musicReview: MUSIC_REVIEW.ADVISORY }, true).hidden).toBe(false);
    });

    it('is absent for strangers, cleared videos and unscanned ones', () => {
        expect(musicBadge({ musicReview: MUSIC_REVIEW.HELD }, false)).toBeNull();
        expect(musicBadge({ musicReview: MUSIC_REVIEW.CLEARED }, true)).toBeNull();
        expect(musicBadge({}, true)).toBeNull();
    });

    it('has a real string for every verdict it can show', () => {
        for (const review of [MUSIC_REVIEW.HELD, MUSIC_REVIEW.REJECTED, MUSIC_REVIEW.ADVISORY,
            MUSIC_REVIEW.UNCHECKED]) {
            expect(musicBadge({ musicReview: review }, true).label)
                .not.toContain('video.musicReview');
        }
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

describe('reviewRow', () => {
    const held = {
        id: 7,
        title: 'Lecture',
        musicReview: MUSIC_REVIEW.HELD,
        musicSpans: [{ start: 5, end: 45.2 }, { start: 55, end: 65.2 }],
    };

    it('gives the reviewer every span, unlike the owner notice', () => {
        // formatSpans truncates to three because it is a notice for the owner, who needs to know
        // roughly where to look. A reviewer is deciding, and skipping the eighth span is how a
        // decision gets made on incomplete evidence.
        const many = {
            ...held,
            musicSpans: Array.from({ length: 8 }, (_, i) => ({ start: i * 20, end: i * 20 + 10 })),
        };

        expect(reviewRow(many).spans).toHaveLength(8);
    });

    it('carries a seek target and a label for each span', () => {
        const row = reviewRow(held);

        expect(row.spans[0].label).toBe('0:05–0:45');
        expect(row.spans[0].seekTo).toBe(3);
        expect(row.spans[1].seekTo).toBe(53);
    });

    it('totals the flagged audio, which is what separates a sting from a music video', () => {
        // 40.2 + 10.2. At a glance this is the difference between "an intro" and "the whole
        // thing", without the reviewer reading eight timestamps to work it out.
        expect(reviewRow(held).coveredSeconds).toBeCloseTo(50.4, 1);
    });

    it('drops a span it cannot label or seek to rather than offering a dead button', () => {
        const row = reviewRow({ ...held, musicSpans: [{ start: 5, end: 45.2 }, { start: 'x' }] });

        expect(row.spans).toHaveLength(1);
    });

    it('says why the row is in the queue, in the reviewer\'s terms', () => {
        // Not the owner's wording: the owner is told what happened to their video, the reviewer
        // is told what they are being asked to decide.
        expect(reviewRow(held).reason).toBe(ar.video.musicReview.held.queueReason);
        expect(reviewRow({ ...held, musicReview: MUSIC_REVIEW.ADVISORY }).reason)
            .toBe(ar.video.musicReview.advisory.queueReason);
    });

    it('marks which rows are actually holding a video back', () => {
        // Three verdicts share the queue and only one of them means an upload is invisible.
        expect(reviewRow(held).hidden).toBe(true);
        expect(reviewRow({ ...held, musicReview: MUSIC_REVIEW.ADVISORY }).hidden).toBe(false);
        expect(reviewRow({ ...held, musicReview: MUSIC_REVIEW.UNCHECKED }).hidden).toBe(false);
    });

    it('survives a video with no spans at all', () => {
        // UNSCANNED carries none by construction: the detector never got far enough to find any.
        const row = reviewRow({ id: 9, title: 'x', musicReview: MUSIC_REVIEW.UNCHECKED });

        expect(row.spans).toEqual([]);
        expect(row.coveredSeconds).toBe(0);
    });

    it('is null for nothing', () => {
        expect(reviewRow(null)).toBeNull();
    });
});

describe('DECISIONS', () => {
    it('offers only the two values a human may write', () => {
        // HELD/ADVISORY/UNCHECKED are the pipeline's vocabulary and the backend refuses them
        // here: writing one back would put the row into the set the worker may overwrite, so the
        // next redelivery would silently undo the reviewer.
        expect(DECISIONS).toEqual([MUSIC_REVIEW.CLEARED, MUSIC_REVIEW.REJECTED]);
    });
});
