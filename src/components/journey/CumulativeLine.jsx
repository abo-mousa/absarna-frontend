import { useState } from 'react';
import { formatDay } from '@/lib/dayFormat';
import { amountText } from '@/lib/goalText';
import { countOf } from '@/lib/plural';
import { isRtl, t } from '@/i18n';

/**
 * «القليل الدائم» — a finishing goal's running total, week by week (PROGRESS-AND-GOALS.md §7.3). One
 * hue, a 2px line, a dot per week with its number on hover or focus, and the numbers again in a
 * visually hidden table. Time runs with the reading direction: right to left in Arabic.
 */
function CumulativeLine({ points, measure, total = null }) {
    const [active, setActive] = useState(null);
    if (!points || points.length < 2) return null;
    const width = 560;
    const height = 160;
    const pad = { x: 12, top: 16, bottom: 22 };
    const max = Math.max(total || 0, ...points.map((point) => point.total), 1);
    const rtl = isRtl();
    const x = (index) => {
        const along = pad.x + (index / (points.length - 1)) * (width - 2 * pad.x);
        return rtl ? width - along : along;
    };
    const y = (value) => pad.top + (1 - value / max) * (height - pad.top - pad.bottom);
    const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(point.total).toFixed(1)}`).join(' ');
    const last = points[points.length - 1];
    const summary = t('journey.cumulative.aria', {
        weeks: countOf('journey.units.WEEKS', points.length, { oblique: true }),
        amount: amountText(measure, last.total),
    });
    return (
        <figure className="relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={summary}>
                {total && (
                    <line x1={pad.x} x2={width - pad.x} y1={y(total)} y2={y(total)} className="stroke-border" strokeDasharray="4 4" />
                )}
                <line x1={pad.x} x2={width - pad.x} y1={y(0)} y2={y(0)} className="stroke-border-light" />
                <path d={path} fill="none" className="stroke-primary" strokeWidth="2" strokeLinejoin="round" />
                {points.map((point, index) => (
                    <g key={point.weekStart}>
                        <circle cx={x(index)} cy={y(point.total)} r={active === index ? 5 : 3.5}
                                className="fill-primary stroke-surface" strokeWidth="2" />
                        <circle
                            cx={x(index)} cy={y(point.total)} r="14" fill="transparent"
                            tabIndex={0}
                            aria-label={`${formatDay(point.weekStart)}: ${amountText(measure, point.total)}`}
                            onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)}
                            onFocus={() => setActive(index)} onBlur={() => setActive(null)}
                            className="cursor-default focus:outline-none"
                        />
                    </g>
                ))}
            </svg>
            {active != null && (
                <div className="absolute top-0 px-2 py-1 rounded bg-text-primary text-bg text-xs pointer-events-none -translate-x-1/2"
                     style={{ left: `${(x(active) / width) * 100}%` }}>
                    {formatDay(points[active].weekStart)} · {amountText(measure, points[active].total)}
                </div>
            )}
            <table className="sr-only">
                <caption>{summary}</caption>
                <thead><tr><th>{t('journey.cumulative.week')}</th><th>{t('journey.cumulative.total')}</th></tr></thead>
                <tbody>
                    {points.map((point) => (
                        <tr key={point.weekStart}><td>{formatDay(point.weekStart)}</td><td>{amountText(measure, point.total)}</td></tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}

export default CumulativeLine;
