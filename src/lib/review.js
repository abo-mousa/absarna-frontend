import { t } from '@/i18n';
import { formatSpan, formatSpans, seekTargetFor } from '@/lib/spans';

// The moderation queue across every detector, not just music.
//
// The unit here is a FINDING, not a video: a video can carry a music verdict and an
// explicit-content verdict at once, and a reviewer may legitimately clear one and reject the
// other. This file holds both sides of that: the reviewer's queue, and the owner-facing notice on
// their own video page. lib/spans.js underneath it is pure formatting and knows about neither.

export const REVIEW_TYPE = {
    MUSIC: 'MUSIC',
    NUDITY: 'NUDITY',
};

export const REVIEW_STATE = {
    // The detector ran and found nothing. Never in the queue -- there is nothing to look at.
    CLEAN: 'CLEAN',
    // Worth a human's time; does not hide the video.
    ADVISORY: 'ADVISORY',
    // Hides the video. The case that MUST be explained: with no notice it is indistinguishable
    // from a bug, and the owner's only evidence is that their upload vanished.
    HELD: 'HELD',
    // The detector broke. Published, and queued -- a model outage must not stop publishing.
    UNCHECKED: 'UNCHECKED',
    // A human looked and said it is fine.
    CLEARED: 'CLEARED',
    // A human looked and said it is not. Hidden, permanently.
    REJECTED: 'REJECTED',
};

// The two that keep a video off the platform. Rendering
// all four as alarming would train reviewers to ignore all four.
const HIDING = new Set([REVIEW_STATE.HELD, REVIEW_STATE.REJECTED]);

export const holdsVideo = (state) => HIDING.has(state);

// What a reviewer may write. Mirrors ReviewService.DECISIONS, and deliberately NOT the machine's
// vocabulary: writing HELD/ADVISORY/UNCHECKED/CLEAN back would put the row into the set the worker
// may overwrite, so the next redelivery would silently undo the reviewer.
export const DECISIONS = [REVIEW_STATE.CLEARED, REVIEW_STATE.REJECTED];

/**
 * Spans out of a finding's stored detail, tolerating BOTH shapes.
 *
 * A finding written by a v6 worker carries {type, outcome, peak, spans}. A finding backfilled
 * from the old music column carries the v5 shape, {disposition, spans, peak, advisory} -- see
 * migration 043, which stores it verbatim rather than rewriting history into a shape the worker
 * never sent. Both have `spans`, but neither is guaranteed, and a finding with unusable detail is
 * still a finding: the STATE is what gates the video, so losing the jump-list must not lose the
 * row.
 */
export const detailOf = (raw) => {
    if (!raw) return { spans: [], peak: null, label: null, shape: null };
    let parsed = raw;
    if (typeof raw === 'string') {
        try {
            parsed = JSON.parse(raw);
        } catch {
            return { spans: [], peak: null, label: null, shape: null };
        }
    }
    return {
        spans: Array.isArray(parsed?.spans) ? parsed.spans : [],
        peak: typeof parsed?.peak === 'number' ? parsed.peak : null,
        label: parsed?.topLabel ?? null,
        // v6 calls it `shape`, the backfilled v5 rows call it `disposition`. Music distinguishes
        // HEAD/TAIL/EDGES/LOCALISED/PERVASIVE because an intro sting is a different product
        // decision from a wall-to-wall soundtrack; explicit content has no equivalent, because a
        // confirmed scene is disqualifying wherever it sits.
        shape: parsed?.shape ?? parsed?.disposition ?? null,
    };
};

/**
 * One queue row, reduced to what the screen needs.
 *
 * Pure, so the thing worth checking -- which spans a reviewer is offered and where each one sends
 * the playhead -- is testable without mounting a player or a page.
 *
 * ALL the spans, unlike the owner-facing notice, which truncates to three. A reviewer is deciding,
 * and skipping the eighth span is how a decision gets made on incomplete evidence.
 *
 * THE SPANS ARE A JUMP-LIST, NOT AN EDIT DECISION LIST. Measured on a recording that is music end
 * to end they cover 63% of it. Nothing here should drive a trim or a mute.
 */
export const findingRow = (finding) => {
    if (!finding) return null;
    const { spans, peak, label, shape } = detailOf(finding.detail);
    const type = finding.type;
    const state = finding.state;
    return {
        videoId: finding.videoId,
        title: finding.title,
        channelId: finding.channelId,
        type,
        state,
        hidden: finding.holds ?? holdsVideo(state),
        detectedAt: finding.detectedAt,
        peak,
        label,
        shape,
        // Why this row is in the queue, in the reviewer's own words, and per TYPE: "possibly music
        // under speech" and "possible explicit content" are different problems and a shared
        // sentence would serve neither.
        reason: type && state
            ? t(`admin.review.reason.${type.toLowerCase()}.${String(state).toLowerCase()}`)
            : null,
        spans: spans
            .map((span) => ({
                label: formatSpan(span),
                seekTo: seekTargetFor(span),
                start: span.start,
                end: span.end,
            }))
            // A span whose numbers will not format is one a reviewer cannot act on; offering it as
            // an unlabelled button that seeks to NaN is worse than leaving it out.
            .filter((span) => span.label !== null && span.seekTo !== null),
        coveredSeconds: spans.reduce(
            (total, span) => total + (Number(span.end) - Number(span.start) || 0), 0),
    };
};

