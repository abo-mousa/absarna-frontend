import { describe, expect, it } from 'vitest';
import {
    DECISIONS, REVIEW_STATE, REVIEW_TYPE, detailOf, findingRow, groupByType, holdsVideo,
    ownerBadge, ownerNotices,
} from '../review';
import { ar } from '@/i18n/ar';

describe('which states hide a video', () => {
    it('only HELD and REJECTED hide it', () => {
        // The asymmetry is the whole reason this is not a boolean. ADVISORY and UNCHECKED are
        // published and merely queued; telling a reviewer all four are the same would train them
        // to treat the two that matter as noise.
        expect(holdsVideo(REVIEW_STATE.HELD)).toBe(true);
        expect(holdsVideo(REVIEW_STATE.REJECTED)).toBe(true);
        for (const state of [REVIEW_STATE.CLEAN, REVIEW_STATE.ADVISORY,
            REVIEW_STATE.UNCHECKED, REVIEW_STATE.CLEARED]) {
            expect(holdsVideo(state)).toBe(false);
        }
    });

    it('offers a reviewer only the two human decisions', () => {
        // Writing a machine state back would put the row into the set the worker may overwrite,
        // so the next redelivery would silently undo the reviewer.
        expect(DECISIONS).toEqual([REVIEW_STATE.CLEARED, REVIEW_STATE.REJECTED]);
        expect(DECISIONS).not.toContain(REVIEW_STATE.HELD);
        expect(DECISIONS).not.toContain(REVIEW_STATE.UNCHECKED);
    });
});

describe('reading a finding’s detail', () => {
    it('reads the v6 shape the worker sends', () => {
        const detail = JSON.stringify({
            type: 'MUSIC', outcome: 'BLOCKED', peak: 0.43, topLabel: 'Electronic music',
            shape: 'HEAD', spans: [{ start: 0, end: 31.2 }],
        });
        expect(detailOf(detail)).toMatchObject({
            peak: 0.43, label: 'Electronic music', shape: 'HEAD',
        });
        expect(detailOf(detail).spans).toHaveLength(1);
    });

    it('also reads the v5 shape backfilled from the old column', () => {
        // Migration 043 stores what was actually recorded rather than rewriting history into a
        // shape the worker never sent, so both are live in the table at once.
        const legacy = JSON.stringify({
            disposition: 'PERVASIVE', peak: 0.567, spans: [{ start: 5, end: 45.2 }], advisory: [],
        });
        expect(detailOf(legacy)).toMatchObject({ peak: 0.567, shape: 'PERVASIVE' });
        expect(detailOf(legacy).spans).toHaveLength(1);
    });

    it('survives detail that will not parse, because the state is what gates the video', () => {
        expect(detailOf('{not json')).toEqual({ spans: [], peak: null, label: null, shape: null });
        expect(detailOf(null)).toEqual({ spans: [], peak: null, label: null, shape: null });
    });
});

describe('a queue row', () => {
    const finding = (over = {}) => ({
        videoId: 7, title: 'A lecture', channelId: 3, type: REVIEW_TYPE.MUSIC,
        state: REVIEW_STATE.HELD, holds: true, detectedAt: '2026-09-12T10:00:00Z',
        detail: JSON.stringify({ peak: 0.43, spans: [{ start: 12, end: 31.2 }] }),
        ...over,
    });

    it('offers every span, seeking two seconds early', () => {
        // A span begins at the window the classifier first crossed the threshold in, and the
        // window is 10.24s wide, so landing exactly on the boundary regularly drops the reviewer
        // into silence just before the sound -- which reads as a false positive when it is not.
        const row = findingRow(finding());
        expect(row.spans).toHaveLength(1);
        expect(row.spans[0].seekTo).toBe(10);
        expect(row.spans[0].label).toBe('0:12–0:31');
    });

    it('drops a span it cannot label rather than seeking to NaN', () => {
        const row = findingRow(finding({
            detail: JSON.stringify({ spans: [{ start: 'x', end: 5 }, { start: 12, end: 31.2 }] }),
        }));
        expect(row.spans).toHaveLength(1);
    });

    it('keeps the row when the detail is unusable', () => {
        // The state gates the video; losing the jump-list must not lose the row.
        const row = findingRow(finding({ detail: '{broken' }));
        expect(row.state).toBe(REVIEW_STATE.HELD);
        expect(row.hidden).toBe(true);
        expect(row.spans).toEqual([]);
    });

    it('is null for nothing', () => {
        expect(findingRow(null)).toBeNull();
    });
});

