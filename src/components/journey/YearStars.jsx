import { KhatamStar } from '../ui';
import { formatDay } from '@/lib/dayFormat';
import { t } from '@/i18n';

// One hue, light to dark: a week's level is the reader's own tercile of their active weeks, never
// a comparison with anyone. Level 0 is an outline — a quiet week, not a gap to be ashamed of.
const LEVEL = ['text-border', 'text-gold/35', 'text-gold/65', 'text-gold'];

/**
 * «سنتك» — the last 52 weeks as stars, oldest first, in rows of thirteen (a quarter each). The
 * numbers again in a visually hidden table; each star's week and level in its title.
 */
function YearStars({ weeks }) {
    if (!weeks?.length) return null;
    return (
        <figure>
            <ul className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5 sm:gap-2 max-w-[640px]" aria-hidden="true">
                {weeks.map((week) => (
                    <li key={week.weekStart} title={`${formatDay(week.weekStart)} · ${t(`journey.record.levels.${week.level}`)}`}>
                        <KhatamStar filled={week.level > 0} strokeWidth={9} className={`w-full aspect-square ${LEVEL[week.level]}`} />
                    </li>
                ))}
            </ul>
            <figcaption className="flex items-center gap-2 mt-3 text-xs text-text-muted" aria-hidden="true">
                <span>{t('journey.record.less')}</span>
                {LEVEL.map((className, level) => (
                    <KhatamStar key={level} filled={level > 0} strokeWidth={9} className={`w-3.5 h-3.5 ${className}`} />
                ))}
                <span>{t('journey.record.more')}</span>
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
