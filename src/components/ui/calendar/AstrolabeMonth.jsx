import { useRef } from 'react';
import { formatDay } from '@/lib/dayFormat';
import { useRingTurn } from './useRingTurn';
import { BOX, C, bandPath, placeAt, pt, rosetteLines, starPoints } from './ring';

/**
 * A month on an astrolabe: the twelve months of its year on the engraved rim, the one shown
 * gilded; its days on the ring inside, each with the other calendar's day beneath; the rete's
 * openwork over the plate and a pointer, star-tipped, at the chosen day. Seasons are a gold arc.
 *
 * <p>Months and days are real buttons laid over the drawing: pressing a month on the rim turns
 * the astrolabe to it, pressing a day chooses it, and the picker's keys move across both. The day
 * ring also turns under a finger or a mouse (`useRingTurn`), on past the month's end.
 */
function AstrolabeMonth({ days, dayProps, value, today, allowed, marks, calendar, other, months, onMonth, title, onLive, onCommit }) {
    const ref = useRef(null);
    // The day ring turns: days sit at (i + 0.5) arcs, so day 1 starts at the top.
    const turn = useRingTurn({ ref, days, offset: 0.5, calendar, allowed, onLive, onCommit });
    const step = 360 / days.length;
    const chosen = value && days.includes(value) ? value : null;
    const selIndex = chosen ? days.indexOf(chosen) : -1;
    const ptr = selIndex >= 0 ? (selIndex + 0.5) * step : null;
    // Seasons in this month, as runs of consecutive marked days.
    const marked = days.map((iso) => !!marks[iso]);
    return (
        <div ref={ref} {...turn} className="relative w-full max-w-[340px] aspect-square mx-auto touch-none cursor-grab active:cursor-grabbing">
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
                {marked.map((on, i) => (on ? <path key={i} d={bandPath(135, 138.5, i * step + 0.4, (i + 1) * step - 0.4)} className="fill-gold" /> : null))}
                <circle cx={C} cy={C} r={92} className="fill-bg stroke-border" strokeWidth={1} />
                {days.map((iso, i) => {
                    const [tx, ty] = pt(134, i * step); const [tx2, ty2] = pt(129, i * step);
                    const [gx, gy] = pt(101, (i + 0.5) * step);
                    return (
                        <g key={iso}>
                            <line x1={tx} y1={ty} x2={tx2} y2={ty2} className="stroke-text-muted" strokeWidth={0.6} />
                            <text x={gx} y={gy} dominantBaseline="central" textAnchor="middle" className="fill-text-muted text-[6.8px] font-sans">{formatDay(iso, { day: 'numeric' }, other)}</text>
                        </g>
                    );
                })}
                <circle cx={C} cy={C} r={86} className="fill-surface stroke-border" strokeWidth={1} />
                <g opacity={0.35}>{rosetteLines(84, 16, 6).map(([a, b], i) => <line key={`a${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="stroke-gold-ink" strokeWidth={0.6} />)}</g>
                <g opacity={0.75}>{rosetteLines(84, 8, 3).map(([a, b], i) => <line key={`b${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="stroke-gold" strokeWidth={1} />)}</g>
                {ptr != null && (() => {
                    const [ex, ey] = pt(104, ptr); const [bx, by] = pt(22, ptr + 180);
                    return (
                        <g>
                            <line x1={bx} y1={by} x2={ex} y2={ey} className="stroke-gold-ink" strokeWidth={3.6} strokeLinecap="round" />
                            <line x1={bx} y1={by} x2={ex} y2={ey} className="stroke-gold" strokeWidth={1.6} strokeLinecap="round" />
                            <polygon points={starPoints(ex, ey, 8)} className="fill-gold stroke-gold-ink" strokeWidth={0.8} />
                        </g>
                    );
                })()}
                <circle cx={C} cy={C} r={48} className="fill-surface stroke-gold" strokeWidth={1.2} />
                <circle cx={C} cy={C} r={44} fill="none" className="stroke-gold-ink" strokeWidth={0.5} strokeDasharray="1.5 2.5" opacity={0.6} />
                <text x={C} y={C - 15} textAnchor="middle" className="fill-gold-ink text-[9.5px] font-sans font-bold">{title}</text>
                <text x={C} y={C + 16} textAnchor="middle" className="fill-primary-dark dark:fill-primary text-[32px] font-numeral font-bold">
                    {chosen ? formatDay(chosen, { day: 'numeric' }, calendar) : '—'}
                </text>
                {chosen && <text x={C} y={C + 31} textAnchor="middle" className="fill-text-secondary text-[8.5px] font-sans">{formatDay(chosen, { day: 'numeric', month: 'long' }, other)}</text>}
            </svg>

            {/* the rim: each month a button, upright and turned to its sector */}
            {months.map((m, i) => {
                const ang = i * 30 + 15;
                const rot = ang <= 90 || ang >= 270 ? ang : ang - 180;
                return (
                    <button
                        key={m.iso}
                        type="button"
                        data-ring-skip=""
                        onClick={() => onMonth(m.iso)}
                        disabled={!m.reachable}
                        aria-pressed={m.current}
                        aria-label={m.label}
                        style={{ ...placeAt(150, ang), transform: `translate(-50%, -50%) rotate(${rot}deg)` }}
                        className={`absolute whitespace-nowrap px-1 leading-none rounded text-[10px] outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-35 disabled:cursor-default ${
                            m.current ? 'font-bold text-gold-ink' : 'font-medium text-text-secondary hover:text-primary'
                        }`}
                    >
                        {m.name}
                    </button>
                );
            })}

            {/* the day ring */}
            {days.map((iso, i) => {
                const ok = allowed(iso);
                const sel = iso === chosen;
                return (
                    <button
                        key={iso}
                        {...dayProps(iso)}
                        style={placeAt(117, (i + 0.5) * step)}
                        className={`absolute w-[7.5%] aspect-square rounded-full flex items-center justify-center leading-none text-[11px] font-numeral outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors ${
                            sel ? 'bg-primary text-white font-bold ring-2 ring-gold'
                                : !ok ? 'text-text-muted/40 cursor-default'
                                    : iso === today ? 'ring-1 ring-primary text-text-primary hover:bg-bg'
                                        : 'text-text-primary hover:bg-bg'
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