describe('grouping for the sub-tabs', () => {
    it('puts a video flagged by two detectors under both', () => {
        // One row per FINDING, not per video: the two verdicts are independent and a reviewer
        // decides them separately, so collapsing them would force both answers at once.
        const rows = [
            findingRow({ videoId: 7, type: REVIEW_TYPE.MUSIC, state: REVIEW_STATE.HELD }),
            findingRow({ videoId: 7, type: REVIEW_TYPE.NUDITY, state: REVIEW_STATE.ADVISORY }),
        ];
        const grouped = groupByType(rows);
        expect(grouped[REVIEW_TYPE.MUSIC]).toHaveLength(1);
        expect(grouped[REVIEW_TYPE.NUDITY]).toHaveLength(1);
        expect(grouped[REVIEW_TYPE.MUSIC][0].videoId).toBe(7);
    });

    it('always returns a bucket per type, so a tab can render an empty state', () => {
        const grouped = groupByType([]);
        expect(Object.keys(grouped).sort()).toEqual([REVIEW_TYPE.MUSIC, REVIEW_TYPE.NUDITY].sort());
    });
});

/**
 * What an owner is told about their own video — the last step of a rule that starts in
 * absarna-worker and ends here.
 *
 * <p><b>This notice IS the notification mechanism.</b> A held video is READY, visible, and
 * reachable by nobody, and there is no email or SSE channel anywhere in this design, so if this
 * renders nothing the owner's only evidence is that their upload silently vanished.
 *
 * <p>Two things make it worth testing rather than eyeballing. Only two of the four states shown
 * actually hide a video, and flattening that into "there is a problem" would tell owners their
 * published video is gone. And it is per DETECTOR now: a video can be held for music and noted
 * for explicit content at once, which the music-only notice it replaced could not express.
 */
describe('what an owner is told', () => {
    const heldForMusic = {
        review: [{ type: 'MUSIC', state: REVIEW_STATE.HELD, spans: [{ start: 12, end: 31.2 }] }],
    };

    it('tells the owner of a held video that it is held, and where the music is', () => {
        const [notice] = ownerNotices(heldForMusic, true);

        expect(notice.hidden).toBe(true);
        expect(notice.tone).toBe('warning');
        expect(notice.title).toBe(ar.video.review.music.held.title);
        // The timestamps are the actionable half -- "held for review" alone gives the owner
        // nothing to go and check.
        expect(notice.body).toContain('0:12–0:31');
        expect(notice.body).not.toContain('{spans}');
    });

    it('falls back to the span-less wording when there are no usable spans', () => {
        // UNCHECKED carries no spans at all by construction, and a malformed detail reaches here
        // as an empty list. Neither may leave a literal {spans} on the page.
        const [notice] = ownerNotices(
            { review: [{ type: 'MUSIC', state: REVIEW_STATE.HELD, spans: [] }] }, true);

        expect(notice.body).toBe(ar.video.review.music.held.body);
        expect(notice.body).not.toContain('{spans}');
    });

    it('says nothing to anyone who is not the owner', () => {
        // The backend does not send `review` to a stranger at all, so this is the second lock on
        // that door. A CLEARED video is fully public, and announcing on it that it was once
        // moderated is a disclosure nobody asked for.
        expect(ownerNotices(heldForMusic, false)).toEqual([]);
    });

    it('says nothing about a clean, cleared, or never-scanned video', () => {
        // Empty is the answer for almost every video on the platform: everything that never
        // entered the upload pipeline was never scanned and never will be.
        expect(ownerNotices({ review: [] }, true)).toEqual([]);
        expect(ownerNotices({}, true)).toEqual([]);
        expect(ownerNotices(null, true)).toEqual([]);
        expect(ownerNotices(
            { review: [{ type: 'MUSIC', state: REVIEW_STATE.CLEAN }] }, true)).toEqual([]);
        expect(ownerNotices(
            { review: [{ type: 'MUSIC', state: REVIEW_STATE.CLEARED }] }, true)).toEqual([]);
    });

    it('does not dress a published video as a blocked one', () => {
        // The asymmetry that matters most. A MUSIC advisory or unfinished scan is a note on a
        // video that is playing normally; rendering it in the same alarming tone as HELD would
        // train owners to ignore the tone entirely, which is exactly when the one that matters
        // arrives.
        for (const state of [REVIEW_STATE.ADVISORY, REVIEW_STATE.UNCHECKED]) {
            const [notice] = ownerNotices({ review: [{ type: 'MUSIC', state }] }, true);
            expect(notice.hidden).toBe(false);
            expect(notice.tone).toBe('info');
        }
    });

    it('tells the owner of an unscanned explicit-content video that it is HIDDEN', () => {
        // The fail-open/fail-closed asymmetry, in the one place an owner meets it. The same
        // UNCHECKED state publishes for music and hides for nudity, so the music wording -- which
        // opens by saying the video is published -- would be false here in the direction that
        // matters most: the owner would go looking for a video nobody can see.
        const [notice] = ownerNotices(
            { review: [{ type: 'NUDITY', state: REVIEW_STATE.UNCHECKED }] }, true);

        expect(notice.body).toBe(ar.video.review.nudity.unchecked.body);
        expect(notice.body).not.toContain('منشور');
    });

    it('reports one notice per detector, worst first', () => {
        // The thing one column per video could not express. Order matters because the first
        // notice is the one read: "your video is hidden" outranks "we have made a note".
        const notices = ownerNotices({
            review: [
                { type: 'MUSIC', state: REVIEW_STATE.ADVISORY },
                { type: 'NUDITY', state: REVIEW_STATE.HELD },
            ],
        }, true);

        expect(notices.map((n) => n.type)).toEqual(['NUDITY', 'MUSIC']);
        expect(notices[0].hidden).toBe(true);
    });

    it('has a real string for every type and state it can show', () => {
        // t() returns the key itself when there is no string for it, so a missing translation is
        // a dotted key rendered on the page rather than a crash. This is what catches it.
        for (const type of Object.values(REVIEW_TYPE)) {
            for (const state of [REVIEW_STATE.HELD, REVIEW_STATE.REJECTED, REVIEW_STATE.ADVISORY,
                REVIEW_STATE.UNCHECKED]) {
                const [notice] = ownerNotices(
                    { review: [{ type, state, spans: [{ start: 1, end: 2 }] }] }, true);
                expect(notice.title).not.toContain('video.review');
                expect(notice.body).not.toContain('video.review');
            }
        }
    });
});

