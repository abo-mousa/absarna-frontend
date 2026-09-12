import { t } from '@/i18n';

// Turning a detector's flagged stretches of a video into something a person can read.
//
// FORMATTING ONLY -- no verdicts, no policy, no idea which detector produced the spans. It was
// lib/musicReview.js when music was the only detector; everything in it that knew about music has
// moved to lib/review.js, which is per-finding. What is left is bidi-safe timestamps and ranges,
// which are the same problem whatever found them.
//
// THE SPANS ARE A JUMP-LIST, NOT AN EDIT DECISION LIST. Measured on a recording that is music end
// to end they cover 63% of it, because the classifier dips below threshold mid-track. Nothing
// here should ever drive a trim or a mute.

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
            ? t('video.review.moreSpansOne')
            : t('video.review.moreSpans', { count: remaining })}`;

    return { text, shown: shown.length, total: usable.length };
};

/**
 * Where to send the playhead for a span — <b>two seconds before it, not at it</b>.
 *
 * <p>A span begins at the window the classifier first crossed the threshold in, and the window is
 * 10.24s wide, so the sound that triggered it can sit anywhere inside. Landing exactly on the
 * boundary regularly drops the listener into silence just before the flagged audio, which reads
 * as a false positive when it is not one. Two seconds earlier costs nothing and starts them in
 * context.
 */
export const SEEK_LEAD_IN_SECONDS = 2;

export const seekTargetFor = (span) => {
    if (!span || typeof span.start !== 'number' || !Number.isFinite(span.start)) return null;
    return Math.max(0, span.start - SEEK_LEAD_IN_SECONDS);
};