/**
 * Rows grouped by type, so a tab can show its own count without refetching.
 *
 * ONE ROW PER FINDING, so a video flagged by two detectors appears under both tabs. That is the
 * shape the backend serves and the right one for deciding: the two verdicts are independent, and
 * collapsing them into one row would force a reviewer to answer both questions at once.
 */
export const groupByType = (rows) => {
    const grouped = {};
    for (const type of Object.values(REVIEW_TYPE)) grouped[type] = [];
    for (const row of rows ?? []) {
        if (row && grouped[row.type]) grouped[row.type].push(row);
    }
    return grouped;
};


// ------------------------------------------------------------------- the OWNER's side of a finding

// What the owner is told about, and what is silently nothing. CLEAN is a detector that ran and
// found nothing; CLEARED is a human who looked and said it is fine. Neither is the owner's
// business any more, and surfacing them would teach owners that a notice means nothing.
const OWNER_VISIBLE = new Set([
    REVIEW_STATE.HELD,
    REVIEW_STATE.REJECTED,
    REVIEW_STATE.ADVISORY,
    REVIEW_STATE.UNCHECKED,
]);

// Worst first, so a card's single badge and a page's first notice both describe the thing that
// actually happened to the video rather than whichever detector the backend listed first.
const SEVERITY = [
    REVIEW_STATE.REJECTED,
    REVIEW_STATE.HELD,
    REVIEW_STATE.ADVISORY,
    REVIEW_STATE.UNCHECKED,
];

/**
 * What to tell this viewer about this video's moderation, worst first — or an empty list.
 *
 * <p>Empty is the answer for almost every call: an unscanned video, a clean one, a cleared one,
 * and anybody who is not the owner. <b>The backend does not send `review` to a stranger at all</b>
 * (ReviewAttacher.attachOwnerVerdicts), so the isOwner check here is a second lock on the same
 * door rather than the only one — which is the right shape for a disclosure rule, because neither
 * side can leak it alone.
 *
 * <p><b>One notice per FINDING, not one per video.</b> A video can be held for music and noted for
 * explicit content at the same time, and those are two different things to do something about.
 * Collapsing them would tell the owner about one problem and hide the other; the old music-only
 * notice could not express the question at all.
 *
 * <p>Replaced `musicNotice`, which read `video.musicReview` — a column that no longer exists.
 */
export const ownerNotices = (video, isOwner) => {
    if (!isOwner || !Array.isArray(video?.review)) return [];
    return video.review
        .filter((finding) => OWNER_VISIBLE.has(finding?.state))
        .slice()
        .sort((a, b) => SEVERITY.indexOf(a.state) - SEVERITY.indexOf(b.state))
        .map((finding) => {
            const spans = formatSpans(finding.spans);
            const hidden = holdsVideo(finding.state);
            const key = `video.review.${String(finding.type).toLowerCase()}`
                + `.${String(finding.state).toLowerCase()}`;
            return {
                type: finding.type,
                state: finding.state,
                hidden,
                // `warning` for the states that hide the video and `info` for the ones that do
                // not. The tone is load-bearing, not decorative: one of these means "nobody can
                // see your video" and the other means "we have made a note". Rendering both in
                // red would train owners to ignore both.
                tone: hidden ? 'warning' : 'info',
                title: t(`${key}.title`),
                body: spans ? t(`${key}.bodyWithSpans`, { spans: spans.text }) : t(`${key}.body`),
                spans,
            };
        });
};

/**
 * The one badge for a card in a grid, or null.
 *
 * <p>Separate from {@link ownerNotices} because a card has room for two words and a detail page
 * has room for a sentence — and because a card must not carry the reason. A grid of the owner's
 * own videos is the one place the platform shows several of these at once, and "music at
 * 0:12–0:31" repeated down a column is noise; the badge says which video to open.
 *
 * <p><b>One badge, the most serious.</b> Two badges on a thumbnail is a layout problem and a
 * reading problem; the page behind it lists every finding.
 */
export const ownerBadge = (video, isOwner) => {
    const worst = ownerNotices(video, isOwner)[0];
    if (!worst) return null;
    return {
        hidden: worst.hidden,
        label: t(`video.review.${String(worst.type).toLowerCase()}`
            + `.${String(worst.state).toLowerCase()}.badge`),
    };
};
