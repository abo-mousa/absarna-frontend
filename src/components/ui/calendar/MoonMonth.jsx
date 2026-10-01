import { useMemo, useRef } from 'react';
import { partsOf } from '@/lib/calendarMonth';
import { formatDay } from '@/lib/dayFormat';
import { dayAngle } from '@/lib/ringTurn';
import { countOf } from '@/lib/plural';
import { t } from '@/i18n';
import { BOX, C, moonPath, placeAt, pt, starPoints } from './ring';
import { useRotatingRing } from './useRotatingRing';

const HIJRI = 'islamic-umalqura';
const MOON_R = 124;

/**
 * A Hijri month as it is seen, turning: a moon for every night, in its phase, on a night sky
 * inside the band of eight-pointed stars — and the ring of moons turns like a dial under a finger
 * or a mouse (`useRotatingRing`) past the gold halo at the top; the night under it is the one
 * chosen. Each moon carries its number, and its Gregorian day at the rim; while a turn is under way
 * the plate says how many nights it has moved. Hijri by nature: the picker pins this style to the
 * Hijri calendar. The sky stays night in both themes, so its colours are pinned as classes.
 */
function MoonMonth({ days, dayProps, value, today, allowed, marks, white, title, onLive, onCommit, ahead }) {
    const ref = useRef(null);
    const { rot, turned, handlers } = useRotatingRing({ ref, days, shown: value, allowed, calendar: HIJRI, onLive, onCommit });
    const n = days.length;
    const at = (i) => dayAngle(i, rot, n);
    const nights = useMemo(() => days.map((iso) => partsOf(iso, HIJRI).day), [days]);
    const chosen = value && days.includes(value) ? value : null;
    const atMarker = days[((Math.round(rot) % n) + n) % n];
    const [hx, hy] = pt(MOON_R, 0);
    return (
        <div ref={ref} {...handlers} className="relative w-full max-w-[340px] aspect-square mx-auto touch-none cursor-grab active:cursor-grabbing">
            <svg viewBox={`0 0 ${BOX} ${BOX}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
                <circle cx={C} cy={C} r={168} className="fill-gold-light stroke-gold-ink" strokeWidth={1} />
                {Array.from({ length: 48 }, (_, k) => {
                    const [x, y] = pt(161.5, k * 7.5);
                    return <polygon key={k} points={starPoints(x, y, 4.2, k * 7.5)} fill="none" className="stroke-gold-ink" strokeWidth={0.7} />;
                })}
                <circle cx={C} cy={C} r={155} className="fill-primary-dark dark:fill-primary-light" />
                <circle cx={C} cy={C} r={146} fill="none" className="stroke-gold" strokeWidth={0.5} opacity={0.35} />
                {/* the marker: a fixed halo at the top, the night under it chosen */}
                <circle cx={hx} cy={hy} r={16} className="fill-primary stroke-gold" strokeWidth={2} />
                <path d={`M${C - 7},${C - 154} L${C + 7},${C - 154} L${C},${C - 145} Z`} className="fill-gold" />
                {days.map((iso, i) => {
                    const a = at(i);
                    const [mx, my] = pt(MOON_R, a);
                    const [nx, ny] = pt(99, a);
                    const [gx, gy] = pt(146, a);
                    const isWhite = white(iso);
                    const ok = allowed(iso);
                    const lit = iso === atMarker;
                    return (
                        <g key={iso} opacity={ok ? 1 : 0.35}>
                            {isWhite && <circle cx={mx} cy={my} r={11.5} fill="none" className="stroke-gold" strokeWidth={1} />}
                            {iso === today && <circle cx={mx} cy={my} r={13} fill="none" className="stroke-primary-light dark:stroke-primary" strokeWidth={1.4} strokeDasharray="2 2" />}
                            <circle cx={mx} cy={my} r={lit ? 10 : 8.5} className="fill-[#0D5A5A] dark:fill-[#16403E]" />
                            <path d={moonPath(mx, my, lit ? 10 : 8.5, nights[i])} className={lit ? 'fill-gold' : 'fill-[#F3E8CF]'} />
                            {lit && <circle cx={mx} cy={my} r={10} fill="none" className="stroke-gold" strokeWidth={1.1} />}
                            <text x={nx} y={ny} dominantBaseline="central" textAnchor="middle"
                                  className={`font-numeral ${lit || isWhite ? 'fill-gold font-bold' : 'fill-[#F3E8CF]'} text-[10.5px]`} opacity={lit || isWhite ? 1 : 0.8}>
                                {formatDay(iso, { day: 'numeric' }, HIJRI)}
                            </text>
                            <text x={gx} y={gy} dominantBaseline="central" textAnchor="middle" className="fill-[#E3F6F4] text-[6.5px] font-sans" opacity={0.55}>
                                {formatDay(iso, { day: 'numeric' })}
                            </text>
                            {marks[iso] && <circle cx={pt(110, a)[0]} cy={pt(110, a)[1]} r={1.8} className="fill-gold" />}
                        </g>
                    );
                })}
                <circle cx={C} cy={C} r={70} className="fill-surface" />
                <circle cx={C} cy={C} r={65} fill="none" className="stroke-gold" strokeWidth={1} />
                <polygon points={starPoints(C, C - 44, 6.5)} className="fill-gold stroke-gold-ink" strokeWidth={0.6} />
                {turned != null ? (
                    <>
                        <text x={C} y={C - 24} textAnchor="middle" className="fill-gold-ink text-[10.5px] font-sans font-bold">{t('calendar.thisTurn')}</text>
                        <text x={C} y={C + 2} textAnchor="middle" className="fill-gold-ink text-[22px] font-sans font-bold">
                            {turned === 0 ? '0' : `${turned > 0 ? '+' : '−'}${countOf('journey.units.DAYS', Math.abs(turned))}`}
                        </text>
                    </>
                ) : chosen ? (
                    <>
                        <text x={C} y={C - 28} textAnchor="middle" className="fill-gold-ink text-[10.5px] font-sans font-bold">{title}</text>
                        <text x={C} y={C + 4} textAnchor="middle" className="fill-primary-dark dark:fill-primary text-[34px] font-numeral font-bold">{formatDay(chosen, { day: 'numeric' }, HIJRI)}</text>
                    </>
                ) : (
                    <text x={C} y={C + 6} textAnchor="middle" className="fill-primary-dark dark:fill-primary text-[15px] font-serif font-bold">{title}</text>
                )}
                {/* how far ahead, right under the night it is about */}
                {ahead && (
                    <>
                        <text x={C} y={C + 27} textAnchor="middle" className="fill-primary-dark dark:fill-primary text-[16px] font-sans font-bold">{ahead.main}</text>
                        {ahead.days && <text x={C} y={C + 44} textAnchor="middle" className="fill-text-secondary text-[11px] font-sans font-semibold">{ahead.days}</text>}
                    </>
                )}
            </svg>
            {days.map((iso, i) => (
                <button
                    key={iso}
                    {...dayProps(iso)}
                    style={placeAt(MOON_R, at(i))}
                    className="absolute w-[9%] aspect-square rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-default"
                />
            ))}
        </div>
    );
}

export default MoonMonth;
