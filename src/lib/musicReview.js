import { t } from '@/i18n';

// What the backend can say about a video's music review, and what each value means HERE.
//
// Absarna is an Islamic platform and music must not be published on it. The detector lives in
// absarna-worker, the column in absarna-backend, and this file is the last step: turning a verdict
// into something the person who uploaded the video can act on.
//
// Only two of these actually hide a video. That asymmetry is the whole reason this is not a
// boolean, and it is why the UI must not flatten it either: telling an owner "your video was
// rejected" when it is published and merely queued would be a lie in the direction that makes
// people stop uploading.
export const MUSIC_REVIEW = {
    // Music was found. The video is READY and visible and reachable by nobody. This is the case
    // that MUST be explained: with no notice it is indistinguishable from a bug, and the owner's
    // only evidence is that their video vanished.
    HELD: 'HELD',
    // A human listened and refused it. Also hidden, and permanently.
    REJECTED: 'REJECTED',
    // Possibly speech over a music bed. PUBLISHED, and queued for a human. The rule behind it is
    // measured on one reciter in one hall, which is not enough to hide anything on.
    ADVISORY: 'ADVISORY',
    // The detector broke. PUBLISHED, and queued. A model outage must not stop publishing.
    UNCHECKED: 'UNCHECKED',
    // A human listened and cleared it. Published, and no longer anyone's business.
    CLEARED: 'CLEARED',
};

// The verdicts that keep a video off the platform.
const HIDING = new Set([MUSIC_REVIEW.HELD, MUSIC_REVIEW.REJECTED]);

export const hidesVideo = (musicReview) => HIDING.has(musicReview);

// mm:ss, or h:mm:ss past an hour — the same shape Video.duration already uses, so a span reads
// like a timestamp the owner can scrub to rather than a number of seconds they have to convert.
export const formatTimestamp = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
        return null;
    }
    const seconds = Math.floor(totalSeconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
};

// "0:12–0:31". An en dash, not a hyphen: a hyphen next to digits reads as part of the number.
export const formatSpan = (span) => {
    if (!span) return null;
    const start = formatTimestamp(span.start);
    const end = formatTimestamp(span.end);
    return start && end ? `${start}–${end}` : null;
};

/**
 * Wrap left-to-right text so it survives being dropped into an Arabic sentence.
 *
 * <p><b>Without this a time range renders backwards.</b> Every string in this app sits in an RTL
 * paragraph, and to the bidi algorithm an en dash is neutral: between two numbers it takes the
 * paragraph's RTL direction, and the two numbers are then laid out right-to-left around it. The
 * reader sees `0:45–0:05` — the end of the span before its start. A list of ranges reverses the
 * same way, so the first stretch of music appears last.
 *
 * <p>It does not survive a copy-paste, which is how it got past review: the clipboard carries
 * logical order, and only the screen is wrong.
 *
 * <p>U+2066 LRI … U+2069 PDI rather than U+200E LRM: an isolate makes the range a self-contained
 * LTR island, so it is laid out internally as LTR *and* takes its place in the surrounding RTL
 * flow as one unit. The marks alone fix the range and leave a list of them ambiguous. In JSX,
 * `<bdi>` does the same job and is preferred wherever an element already exists.
 */
export const isolateLtr = (text) => (text ? `\u2066${text}\u2069` : text);

/**
 * At most `limit` spans, joined into one phrase ready to drop into a sentence.
 *
 * <p>TRUNCATED ON PURPOSE. The spans are gappy — measured on a recording that is music end to
 * end they come back as eight separate stretches covering 63% of it, because the classifier dips
 * below threshold mid-track. Listing all eight would read as eight problems rather than one, and
 * the owner only needs enough to go and listen.
 *
 * <p><b>The remainder belongs to this phrase, not to a sentence after it.</b> It used to render
 * as its own paragraph, landing «و5 مواضع أخرى.» after the body had already finished with
 * «يمكنك رفع نسخة أخرى بدون موسيقى.» — a fragment two sentences away from the list it
 * belonged to. Built here so every caller gets it in the right place by default.
 */
export const formatSpans = (spans, limit = 3) => {
    if (!Array.isArray(spans) || spans.length === 0) return null;
    const usable = spans.map(formatSpan).filter(Boolean);
    if (usable.length === 0) return null;

    const shown = usable.slice(0, limit).map(isolateLtr);
    const remaining = usable.length - shown.length;
    // U+060C, the Arabic comma. Latin digits throughout: this app settled that question once,
    // in lib/numbers.js, after having two digit systems on one card.
    const list = shown.join('، ');
    // Arabic counted nouns agree with the number, so one form cannot serve: «و1 مواضع أخرى»
    // and «و5 موضع آخر» are both wrong. One takes the singular, 3-10 the plural — which is
    // the range this covers in practice, since the remainder is the tail of a list capped at
    // three. (Strictly 11+ wants «موضعًا آخر»; a video with fourteen separate stretches of
    // music is PERVASIVE and is not being read span by span.)
    const text = remaining === 0
        ? list
        : `${list} ${remaining === 1
            ? t('video.musicReview.moreSpansOne')
            : t('video.musicReview.moreSpans', { count: remaining })}`;

    return { text, shown: shown.length, total: usable.length };
};

