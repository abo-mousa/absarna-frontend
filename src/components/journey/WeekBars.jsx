import { useState } from 'react';
import { formatDay } from '@/lib/dayFormat';
import { learningTime } from '@/lib/goalText';
import { t } from '@/i18n';

/**
 * The last weeks' minutes of learning as bars — one hue, the running week lighter and labelled as
 * still going, and the primary goal's weekly minutes as a dashed line when it counts minutes. A
 * tooltip on hover or focus, and the numbers in a hidden table. Oldest first, so time runs with
 * the reading direction.
 */
function WeekBars({ weeks, goalMinutes = null }) {
    const [active, setActive] = useState(null);
    if (!weeks?.length) return null;
    const max = Math.max(goalMinutes || 0, ...weeks.map((week) => week.minutes), 1);
    const height = 140;
    const summary = t('journey.record.weeksAria', { count: weeks.length });
    // One direct label, on the tallest week: it gives the bars a scale without a number on each.
    const tallest = weeks.reduce((best, week, index) => (week.minutes > weeks[best].minutes ? index : best), 0);
    return (
        <figure className="relative">
            <div className="relative flex items-end gap-1.5 sm:gap-2.5" style={{ height }} role="img" aria-label={summary}>
                {goalMinutes > 0 && (
                    <span aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-gold-ink/60"
                          style={{ bottom: (goalMinutes / max) * height }}>
                        <span className="absolute -top-5 end-0 text-[0.65rem] text-gold-ink">{t('journey.record.goalLine')}</span>
                    </span>
                )}
                {weeks.map((week, index) => (
                    <button
                        key={week.weekStart}
                        type="button"
                        aria-label={`${formatDay(week.weekStart)}: ${learningTime(week.minutes)}`}
                        onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)}
                        onFocus={() => setActive(index)} onBlur={() => setActive(null)}
                        className="relative flex-1 h-full flex items-end focus:outline-none group"
                    >
                        <span
                            className={`w-full rounded-t-[4px] ${week.partial ? 'bg-primary/40' : 'bg-primary'} group-focus-visible:ring-2 group-focus-visible:ring-gold`}
                            style={{ height: week.minutes ? Math.max(3, (week.minutes / max) * height) : 0 }}
                        />
                        {week.minutes === 0 && <span className="absolute bottom-0 inset-x-0 h-px bg-border" />}
                        {index === tallest && week.minutes > 0 && (
                            <span aria-hidden="true" className="absolute inset-x-0 text-center text-[0.65rem] text-text-secondary whitespace-nowrap"
                                  style={{ bottom: (week.minutes / max) * height + 4 }}>
                                {learningTime(week.minutes)}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            <div className="flex justify-between text-[0.7rem] text-text-muted mt-2" aria-hidden="true">
                <span>{formatDay(weeks[0].weekStart)}</span>
                <span>{t('journey.record.thisWeek')}</span>
            </div>
            {active != null && (
                <p className="absolute -top-7 inset-x-0 text-center text-xs text-text-secondary pointer-events-none">
                    {formatDay(weeks[active].weekStart)} · {learningTime(weeks[active].minutes)}
                    {weeks[active].partial ? ` · ${t('journey.record.stillGoing')}` : ''}
                </p>
            )}
            <table className="sr-only">
                <caption>{summary}</caption>
                <thead><tr><th>{t('journey.cumulative.week')}</th><th>{t('journey.record.minutesHeading')}</th></tr></thead>
                <tbody>
                    {weeks.map((week) => (
                        <tr key={week.weekStart}><td>{formatDay(week.weekStart)}</td><td>{learningTime(week.minutes)}</td></tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}

export default WeekBars;
