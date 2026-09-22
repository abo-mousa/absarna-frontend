import { describe, expect, it } from 'vitest';
import {
    DECISIONS, REVIEW_STATE, REVIEW_TYPE, detailOf, findingRow, groupByType, hidesVideo,
    holdsVideo, ownerBadge, ownerNotices,
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
        // The label reads in the locale's digits (the default here is Arabic) while `seekTo`
        // stays a number — the label is for the reviewer, the seek is for the video element.
        expect(row.spans[0].label).toBe('٠:١٢–٠:٣١');
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

    it('keeps a finding from a detector this build has never heard of', () => {
        // The open-set rule on the reading side. A new detector lands on the backend before this
        // repo learns its name, and its findings are still videos held for review; dropping them
        // here would leave a queue that no reviewer can empty and nobody can see is non-empty.
        const grouped = groupByType([
            findingRow({ videoId: 9, type: 'SPEAKER', state: REVIEW_STATE.HELD, holds: true }),
        ]);
        expect(grouped.SPEAKER).toHaveLength(1);
        expect(grouped[REVIEW_TYPE.MUSIC]).toEqual([]);
    });
});

describe('whether a finding hides the video', () => {
    it('reads the backend’s answer, which is per (type, state)', () => {
        // The fail-open/fail-closed rule lives in the backend's ReviewFindingType and this repo
        // must not hold a copy. The same UNCHECKED state hides an explicit-content finding and
        // publishes a music one, and only `holds` can say which.
        expect(hidesVideo({ type: 'NUDITY', state: REVIEW_STATE.UNCHECKED, holds: true })).toBe(true);
        expect(hidesVideo({ type: 'MUSIC', state: REVIEW_STATE.UNCHECKED, holds: false })).toBe(false);
        expect(hidesVideo({ type: 'MUSIC', state: REVIEW_STATE.HELD, holds: true })).toBe(true);
    });

    it('falls back to the state alone only when holds is missing', () => {
        expect(hidesVideo({ type: 'MUSIC', state: REVIEW_STATE.HELD })).toBe(true);
        expect(hidesVideo({ type: 'MUSIC', state: REVIEW_STATE.ADVISORY })).toBe(false);
        expect(hidesVideo(null)).toBe(false);
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
        // Title from the OUTCOME block, body from the detector's own clause — see copyFor.
        expect(notice.title).toBe(ar.video.review.outcome.hidden.title);
        expect(notice.body).toContain(ar.video.review.outcome.hidden.suffix);
        // The timestamps are the actionable half -- "held for review" alone gives the owner
        // nothing to go and check. In the locale's digits, like every number the app writes: this
        // sentence also carries a count, and the two must not be in different scripts.
        expect(notice.body).toContain('٠:١٢–٠:٣١');
        expect(notice.body).not.toContain('{spans}');
    });

    it('falls back to the span-less wording when there are no usable spans', () => {
        // UNCHECKED carries no spans at all by construction, and a malformed detail reaches here
        // as an empty list. Neither may leave a literal {spans} on the page.
        const [notice] = ownerNotices(
            { review: [{ type: 'MUSIC', state: REVIEW_STATE.HELD, spans: [] }] }, true);

        expect(notice.body).toBe(
            ar.video.review.music.held.body + ar.video.review.outcome.hidden.suffix);
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

    it('says nothing about a video its channel is exempt from scanning', () => {
        // EXEMPT is quiet for TWO reasons, and the second is the one that makes it a rule rather
        // than a tidy-up. The first is the ordinary one: nothing happened to this video, so there
        // is no notice to give. The second is that telling an owner which detectors their channel
        // is not scanned by tells them what would and would not be caught — an operational fact
        // about the platform's moderation, which belongs on the admin screen that set it and
        // nowhere near the person uploading.
        expect(ownerNotices(
            { review: [{ type: 'MUSIC', state: REVIEW_STATE.EXEMPT, holds: false }] }, true))
            .toEqual([]);
        expect(ownerNotices(
            { review: [{ type: 'NUDITY', state: REVIEW_STATE.EXEMPT, holds: false }] }, true))
            .toEqual([]);
    });

    it('still shows a real finding sitting beside an exempt one', () => {
        // Per (channel, detector) on the backend, so a channel excused from music is not thereby
        // excused from explicit content. Swallowing the whole notice list because one entry is
        // EXEMPT would turn the cheap exemption into a silent grant of the consequential one.
        const notices = ownerNotices({
            review: [
                { type: 'MUSIC', state: REVIEW_STATE.EXEMPT, holds: false },
                { type: 'NUDITY', state: REVIEW_STATE.HELD, holds: true },
            ],
        }, true);

        expect(notices).toHaveLength(1);
        expect(notices[0].type).toBe('NUDITY');
        expect(notices[0].hidden).toBe(true);
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
        // UNCHECKED state publishes for music and hides for nudity, and the wording has to follow
        // — saying "published" here would send the owner looking for a video nobody can see.
        const [notice] = ownerNotices(
            { review: [{ type: 'NUDITY', state: REVIEW_STATE.UNCHECKED, holds: true }] }, true);

        expect(notice.body).toBe(
            ar.video.review.nudity.unchecked.body + ar.video.review.outcome.hidden.suffix);
        expect(notice.body).not.toContain('منشور');
    });

    /**
     * <b>And it follows `holds`, not the detector's name.</b>
     *
     * <p>The same (type, state) pair, worded both ways, from the backend's flag alone. This is
     * the duplication the copy used to carry: `music.unchecked` said «الفيديو منشور» and
     * `nudity.unchecked` said «لن يظهر للزوار», which is `ReviewFindingType.failsClosed()`
     * restated in Arabic where nothing can compare it against the original. Both were right on
     * the day they were written, and both would have stayed exactly as written the day a type is
     * made to fail closed — wrong in the one direction that matters, and invisible from here.
     */
    it('words the same finding from the backend’s holds, whichever detector it is', () => {
        const wording = (type, holds) =>
            ownerNotices({ review: [{ type, state: REVIEW_STATE.UNCHECKED, holds }] }, true)[0];

        for (const type of ['MUSIC', 'NUDITY']) {
            expect(wording(type, true).body).toContain(ar.video.review.outcome.hidden.suffix);
            expect(wording(type, true).title).toBe(ar.video.review.outcome.hidden.title);
            expect(wording(type, false).body).toContain(ar.video.review.outcome.published.suffix);
            expect(wording(type, false).title).toBe(ar.video.review.outcome.published.title);
        }

        // The detector's own clause is unchanged by either — it describes what was found, and
        // what was found does not depend on what it cost.
        expect(wording('MUSIC', true).body).toContain(ar.video.review.music.unchecked.body);
        expect(wording('MUSIC', false).body).toContain(ar.video.review.music.unchecked.body);
    });

    it('colours and sorts a hidden unscanned video by the backend’s holds, not by its state', () => {
        // The bug this closes: the sentence above said "hidden" while the chip beside it was in
        // the informational tone and the badge reported hidden: false, because both were derived
        // from the state alone -- and UNCHECKED, read without its type, publishes. On the wire the
        // backend says `holds: true` for this finding, and that is what decides the tone.
        const video = {
            review: [
                { type: 'MUSIC', state: REVIEW_STATE.ADVISORY, holds: false },
                { type: 'NUDITY', state: REVIEW_STATE.UNCHECKED, holds: true },
            ],
        };
        const notices = ownerNotices(video, true);

        expect(notices.map((n) => n.type)).toEqual(['NUDITY', 'MUSIC']);
        expect(notices[0].hidden).toBe(true);
        expect(notices[0].tone).toBe('warning');
        expect(notices[1].hidden).toBe(false);
        expect(notices[1].tone).toBe('info');
        expect(ownerBadge(video, true)).toEqual({
            hidden: true,
            label: ar.video.review.outcome.hidden.badge,
        });
    });

    it('renders a state it does not recognise as a note, never as silence', () => {
        // A new state on the backend must degrade to "unknown note", not fall through to "fine":
        // with no notice at all, a hidden video is indistinguishable from a bug. Which of the two
        // generic notes is chosen comes from `holds`, the one thing the backend can still tell us.
        const [hiddenNote] = ownerNotices(
            { review: [{ type: 'MUSIC', state: 'QUARANTINED', holds: true }] }, true);
        expect(hiddenNote.hidden).toBe(true);
        expect(hiddenNote.tone).toBe('warning');
        expect(hiddenNote.title).toBe(ar.video.review.outcome.hidden.title);
        expect(hiddenNote.body).toBe(ar.video.review.outcome.hidden.body);
        expect(hiddenNote.title).not.toContain('video.review');

        const [publishedNote] = ownerNotices(
            { review: [{ type: 'MUSIC', state: 'NOTED', holds: false }] }, true);
        expect(publishedNote.hidden).toBe(false);
        expect(publishedNote.tone).toBe('info');
        expect(publishedNote.body).toBe(ar.video.review.outcome.published.body);
    });

    it('renders a detector it does not recognise the same way', () => {
        const [notice] = ownerNotices(
            { review: [{ type: 'SPEAKER', state: REVIEW_STATE.HELD, holds: true }] }, true);
        expect(notice.hidden).toBe(true);
        expect(notice.title).toBe(ar.video.review.outcome.hidden.title);
        expect(ownerBadge(
            { review: [{ type: 'SPEAKER', state: REVIEW_STATE.HELD, holds: true }] }, true))
            .toEqual({ hidden: true, label: ar.video.review.outcome.hidden.badge });
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
        // "music at ٠:١٢–٠:٣١" repeated down a column is noise. The badge says which video to
        // open; the detail page says why.
        const badge = ownerBadge(
            { review: [{ type: 'MUSIC', state: REVIEW_STATE.HELD }] }, true);

        expect(badge.label).toBe(ar.video.review.outcome.hidden.badge);
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

        // `refused`, not `hidden`: a human decided, and «قيد المراجعة» would send the owner to
        // wait for something that has already happened.
        expect(badge.label).toBe(ar.video.review.outcome.refused.badge);
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
