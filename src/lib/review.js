import { t, tOptional } from '@/i18n';
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
    // The detector broke. Queued -- and whether it hides the video is PER TYPE: music publishes
    // (a model outage must not stop publishing), explicit content hides. That rule lives on the
    // backend, which is why a finding carries `holds` rather than this repo knowing the types.
    UNCHECKED: 'UNCHECKED',
    // Nothing looked, because a platform admin excused this channel from this detector. Publishes,
    // never queued. Written by the backend when it queues the job, not by the worker — the worker
    // is simply told to skip the scan and reports nothing, which is what makes the skip cheap.
    EXEMPT: 'EXEMPT',
    // A human looked and said it is fine.
    CLEARED: 'CLEARED',
    // A human looked and said it is not. Hidden, permanently.
    REJECTED: 'REJECTED',
};

// The two STATES that keep a video off the platform for every detector. Rendering all four as
// alarming would train reviewers to ignore all four.
const HIDING = new Set([REVIEW_STATE.HELD, REVIEW_STATE.REJECTED]);

/**
 * Whether a STATE, on its own, hides a video. This is the half of the answer a state can give:
 * HELD and REJECTED hide for every detector. It is NOT the whole answer -- UNCHECKED hides an
 * explicit-content finding and publishes a music one, and which types do that is a rule this
 * repo must not hold a copy of. Prefer {@link hidesVideo}, which reads the backend's answer.
 */
export const holdsVideo = (state) => HIDING.has(state);

/**
 * Whether THIS finding hides the video: the backend's `holds`, computed per (type, state) where
 * the fail-open/fail-closed rule lives, falling back to the state alone only for a finding that
 * did not carry it. The fallback exists for older payloads and for tests; on the wire `holds`
 * is always present.
 *
 * <p>Deriving this from the state here is what went wrong once: an UNCHECKED explicit-content
 * finding was shown in the informational tone, under a sentence that correctly said the video was
 * hidden, and sorted beneath a music note on a video that was playing fine.
 */
export const hidesVideo = (finding) =>
    (typeof finding?.holds === 'boolean' ? finding.holds : holdsVideo(finding?.state));

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
        hidden: hidesVideo(finding),
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
 *
 * A bucket for every KNOWN type even when empty (so a tab can render its empty state), and a
 * bucket for any type this build has never heard of. A new detector on the backend must show up
 * in the queue before this repo learns its name -- a finding silently dropped here is a video held
 * for review that no reviewer can reach.
 */
export const groupByType = (rows) => {
    const grouped = {};
    for (const type of Object.values(REVIEW_TYPE)) grouped[type] = [];
    for (const row of rows ?? []) {
        if (!row || !row.type) continue;
        if (!grouped[row.type]) grouped[row.type] = [];
        grouped[row.type].push(row);
    }
    return grouped;
};


// ------------------------------------------------------------------- the OWNER's side of a finding

// What the owner is told about, and what is silently nothing. CLEAN is a detector that ran and
// found nothing; CLEARED is a human who looked and said it is fine. Neither is the owner's
// business any more, and surfacing them would teach owners that a notice means nothing.
//
// Everything ELSE is shown -- including a state this build does not recognise, because the
// alternative is a video that has vanished with no message, which is the one outcome this field
// exists to prevent. A new state must degrade to an "unknown note", never to silence.
//
// EXEMPT is quiet for a second reason on top of "nothing happened to your video". Telling an owner
// which detectors their channel is not scanned by tells them what would and would not be caught,
// which is a thing to know and not a thing to publish. It is an operational fact about the
// platform's moderation and it belongs on the admin screen that set it.
const QUIET = new Set([REVIEW_STATE.CLEAN, REVIEW_STATE.CLEARED, REVIEW_STATE.EXEMPT]);