describe('the badge on a card', () => {
    it('gives a card two words and no reason', () => {
        // A grid of the owner's own videos is the one place several of these appear at once, and
        // "music at 0:12–0:31" repeated down a column is noise. The badge says which video to
        // open; the detail page says why.
        const badge = ownerBadge(
            { review: [{ type: 'MUSIC', state: REVIEW_STATE.HELD }] }, true);

        expect(badge.label).toBe(ar.video.review.music.held.badge);
        expect(badge.hidden).toBe(true);
    });

    it('shows the most serious finding when there are two', () => {
        // One badge, not two: two on a thumbnail is a layout problem and a reading problem.
        const badge = ownerBadge({
            review: [
                { type: 'MUSIC', state: REVIEW_STATE.ADVISORY },
                { type: 'NUDITY', state: REVIEW_STATE.REJECTED },
            ],
        }, true);

        expect(badge.label).toBe(ar.video.review.nudity.rejected.badge);
        expect(badge.hidden).toBe(true);
    });

    it('marks a published-but-noted video as not hidden', () => {
        expect(ownerBadge({ review: [{ type: 'MUSIC', state: REVIEW_STATE.ADVISORY }] }, true)
            .hidden).toBe(false);
    });

    it('is absent for strangers, cleared videos and unscanned ones', () => {
        expect(ownerBadge({ review: [{ type: 'MUSIC', state: REVIEW_STATE.HELD }] }, false))
            .toBeNull();
        expect(ownerBadge({ review: [{ type: 'MUSIC', state: REVIEW_STATE.CLEARED }] }, true))
            .toBeNull();
        expect(ownerBadge({}, true)).toBeNull();
    });

    it('has a real string for every type and state it can show', () => {
        for (const type of Object.values(REVIEW_TYPE)) {
            for (const state of [REVIEW_STATE.HELD, REVIEW_STATE.REJECTED, REVIEW_STATE.ADVISORY,
                REVIEW_STATE.UNCHECKED]) {
                expect(ownerBadge({ review: [{ type, state }] }, true).label)
                    .not.toContain('video.review');
            }
        }
    });
});