/**
 * What to tell this viewer about this video's music review, or null for "nothing".
 *
 * Null is the answer for almost every call: an unscanned video, a cleared one, and anybody who is
 * not the owner. The backend does not even send `musicReview` to a stranger — see
 * MusicReviewService.attachOwnerVerdicts — so this is a second lock on the same door rather than
 * the only one, which is the right shape for a disclosure rule.
 *
 * @param video    a VideoDTO
 * @param isOwner  whether this viewer manages the video's channel (or is a platform admin)
 * @returns {{tone: string, title: string, body: string, spans: object|null, hidden: boolean}|null}
 */
export const musicNotice = (video, isOwner) => {
    const review = video?.musicReview;
    if (!isOwner || !review || review === MUSIC_REVIEW.CLEARED) return null;

    const spans = formatSpans(video.musicSpans);
    const hidden = hidesVideo(review);

    // `warning` for the two that hide the video and `info` for the two that do not. The tone is
    // load-bearing, not decorative: one of these means "nobody can see your video" and the other
    // means "we have made a note". Rendering both in red would train owners to ignore both.
    const tone = hidden ? 'warning' : 'info';
    const key = `video.musicReview.${review.toLowerCase()}`;

    return {
        tone,
        hidden,
        review,
        title: t(`${key}.title`),
        body: spans
            ? t(`${key}.bodyWithSpans`, { spans: spans.text })
            : t(`${key}.body`),
        spans,
    };
};

/**
 * The short badge for a card in a grid, or null.
 *
 * Separate from {@link musicNotice} because a card has room for two words and a detail page has
 * room for a sentence — and because a card must not carry the reason. A grid of the owner's own
 * videos is the one place the platform shows several of these at once, and "music at 0:12–0:31"
 * repeated down a column is noise; the badge says which video to open.
 */
export const musicBadge = (video, isOwner) => {
    const review = video?.musicReview;
    if (!isOwner || !review || review === MUSIC_REVIEW.CLEARED) return null;
    return {
        hidden: hidesVideo(review),
        label: t(`video.musicReview.${review.toLowerCase()}.badge`),
    };
};

// ------------------------------------------------------------------------------ the review queue

// What a reviewer may decide. Deliberately NOT the machine's vocabulary: HELD/ADVISORY/UNCHECKED
// are what the pipeline writes, and the backend refuses them here — writing one back would put
// the row into the set the worker may overwrite, so the next redelivery would silently undo the
// reviewer. Mirrors MusicReviewService.DECISIONS.
export const DECISIONS = [MUSIC_REVIEW.CLEARED, MUSIC_REVIEW.REJECTED];

/**
 * One queue row, reduced to what the screen needs.
 *
 * Pure, so the thing worth checking — which spans a reviewer is offered and where each one sends
 * the playhead — is testable without mounting a player or a page.
 *
 * <p><b>The seek target is the span's start minus a lead-in, not the span's start.</b> A span
 * begins at the window the classifier first crossed the threshold in, and the window is 10.24s
 * wide, so the sound that triggered it can sit anywhere inside it — landing exactly on the
 * boundary regularly drops the reviewer into silence just before the music, which reads as a
 * false positive when it is not one. Two seconds earlier costs nothing and starts them in
 * context.
 */
export const SEEK_LEAD_IN_SECONDS = 2;

export const seekTargetFor = (span) => {
    if (!span || typeof span.start !== 'number' || !Number.isFinite(span.start)) return null;
    return Math.max(0, span.start - SEEK_LEAD_IN_SECONDS);
};

/**
 * The queue row a reviewer acts on.
 *
 * ALL the spans, unlike {@link formatSpans} — that one truncates to three because it is a notice
 * for the video's owner, who needs to know roughly where to look. A reviewer is deciding, and
 * skipping the eighth span is how a decision gets made on incomplete evidence.
 */
export const reviewRow = (video) => {
    if (!video) return null;
    const spans = Array.isArray(video.musicSpans) ? video.musicSpans : [];
    return {
        id: video.id,
        title: video.title,
        review: video.musicReview,
        hidden: hidesVideo(video.musicReview),
        // Why this row is in the queue at all, in the reviewer's own words.
        reason: video.musicReview
            ? t(`video.musicReview.${String(video.musicReview).toLowerCase()}.queueReason`)
            : null,
        spans: spans
            .map((span) => ({
                label: formatSpan(span),
                seekTo: seekTargetFor(span),
                start: span.start,
                end: span.end,
            }))
            // A span whose numbers will not format is one a reviewer cannot act on; offering it
            // as an unlabelled button that seeks to NaN is worse than leaving it out.
            .filter((span) => span.label !== null && span.seekTo !== null),
        // Total seconds of flagged audio, which is the one number that separates "an intro sting"
        // from "the video is music" at a glance, without reading eight timestamps.
        coveredSeconds: spans.reduce(
            (total, span) => total + (Number(span.end) - Number(span.start) || 0), 0),
    };
};

