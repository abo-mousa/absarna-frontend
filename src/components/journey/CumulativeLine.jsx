import { useState } from 'react';
import { KHATAM_POINTS } from '@/lib/khatam';
import { formatDay } from '@/lib/dayFormat';
import { amountText } from '@/lib/goalText';
import { countOf } from '@/lib/plural';
import { formatCount } from '@/lib/numbers';
import { isRtl, t } from '@/i18n';

/**
 * «القليل الدائم» — a goal's running total, week by week (PROGRESS-AND-GOALS.md §7.3), as a climb
 * towards the finish: three numbers above it (done, the weekly average, when it lands), a quarter
 * grid, the quarter marks as the milestone thread's small stars sitting on the line where they were
 * crossed, the finish as its big star, and a dotted estimate from the weekly average to it. One
 * hue, a 2px line; each week's gain on hover or focus, and the numbers again in a visually hidden
 * table. Time runs with the reading direction: right to left in Arabic. Nothing turns red — a light
 * week is a flatter line and nothing else.
 */
const QUARTERS = [25, 50, 75];

function CumulativeLine({ points, measure, total = null, finishDate = null }) {
    const [active, setActive] = useState(null);
    if (!points || points.length < 2) return null;
    const lastIndex = points.length - 1;
    const last = points[lastIndex];
    const perWeek = (last.total - points[0].total) / lastIndex;
    const open = total != null && last.total < total;
    // Where the estimate lands, in weeks from the first point — drawn only when it lands within
    // the chart's reach (three times the weeks so far), since a line to a far horizon says nothing.
    const finishAt = open && perWeek > 0 ? lastIndex + (total - last.total) / perWeek : null;
    const span = finishAt != null && finishAt <= lastIndex * 3 ? Math.max(lastIndex + 1, finishAt) : lastIndex + (open ? 1 : 0);

    const width = 640;
    const height = 280;
    const pad = { start: 56, end: 30, top: 34, bottom: 36 };
    const max = Math.max(total || 0, last.total, 1);
    const rtl = isRtl();
    const x = (index) => {
        const along = pad.start + (index / span) * (width - pad.start - pad.end);
        return rtl ? width - along : along;
    };
    const y = (value) => pad.top + (1 - value / max) * (height - pad.top - pad.bottom);
    const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(point.total).toFixed(1)}`).join(' ');
    const area = `${path} L${x(lastIndex).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;
    // The first week index at which the line reaches `value`, interpolated; past the last point, on the estimate.
    const crossing = (value) => {
        for (let i = 1; i <= lastIndex; i++) {
            if (points[i].total >= value) {
                const before = points[i - 1].total;
                const gain = points[i].total - before;
                return i - 1 + (gain > 0 ? (value - before) / gain : 1);
            }
        }
        return perWeek > 0 ? lastIndex + (value - last.total) / perWeek : null;
    };
    // Text anchors below are the same in both directions: SVG text inherits the page's direction,
    // so «end» is the side away from the reading start in Arabic and in English alike.
    const star = (cx, cy, r, className, strokeWidth = 0) => (
        <polygon points={KHATAM_POINTS} className={className} strokeWidth={strokeWidth}
                 transform={`translate(${cx - r},${cy - r}) scale(${r / 50})`} />
    );
    const grid = total ? [0, ...QUARTERS.map((q) => Math.round(total * q / 100)), total] : [0, max];
    const summary = t('journey.cumulative.aria', {
        weeks: countOf('journey.units.WEEKS', points.length, { oblique: true }),
        amount: amountText(measure, last.total),
    });
    const weekName = (index) => (index === lastIndex ? t('journey.cumulative.thisWeek') : formatDay(points[index].weekStart));

    return (
        <figure className="flex flex-col gap-4 max-w-[720px]">
            <dl className="flex flex-wrap gap-x-8 gap-y-2">
                <div className="flex flex-col-reverse">
                    <dt className="text-xs text-text-muted">{t('journey.cumulative.done')}</dt>
                    <dd className="text-xl font-bold">
                        {formatCount(last.total)}{total != null && <span className="text-xs font-normal text-text-muted ms-1">{t('journey.cumulative.of', { total: formatCount(total) })}</span>}
                    </dd>
                </div>
                {perWeek > 0 && (
                    <div className="flex flex-col-reverse">
                        <dt className="text-xs text-text-muted">{t('journey.cumulative.average')}</dt>
                        <dd className="text-xl font-bold">{amountText(measure, Math.round(perWeek))}</dd>
                    </div>
                )}
                {open && finishDate && (
                    <div className="flex flex-col-reverse">
                        <dt className="text-xs text-text-muted">{t('journey.cumulative.finish')}</dt>
                        <dd className="text-xl font-bold">{formatDay(finishDate)}</dd>
                    </div>
                )}
            </dl>
            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="group" aria-label={summary}>
                    {grid.map((value) => (
                        <g key={value}>
                            <line x1={x(0)} x2={x(span)} y1={y(value)} y2={y(value)} className="stroke-border-light" />
                            <text x={rtl ? width - pad.start + 10 : pad.start - 10} y={y(value) + 4} fontSize="11"
                                  textAnchor="end" className="fill-text-muted">{formatCount(value)}</text>
                        </g>
                    ))}
                    <path d={area} className="fill-primary" opacity="0.08" />
                    <path d={path} fill="none" className="stroke-primary" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    {finishAt != null && finishAt <= span && (
                        <path d={`M${x(lastIndex)},${y(last.total)} L${x(finishAt)},${y(total)}`} fill="none" className="stroke-primary"
                              strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" opacity="0.55" />
                    )}
                    {total != null && QUARTERS.map((quarter) => {
                        const value = total * quarter / 100;
                        const at = crossing(value);
                        if (at == null || at > span) return null;
                        const reached = last.total >= value;
                        return (
                            <g key={quarter}>
                                {star(x(at), y(value), 8, reached ? 'fill-primary/60' : 'fill-surface stroke-border', reached ? 0 : 6)}
                                <text x={x(at) + (rtl ? 8 : -8)} y={y(value) - 12} fontSize="11" textAnchor="end"
                                      className={reached ? 'fill-primary' : 'fill-text-muted'}>
                                    {t(`journey.cumulative.quarters.${quarter}`)}
                                </text>
                            </g>
                        );
                    })}
                    {total != null && (finishAt != null && finishAt <= span || !open) && (
                        <g>
                            {star(x(open ? finishAt : lastIndex), y(total), 14, open ? 'fill-surface stroke-gold' : 'fill-gold', open ? 6 : 0)}
                            <text x={x(open ? finishAt : lastIndex)} y={y(total) - 20} fontSize="12" fontWeight="600" textAnchor="middle"
                                  className="fill-gold-ink">{t('journey.cumulative.khatma')}</text>
                        </g>
                    )}
                    <circle cx={x(lastIndex)} cy={y(last.total)} r="5" className="fill-primary stroke-surface" strokeWidth="2" />
                    {open && (
                        <text x={x(lastIndex) + (rtl ? -8 : 8)} y={y(last.total) + 24} fontSize="12" fontWeight="600"
                              textAnchor="start" className="fill-primary">
                            {t('journey.cumulative.here', { current: formatCount(last.total) })}
                        </text>
                    )}
                    <text x={x(0)} y={height - 12} fontSize="11" textAnchor="middle" className="fill-text-muted">
                        {t('journey.cumulative.start')}
                    </text>
                    <text x={x(lastIndex)} y={height - 12} fontSize="11" textAnchor="middle" className="fill-primary">
                        {t('journey.cumulative.thisWeek')}
                    </text>
                    {active != null && (
                        <line x1={x(active)} x2={x(active)} y1={pad.top} y2={y(0)} className="stroke-text-muted" strokeDasharray="2 3" />
                    )}
                    {points.map((point, index) => index > 0 && (
                        <rect
                            key={point.weekStart}
                            x={x(index) - 18} y={pad.top} width="36" height={y(0) - pad.top} fill="transparent"
                            tabIndex={0}
                            aria-label={`${weekName(index)}: ${amountText(measure, point.total - points[index - 1].total)} — ${amountText(measure, point.total)}`}
                            onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)}
                            onFocus={() => setActive(index)} onBlur={() => setActive(null)}
                            className="cursor-default focus:outline-none"
                        />
                    ))}
                </svg>
                {active != null && (
                    <div className="absolute top-0 px-3 py-1.5 rounded-md border border-border bg-surface text-xs pointer-events-none -translate-x-1/2 shadow-sm"
                         style={{ left: `${Math.min(85, Math.max(15, (x(active) / width) * 100))}%` }}>
                        <p className="font-semibold text-text-primary whitespace-nowrap">
                            {t('journey.cumulative.added', {
                                week: weekName(active),
                                amount: amountText(measure, points[active].total - points[active - 1].total),
                            })}
                        </p>
                        <p className="text-text-muted whitespace-nowrap">
                            {total != null
                                ? t('journey.cumulative.runningTotal', { current: formatCount(points[active].total), total: formatCount(total) })
                                : t('journey.cumulative.runningTotalOpen', { current: formatCount(points[active].total) })}
                        </p>
                    </div>
                )}
            </div>
            {finishAt != null && finishAt <= span && <p className="text-xs text-text-muted">{t('journey.cumulative.estimate')}</p>}
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
