import { KhatamStar } from '../ui';
import { weekdayName } from '@/lib/dayFormat';
import { t } from '@/i18n';

/**
 * A goal's days as stars (PROGRESS-AND-GOALS.md §6.4): a kept day filled — gold when full, teal at
 * the minimum, ringed when made up — a rest day a small dot, an excused day a faint outline, a day
 * still open or missed an empty outline. Nothing is red: a missed day is the same outline as one
 * not yet done, and the words say "written", never "failed".
 */
const LOOK = {
    FULL: { filled: true, className: 'text-gold' },
    MINIMUM: { filled: true, className: 'text-primary' },
    MADE_UP: { filled: true, className: 'text-gold', ring: true },
    REST: { dot: true },
    EXCUSED: { filled: false, className: 'text-border' },
    PENDING: { filled: false, className: 'text-text-muted' },
    MISSED: { filled: false, className: 'text-border' },
    NOT_DUE: { blank: true },
};

export function DayStar({ state, className = 'w-6 h-6' }) {
    const look = LOOK[state] || LOOK.NOT_DUE;
    if (look.blank) return <span className={`inline-block ${className}`} aria-hidden="true" />;
    if (look.dot) {
        return (
            <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
            </span>
        );
    }
    return (
        <span className={`relative inline-block ${className}`} aria-hidden="true">
            <KhatamStar filled={look.filled} strokeWidth={8} className={`w-full h-full ${look.className}`} />
            {look.ring && <KhatamStar filled={false} strokeWidth={5} className="absolute -inset-1 w-[calc(100%+0.5rem)] h-[calc(100%+0.5rem)] text-gold/60" />}
        </span>
    );
}

/** A row of days (or weeks, for a weekly goal): each star over its name, and a sentence for a screen reader. */
function DayStars({ days, weekly = false, size = 'md' }) {
    if (!days?.length) return null;
    const star = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
    return (
        <ul className="flex items-end gap-2 sm:gap-3">
            {days.map((day) => (
                <li key={day.day} className="flex flex-col items-center gap-1" title={t(`journey.states.${day.state}`)}>
                    <DayStar state={day.state} className={star} />
                    {size !== 'sm' && (
                        <span className="text-[0.65rem] text-text-muted" aria-hidden="true">
                            {weekly ? t('journey.weekOf') : weekdayName(day.day)}
                        </span>
                    )}
                    <span className="sr-only">
                        {weekly ? '' : `${weekdayName(day.day, 'long')}: `}{t(`journey.states.${day.state}`)}
                    </span>
                </li>
            ))}
        </ul>
    );
}

export default DayStars;
