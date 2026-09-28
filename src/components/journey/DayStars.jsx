import { useState } from 'react';
import { KhatamStar } from '../ui';
import { safeStorage } from '@/lib/safeStorage';
import { weekdayName } from '@/lib/dayFormat';
import { fullWeek } from '@/lib/journey';
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
function DayStars({ days: given, weekly = false, size = 'md' }) {
    if (!given?.length) return null;
    const days = weekly ? given : fullWeek(given);
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

const LEGEND_HIDDEN_KEY = 'absarna.dayLegendHidden';
const LEGEND = ['FULL', 'MINIMUM', 'MADE_UP', 'REST', 'EXCUSED', 'PENDING'];

/**
 * What the day symbols mean, in view rather than behind a hover (product owner, 2026-09-28: the
 * stars read as decoration until explained). Put away with «إخفاء» once learned; «ما معنى الرموز؟»
 * brings it back. Remembered per browser.
 */
export function DayLegend({ className = '' }) {
    const [hidden, setHidden] = useState(() => safeStorage.getItem(LEGEND_HIDDEN_KEY) === '1');
    const toggle = (value) => {
        safeStorage.setItem(LEGEND_HIDDEN_KEY, value ? '1' : '0');
        setHidden(value);
    };
    if (hidden) {
        return (
            <button type="button" onClick={() => toggle(false)} className={`text-xs font-semibold text-primary hover:underline ${className}`}>
                {t('journey.legend.show')}
            </button>
        );
    }
    return (
        <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 rounded-md border border-border-light bg-surface text-xs text-text-secondary ${className}`}>
            {LEGEND.map((state) => (
                <span key={state} className="inline-flex items-center gap-1.5">
                    <DayStar state={state} className="w-4 h-4" />
                    {t(`journey.legend.${state}`)}
                </span>
            ))}
            <button type="button" onClick={() => toggle(true)} className="ms-auto text-text-muted hover:text-text-primary">
                {t('journey.legend.hide')}
            </button>
        </div>
    );
}

export default DayStars;
