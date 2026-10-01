import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals } from '@/hooks/useGoals';
import { bookPortion, goalFor } from '@/lib/journey';
import { amountText } from '@/lib/goalText';
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
 *
 * <h4>It says what it asks for</h4>
 *
 * <p>«اجعله وِردًا» alone left the reader to guess how much a وِرد was and what it would hold them
 * to, and the answer was only inside the dialog, after the press. So the label carries the amount
 * the dialog is about to propose («…: حلقة واحدة كل يوم», a book's pages to finish it in thirty
 * days) — the same number, so the button and the dialog cannot disagree — and the page button
 * adds the line that answers the other worry: at a time you choose, and nothing is sent to you.
 *
 * <p>`offer={false}` keeps the «في وِردك» mark and reduces the invitation to a small outlined
 * star with no sentence — the same action, named only to a screen reader and in the tooltip.
 * Today labels the invitation on one card of a row: under every card it read as a nudge, which is
 * the one thing this platform will not do, and a reader who wants another card's programme
 * should not have to open its page to find the button.
 */
function MakeWird({ seriesId = null, bookId = null, title, pages = null, currentPage = 0, variant = 'card', offer = true, className = '' }) {
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
    // The amount the dialog proposes, stated before the press.
    const proposal = seriesId != null
        ? { kind: 'FINISH_SERIES', targetId: seriesId, title, amount: 1, measure: 'EPISODES' }
        : { kind: 'FINISH_BOOK', targetId: bookId, title, amount: bookPortion(pages, currentPage), measure: 'PAGES' };
    const { measure, ...goal } = proposal;
    const label = t('journey.makeWirdAmount', { amount: amountText(measure, goal.amount) });
    if (!offer) {
        // No data-guide: the guide points at the labelled offer, never at this.
        return (
            <button
                type="button"
                aria-label={label}
                title={label}
                className={`inline-flex items-center justify-center w-6 h-6 -m-1.5 rounded text-text-muted hover:text-gold focus-visible:text-gold transition-colors ${className}`}
                onClick={() => openGoal(goal)}
            >
                <KhatamStar filled={false} strokeWidth={10} className="w-3 h-3" />
            </button>
        );
    }
    const action = (
        <button
            type="button"
            data-guide="make-wird"
            className={`${button} ${variant === 'button' ? '' : className}`}
            onClick={() => openGoal(goal)}
        >
            {star}{label}
        </button>
    );
    if (variant !== 'button') return action;
    return (
        <div className={`flex flex-col items-start gap-1.5 ${className}`}>
            {action}
            <p className="text-xs text-text-muted">{t('journey.makeWirdHint')}</p>
        </div>
    );
}

export default MakeWird;
