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

// "0:12–0:31". An en dash, not a hyphen: these are read right-to-left alongside Arabic text and a
// hyphen reads as part of the number.
export const formatSpan = (span) => {
    if (!span) return null;
    const start = formatTimestamp(span.start);
    const end = formatTimestamp(span.end);
    return start && end ? `${start}–${end}` : null;
};

// At most `limit` spans, joined.
//
// TRUNCATED ON PURPOSE. The spans are gappy — measured on a recording that is music end to end
// they come back as eight separate stretches covering 63% of it, because the classifier dips
// below threshold mid-track. Listing all eight would read as eight problems rather than one, and
// the owner only needs enough to go and listen. The count is what tells them there are more.
export const formatSpans = (spans, limit = 3) => {
    if (!Array.isArray(spans) || spans.length === 0) return null;
    const shown = spans.slice(0, limit).map(formatSpan).filter(Boolean);
    if (shown.length === 0) return null;
    return { text: shown.join('، '), shown: shown.length, total: spans.length };
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
