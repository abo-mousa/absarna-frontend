import { t } from '@/i18n';
import { ChevronBack, ChevronForward } from './DirectionalIcon';

/**
 * Previous / position / next, for a list the backend pages rather than accumulates.
 *
 * <h4>Why this exists as a shared component</h4>
 *
 * <p>Most lists in this app are "load more" (`useInfiniteQuery`, pages accumulating into one
 * growing grid), which needs no pager at all. The two moderation queues are the exception: a
 * reviewer works a queue from the top and wants to go back to page 2 after a decision emptied it,
 * not to scroll a list that keeps everything they have already dealt with on screen. Both needed
 * the same three controls on the same day, and two copies of a pager is how "next" ends up
 * meaning `page + 1` on one screen and `page - 1` on the other.
 *
 * <p><b>Renders nothing when there is one page or fewer.</b> A pager that is always visible and
 * usually inert is furniture; its appearance is itself the signal that there is more to reach.
 *
 * <h4>Direction</h4>
 *
 * <p>The chevrons say <em>back</em> and <em>forward</em>, not left and right, and
 * `DirectionalIcon` is what turns that into a glyph: on the Arabic build "back" points right, the
 * way the browser's own back button does under `dir="rtl"`, and on the English build it points
 * left. The <em>labels</em> are what a reader actually acts on; the glyphs follow them.
 *
 * <p>The `page` prop is the API's ZERO-based index, because that is what the caller holds and
 * converting at one boundary beats converting at three. The number shown to a person is
 * one-based, which is what `pager.position` renders.
 */
function Pager({ page, totalPages, hasPrevious, hasNext, onChange, className = '' }) {
    if (!totalPages || totalPages <= 1) return null;

    const button = 'inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border '
        + 'bg-surface text-sm font-semibold transition-colors hover:bg-surface-hover '
        + 'disabled:opacity-40 disabled:pointer-events-none';

    return (
        <nav
            aria-label={t('pager.label')}
            className={`flex items-center justify-center gap-3 mt-6 ${className}`}
        >
            <button
                type="button"
                className={button}
                disabled={!hasPrevious}
                onClick={() => onChange(Math.max(0, page - 1))}
            >
                <ChevronBack size={16} />
                {t('pager.previous')}
            </button>
            {/* `aria-live`, because on a keyboard the only thing that changes when the button is
                pressed is the list below and this number — and the list is not announced. */}
            <span className="text-sm text-text-secondary tabular-nums" aria-live="polite">
                {t('pager.position', { page: page + 1, total: totalPages })}
            </span>
            <button
                type="button"
                className={button}
                disabled={!hasNext}
                onClick={() => onChange(page + 1)}
            >
                {t('pager.next')}
                <ChevronForward size={16} />
            </button>
        </nav>
    );
}

export default Pager;
