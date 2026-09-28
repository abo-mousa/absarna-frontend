import { useState } from 'react';
import { formatDay } from '@/lib/dayFormat';
import { learningTime } from '@/lib/goalText';
import { formatCount } from '@/lib/numbers';
import { weekAxis } from '@/lib/journey';
import { t } from '@/i18n';

/**
 * The last weeks' minutes of learning as bars — one hue, the running week lighter and labelled as
 * still going, and the primary goal's weekly minutes as a dashed line when it counts minutes. An
 * axis of round steps in hours (minutes for a light stretch) with faint gridlines, a date under
 * every third week, a tooltip on hover or focus, and the numbers in a hidden table. Oldest first,
 * so time runs with the reading direction.
 */
function WeekBars({ weeks, goalMinutes = null }) {
    const [active, setActive] = useState(null);
    if (!weeks?.length) return null;
    const axis = weekAxis(Math.max(goalMinutes || 0, ...weeks.map((week) => week.minutes), 1));
    const max = axis.top;
    const height = 160;
    const summary = t('journey.record.weeksAria', { count: weeks.length });
    const lastIndex = weeks.length - 1;
    const y = (minutes) => (minutes / max) * height;
    return (
        <figure className="relative">
            <p className="text-[0.65rem] text-text-muted mb-1" aria-hidden="true">
                {t(axis.hours ? 'journey.record.axisHours' : 'journey.record.axisMinutes')}
            </p>
            <div className="flex gap-2">
                <div className="relative w-7 flex-shrink-0" style={{ height }} aria-hidden="true">
                    {axis.ticks.map((value) => (
                        <span key={value} className="absolute end-0 text-[0.65rem] text-text-muted leading-none translate-y-1/2"
                              style={{ bottom: y(value) }}>
                            {formatCount(axis.hours ? value / 60 : value)}
                        </span>
                    ))}
                </div>
                <div className="relative flex-1 min-w-0">
                    <div className="relative flex items-end gap-1.5 sm:gap-2.5" style={{ height }} role="group" aria-label={summary}>
                        {axis.ticks.map((value) => (
                            <span key={value} aria-hidden="true" className="absolute inset-x-0 border-t border-border-light pointer-events-none"
                                  style={{ bottom: y(value) }} />
                        ))}
                        {goalMinutes > 0 && (
                            <span aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-gold-ink/60"
                                  style={{ bottom: y(goalMinutes) }}>
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
                                    style={{ height: week.minutes ? Math.max(3, y(week.minutes)) : 0 }}
                                />
                                {week.minutes === 0 && <span className="absolute bottom-0 inset-x-0 h-px bg-border" />}
                            </button>
                        ))}
                    </div>
                    {/* A date under every third week, counted back from this one so it is always labelled. The
                        two outer labels hug their edge so neither runs off the chart. */}
                    <div className="flex gap-1.5 sm:gap-2.5 h-4 text-[0.65rem] text-text-muted mt-2" aria-hidden="true">
                        {weeks.map((week, index) => {
                            const label = index === lastIndex ? t('journey.record.thisWeek')
                                : (lastIndex - index) % 3 === 0 ? formatDay(week.weekStart) : '';
                            // Absolute, so a label wider than its bar grows over the empty cells beside it
                            // and never past the chart: the newest from its outer edge, the oldest from
                            // its own, the rest centred.
                            const place = index === lastIndex ? 'end-0' : index === 0 ? 'start-0'
                                : 'start-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2';
                            return (
                                <span key={week.weekStart} className="relative flex-1 min-w-0">
                                    {label && (
                                        <span className={`absolute top-0 whitespace-nowrap ${place} ${index === lastIndex ? 'text-primary' : ''}`}>
                                            {label}
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>
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