// Worst first. Hidden outranks published whatever the state -- "your video is hidden" is the
// notice that gets read -- then within each the order below; a state not listed sorts after the
// known ones.
const SEVERITY = [
    REVIEW_STATE.REJECTED,
    REVIEW_STATE.HELD,
    REVIEW_STATE.ADVISORY,
    REVIEW_STATE.UNCHECKED,
];
const severityOf = (state) => {
    const index = SEVERITY.indexOf(state);
    return index === -1 ? SEVERITY.length : index;
};
const worstFirst = (a, b) =>
    (Number(b.hidden) - Number(a.hidden)) || (severityOf(a.state) - severityOf(b.state));

/**
 * Which of the three things a finding cost the video — the axis the copy is built on.
 *
 * <p>`hidden` is the backend's `holds`, so the fail-open/fail-closed rule is read, never
 * reproduced. `refused` is the one distinction `holds` cannot make: REJECTED and HELD both hide,
 * but one is a decision and the other is a wait, and telling an owner their video is "under
 * review" after a human has refused it sends them to wait for something that already happened.
 * Knowing that REJECTED is a human's verdict is not the fail-closed rule — it is the reviewer
 * vocabulary this file already mirrors in {@link DECISIONS}.
 */
const outcomeOf = (state, hidden) => {
    if (!hidden) return 'published';
    return state === REVIEW_STATE.REJECTED ? 'refused' : 'hidden';
};

/**
 * The owner-facing words for one finding: WHAT was found, from the per-(type, state) catalog, and
 * WHAT IT COST, from the outcome block alone.
 *
 * <p><b>The split is the point, and it is the fix for a real duplication.</b> The per-(type,
 * state) prose used to carry the visibility claim itself — `music.unchecked` said the video was
 * published and `nudity.unchecked` said it was hidden — which is a second copy of
 * `ReviewFindingType.failsClosed()`, written in Arabic, that no test on either side can compare
 * against the first. Both were right, and both would have stayed as written on the day a type is
 * made to fail closed: an owner told their video is published, going to look for something nobody
 * can see. Now the detector blocks are clauses about the detector, and the sentence that says who
 * can see the video comes from `holds` in every case.
 *
 * <p>A type or state this build has never heard of has no clause, so it gets the outcome sentence
 * on its own — which is less than the backend knows and is still true, and is the whole reason a
 * finding carries `holds` rather than this repo carrying the rule.
 */
const copyFor = (type, state, hidden, spans) => {
    const outcome = `video.review.outcome.${outcomeOf(state, hidden)}`;
    const key = `video.review.${String(type).toLowerCase()}.${String(state).toLowerCase()}`;
    const clause = spans
        ? tOptional(`${key}.bodyWithSpans`) && t(`${key}.bodyWithSpans`, { spans: spans.text })
        : tOptional(`${key}.body`);
    return {
        title: t(`${outcome}.title`),
        badge: t(`${outcome}.badge`),
        body: clause ? clause + t(`${outcome}.suffix`) : t(`${outcome}.body`),
    };
};

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
 * <p>THIS IS THE NOTIFICATION MECHANISM: a held video is READY, visible and reachable by nobody,
 * and there is no email or SSE anywhere in this design, so if this returns nothing the owner's
 * only evidence is that their upload vanished. Two consequences: `hidden` and `tone` come from the
 * backend's `holds`, never from the state alone (see {@link hidesVideo} for the bug that closes),
 * and a state or type this build does not know is rendered as a generic note rather than dropped.
 */
export const ownerNotices = (video, isOwner) => {
    if (!isOwner || !Array.isArray(video?.review)) return [];
    return video.review
        .filter((finding) => finding && (hidesVideo(finding) || !QUIET.has(finding.state)))
        .map((finding) => {
            const spans = formatSpans(finding.spans);
            const hidden = hidesVideo(finding);
            const { title, body, badge } = copyFor(finding.type, finding.state, hidden, spans);
            return {
                type: finding.type,
                state: finding.state,
                hidden,
                tone: hidden ? 'warning' : 'info',
                title,
                body,
                badge,
                spans,
            };
        })
        .sort(worstFirst);
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
    return { hidden: worst.hidden, label: worst.badge };
};
