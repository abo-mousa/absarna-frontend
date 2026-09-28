import { KhatamStar } from '../ui';
import { formatDay } from '@/lib/dayFormat';
import { groupByMonth } from '@/lib/journey';
import { t } from '@/i18n';

// One hue, light to dark: a week's level is the reader's own tercile of their active weeks, never
// a comparison with anyone. Level 0 is an outline — a quiet week, not a gap to be ashamed of.
const LEVEL = ['text-border', 'text-gold/35', 'text-gold/65', 'text-gold'];
const ROWS = 5;

/**
 * «سنتك» — twelve months side by side, each a column: its name on top, its weeks below as stars in
 * fixed rows («الأسبوع ١…٥»), so every month lines up with every other — a month has at most five
 * Tuesdays. A phone gets two blocks of six. The numbers again in a visually hidden table; each star's week and level in its title.
 */
function YearStars({ weeks }) {
    if (!weeks?.length) return null;
    const months = groupByMonth(weeks);
    const block = (list, className) => (
        <div className={`grid gap-x-1.5 gap-y-1.5 items-center ${className}`}
             style={{ gridTemplateColumns: `3.4rem repeat(${list.length}, minmax(0, 1fr))` }} aria-hidden="true">
            <span />
            {list.map((month, index) => {
                const current = month === months[months.length - 1];
                return (
                    <span key={month.key}
                          className={`text-[0.68rem] leading-tight text-center self-end pb-1 border-b border-border-light ${current ? 'text-primary font-bold' : 'text-text-secondary font-semibold'}`}
                          style={{ gridColumn: index + 2, gridRow: 1 }}>
                        {current ? t('journey.record.thisMonth') : month.name}
                    </span>
                );
            })}
            {Array.from({ length: ROWS }, (_, row) => (
                <span key={`row-${row}`} className="text-[0.65rem] text-text-muted" style={{ gridColumn: 1, gridRow: row + 2 }}>
                    {t('journey.record.weekRow', { n: row + 1 })}
                </span>
            ))}
            {list.flatMap((month, index) => month.weeks.slice(0, ROWS).map((week, row) => (
                <span key={week.weekStart} className="flex justify-center" style={{ gridColumn: index + 2, gridRow: row + 2 }}
                      title={`${formatDay(week.weekStart)} · ${t(`journey.record.levels.${week.level}`)}`}>
                    <KhatamStar filled={week.level > 0} strokeWidth={9} className={`w-4 h-4 sm:w-[1.1rem] sm:h-[1.1rem] ${LEVEL[week.level]}`} />
                </span>
            )))}
        </div>
    );
    return (
        <figure>
            {block(months, 'hidden md:grid')}
            <div className="flex flex-col gap-5 md:hidden">
                {months.length > 6 && block(months.slice(0, months.length - 6), '')}
                {block(months.slice(-6), '')}
            </div>
            <figcaption className="flex flex-wrap items-center gap-2 mt-4 text-xs text-text-muted">
                <span>{t('journey.record.byMonth')}</span>
                <span className="inline-flex items-center gap-2" aria-hidden="true">
                    <span>{t('journey.record.less')}</span>
                    {LEVEL.map((className, level) => (
                        <KhatamStar key={level} filled={level > 0} strokeWidth={9} className={`w-3.5 h-3.5 ${className}`} />
                    ))}
                    <span>{t('journey.record.more')}</span>
                </span>
            </figcaption>
            <table className="sr-only">
                <caption>{t('journey.record.yearTitle')}</caption>
                <thead><tr><th>{t('journey.cumulative.week')}</th><th>{t('journey.record.levelHeading')}</th></tr></thead>
                <tbody>
                    {weeks.map((week) => (
                        <tr key={week.weekStart}><td>{formatDay(week.weekStart)}</td><td>{t(`journey.record.levels.${week.level}`)}</td></tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}

export default YearStars;
