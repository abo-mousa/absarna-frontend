import { t } from '@/i18n';

/**
 * Marks a video that plays from YouTube rather than from this platform.
 *
 * <p>Driven by `sourceType`, so it is self-maintaining in the direction that matters: the moment
 * an owner uploads the original file, `sourceType` flips `YOUTUBE` → `UPLOAD` and the badge
 * disappears on its own. Nothing has to remember to remove it.
 *
 * <p><b>An inline SVG, because lucide-react ships no brand marks</b> — the same reason
 * `ShareButton` uses text pills for WhatsApp and Telegram rather than approximating their logos.
 * The mark is YouTube's own, unmodified and in its own red: their brand guidelines allow it to
 * identify YouTube content and forbid recolouring or distorting it, and their API terms want
 * attribution rather than less of it. So it is used as-is or not at all — do not restyle it to fit
 * a palette.
 *
 * <p>Rendered bare — no background plate. Legibility over a thumbnail comes from a drop-shadow on
 * the mark itself, which leaves the logo unmodified.
 *
 * @param showLabel adds the word beside the mark. Off on cards, where the thumbnail corner is
 *                  tight and the mark alone is unmistakable; on where there is room to be explicit.
 */
function SourceBadge({ sourceType, showLabel = false, className = '' }) {
    if (sourceType !== 'YOUTUBE') return null;

    return (
        <span
            title={t('youtube.badge')}
            className={`inline-flex items-center gap-1.5 ${className}`}
        >
            <YouTubeMark />
            {showLabel && (
                <span className="text-xs font-semibold text-text-secondary">{t('youtube.badge')}</span>
            )}
            {/* The mark carries the meaning visually; this is what a screen reader gets, since an
                unlabelled decorative SVG would announce nothing at all. */}
            {!showLabel && <span className="sr-only">{t('youtube.badge')}</span>}
        </span>
    );
}

/**
 * The mark alone, with no plate behind it.
 *
 * <p>A drop-shadow rather than a background pill, because this sits on arbitrary video thumbnails
 * and something has to keep it legible against a light or busy one. The shadow does that without
 * putting a box around the logo — and without tinting the logo itself, which YouTube's brand
 * guidelines do not allow.
 */
function YouTubeMark() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"
             className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
            <path
                fill="#FF0000"
                d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2
                   31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6
                   s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8z"
            />
            <path fill="#FFFFFF" d="M9.6 15.6V8.4l6.3 3.6z" />
        </svg>
    );
}

export default SourceBadge;
