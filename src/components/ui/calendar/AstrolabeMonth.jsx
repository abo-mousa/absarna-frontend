import { useRef } from 'react';
import { formatDay } from '@/lib/dayFormat';
import { dayAngle } from '@/lib/ringTurn';
import { countOf } from '@/lib/plural';
import { t } from '@/i18n';
import { BOX, C, bandPath, placeAt, pt, rosetteLines, starPoints } from './ring';
import { useRotatingRing } from './useRotatingRing';

const DAY_R = 117;

/**
 * A month on an astrolabe that turns: the year's twelve months engraved on the fixed rim (the one
 * shown gilded, a press turns to another), and inside it the day ring, which turns like a dial
 * under a finger or a mouse (`useRotatingRing`) past the gold marker at the top — the day under
 * the marker is the day chosen, the other calendar's day engraved beneath each. Seasons are a gold
 * arc on the ring; while a turn is under way the plate says how many days it has moved.
 */
function AstrolabeMonth({ days, dayProps, value, today, allowed, marks, calendar, other, months, onMonth, title, onLive, onCommit, ahead }) {
    const ref = useRef(null);
    const { rot, turned, handlers } = useRotatingRing({ ref, days, shown: value, allowed, calendar, onLive, onCommit });
    const n = days.length;
    const step = 360 / n;
    const at = (i) => dayAngle(i, rot, n);
    const chosen = value && days.includes(value) ? value : null;
    return (
        <div ref={ref} {...handlers} className="relative w-full max-w-[340px] aspect-square mx-auto touch-none cursor-grab active:cursor-grabbing">
            <svg viewBox={`0 0 ${BOX} ${BOX}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
                <circle cx={C} cy={C} r={168} className="fill-gold-light stroke-gold-ink" strokeWidth={1.3} />
                {Array.from({ length: 120 }, (_, k) => {
                    const [x1, y1] = pt(168, k * 3); const [x2, y2] = pt(k % 5 ? 164.5 : 163, k * 3);
                    return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-gold-ink" strokeWidth={0.6} opacity={0.5} />;
                })}
                <circle cx={C} cy={C} r={161} className="fill-surface stroke-gold-ink" strokeWidth={0.8} />
                {months.map((m, i) => (
                    <g key={m.iso}>
                        {m.current && <path d={bandPath(139, 161, i * 30 + 0.8, i * 30 + 29.2)} className="fill-gold-light stroke-gold" strokeWidth={1.2} />}
                        <line x1={pt(139, i * 30)[0]} y1={pt(139, i * 30)[1]} x2={pt(161, i * 30)[0]} y2={pt(161, i * 30)[1]} className="stroke-border" strokeWidth={1} />
                    </g>
                ))}
                <circle cx={C} cy={C} r={139} fill="none" className="stroke-gold-ink" strokeWidth={0.8} />

                {/* the day ring: everything on it turns */}
                <circle cx={C} cy={C} r={92} className="fill-bg stroke-border" strokeWidth={1} />
                {days.map((iso, i) => {
                    const a = at(i);
                    const [tx, ty] = pt(134, a + step / 2); const [tx2, ty2] = pt(129, a + step / 2);
                    const [gx, gy] = pt(101, a);
                    return (
                        <g key={iso}>
                            {marks[iso] && <path d={bandPath(135, 138.5, a - step / 2 + 0.4, a + step / 2 - 0.4)} className="fill-gold" />}
                            <line x1={tx} y1={ty} x2={tx2} y2={ty2} className="stroke-text-muted" strokeWidth={0.6} />
                            <text x={gx} y={gy} dominantBaseline="central" textAnchor="middle" className="fill-text-muted text-[6.8px] font-sans">{formatDay(iso, { day: 'numeric' }, other)}</text>
                        </g>
                    );
                })}

                {/* the plate and the rete, fixed */}
                <circle cx={C} cy={C} r={86} className="fill-surface stroke-border" strokeWidth={1} />
                <g opacity={0.35}>{rosetteLines(84, 16, 6).map(([a, b], i) => <line key={`a${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="stroke-gold-ink" strokeWidth={0.6} />)}</g>
                <g opacity={0.75}>{rosetteLines(84, 8, 3).map(([a, b], i) => <line key={`b${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="stroke-gold" strokeWidth={1} />)}</g>
                {/* the marker: the rete's pointer, fixed at the top */}
                <line x1={C} y1={C - 22} x2={C} y2={C - 96} className="stroke-gold-ink" strokeWidth={3.6} strokeLinecap="round" />
                <line x1={C} y1={C - 22} x2={C} y2={C - 96} className="stroke-gold" strokeWidth={1.6} strokeLinecap="round" />
                <polygon points={starPoints(C, C - 98, 7)} className="fill-gold stroke-gold-ink" strokeWidth={0.8} />
                <path d={`M${C - 7},${C - 141} L${C + 7},${C - 141} L${C},${C - 132} Z`} className="fill-gold stroke-gold-ink" strokeWidth={0.8} />

                <circle cx={C} cy={C} r={62} className="fill-surface stroke-gold" strokeWidth={1.2} />
                <circle cx={C} cy={C} r={58} fill="none" className="stroke-gold-ink" strokeWidth={0.5} strokeDasharray="1.5 2.5" opacity={0.6} />
                {turned != null ? (
                    <>
                        <text x={C} y={C - 32} textAnchor="middle" className="fill-gold-ink text-[9.5px] font-sans font-bold">{t('calendar.thisTurn')}</text>
                        <text x={C} y={C - 8} textAnchor="middle" className="fill-gold-ink text-[19px] font-sans font-bold">
                            {turned === 0 ? '0' : `${turned > 0 ? '+' : '−'}${countOf('journey.units.DAYS', Math.abs(turned))}`}
                        </text>
                    </>
                ) : (
                    <>
                        <text x={C} y={C - 34} textAnchor="middle" className="fill-gold-ink text-[9.5px] font-sans font-bold">{title}</text>
                        <text x={C} y={C - 4} textAnchor="middle" className="fill-primary-dark dark:fill-primary text-[30px] font-numeral font-bold">
                            {chosen ? formatDay(chosen, { day: 'numeric' }, calendar) : '—'}
                        </text>
                    </>
                )}
                {/* how far ahead, right under the day it is about */}
                {ahead && (
                    <>
                        <text x={C} y={C + 20} textAnchor="middle" className="fill-primary-dark dark:fill-primary text-[15px] font-sans font-bold">{ahead.main}</text>
                        {ahead.days && <text x={C} y={C + 36} textAnchor="middle" className="fill-text-secondary text-[10px] font-sans font-semibold">{ahead.days}</text>}
                    </>
                )}
            </svg>

            {/* the rim: each month a button, upright and turned to its sector */}
            {months.map((m, i) => {
                const ang = i * 30 + 15;
                const rotLabel = ang <= 90 || ang >= 270 ? ang : ang - 180;
                return (
                    <button
                        key={m.iso}
                        type="button"
                        data-ring-skip=""
                        onClick={() => onMonth(m.iso)}
                        disabled={!m.reachable}
                        aria-pressed={m.current}
                        aria-label={m.label}
                        style={{ ...placeAt(150, ang), transform: `translate(-50%, -50%) rotate(${rotLabel}deg)` }}
                        className={`absolute whitespace-nowrap px-1 leading-none rounded text-[10px] outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-35 disabled:cursor-default ${
                            m.current ? 'font-bold text-gold-ink' : 'font-medium text-text-secondary hover:text-primary'
                        }`}
                    >
                        {m.name}
                    </button>
                );
            })}

            {/* the day ring's days, turning */}
            {days.map((iso, i) => {
                const ok = allowed(iso);
                const sel = iso === chosen;
                return (
                    <button
                        key={iso}
                        {...dayProps(iso)}
                        style={placeAt(DAY_R, at(i))}
                        className={`absolute w-[7.5%] aspect-square rounded-full flex items-center justify-center leading-none text-[11px] font-numeral outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            sel ? 'bg-primary text-white font-bold ring-2 ring-gold'
                                : !ok ? 'text-text-muted/40 cursor-default'
                                    : iso === today ? 'ring-1 ring-primary text-text-primary'
                                        : 'text-text-primary'
                        }`}
                    >
                        {formatDay(iso, { day: 'numeric' }, calendar)}
                    </button>
                );
            })}
        </div>
    );
}

export default AstrolabeMonth;
