import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals } from '@/hooks/useGoals';
import { bookPortion, goalFor } from '@/lib/journey';
import { KhatamStar } from '../ui';
import { useJourney } from './journeyContext';
import { t } from '@/i18n';

/**
 * «اجعله وِردًا» — makes a programme or a book a daily portion, opening the goal dialog with the
 * target chosen and an amount proposed; «في وِردك» instead when a goal already pursues it, linking
 * to that goal. A single video outside a series has nothing to keep up, so has no action.
 *
 * <p>`variant="card"` is the quiet line under a Today card; `"button"` the outlined button a
 * series or book page header carries.
 */
function MakeWird({ seriesId = null, bookId = null, title, pages = null, currentPage = 0, variant = 'card', className = '' }) {
    const { token } = useAuth();
    const goals = useGoals(!!token);
    const { openGoal } = useJourney();
    if (seriesId == null && bookId == null) return null;
    const existing = token ? goalFor(goals.data, { seriesId, bookId }) : null;
    const button = variant === 'button'
        ? 'inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-surface text-sm font-semibold text-text-primary hover:border-primary hover:no-underline'
        : 'inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline';
    const star = <KhatamStar filled={!!existing} strokeWidth={10} className={`${variant === 'button' ? 'w-4 h-4' : 'w-3 h-3'} text-gold flex-shrink-0`} />;
    if (existing) {
        return (
            <Link to={`/journey/goals/${existing.id}`} data-guide="make-wird" className={`${button} ${className}`}>
                {star}{t('journey.inWird')}
            </Link>
        );
    }
    return (
        <button
            type="button"
            data-guide="make-wird"
            className={`${button} ${className}`}
            onClick={() => openGoal(seriesId != null
                ? { kind: 'FINISH_SERIES', targetId: seriesId, title, amount: 1 }
                : { kind: 'FINISH_BOOK', targetId: bookId, title, amount: bookPortion(pages, currentPage) })}
        >
            {star}{t('journey.makeWird')}
        </button>
    );
}

export default MakeWird;
