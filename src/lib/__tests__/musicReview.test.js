import { describe, expect, it } from 'vitest';
import {
    MUSIC_REVIEW, formatSpan, formatSpans, formatTimestamp, hidesVideo, musicBadge, musicNotice,
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

describe('formatSpans', () => {
    const many = [
        { start: 0, end: 31.2 }, { start: 60, end: 75 }, { start: 120, end: 140 },
        { start: 200, end: 215 }, { start: 300, end: 330 },
    ];

    it('shows the first few and counts the rest', () => {
        // The spans are gappy by nature: measured on a recording that is music from end to end
        // they come back as eight separate stretches covering 63% of it, because the classifier
        // dips below threshold mid-track. Listing all of them reads as eight problems rather
        // than one thing to go and listen to.
        const result = formatSpans(many);
        expect(result.shown).toBe(3);
        expect(result.total).toBe(5);
        expect(result.text).toContain('0:00–0:31');
        expect(result.text).not.toContain('5:00');
    });

    it('is null when there is nothing to point at', () => {
        expect(formatSpans([])).toBeNull();
        expect(formatSpans(null)).toBeNull();
        expect(formatSpans(undefined)).toBeNull();
    });

    it('drops unusable spans rather than rendering them', () => {
        expect(formatSpans([{ start: 'x', end: 'y' }])).toBeNull();
        expect(formatSpans([{ start: 'x' }, { start: 10, end: 20 }]).shown).toBe(1);
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
