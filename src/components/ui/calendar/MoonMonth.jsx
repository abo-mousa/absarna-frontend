import { useMemo } from 'react';
import { partsOf } from '@/lib/calendarMonth';
import { formatDay } from '@/lib/dayFormat';
import { BOX, C, moonPath, placeAt, pt, starPoints } from './ring';

const HIJRI = 'islamic-umalqura';
// The sky stays night in both themes (the theme's primary-dark brightens in dark mode, a sky must
// not), so its colours are pinned here as classes: lit moons #F3E8CF, their dark side below.

/**
 * A Hijri month as it is seen: a moon for every night, in its phase, on a night sky inside the
 * band of eight-pointed stars the other two styles share — each moon numbered, and its Gregorian
 * day at the rim. Hijri by nature: the picker pins this style to the Hijri calendar. The moons
 * are real buttons laid over the drawing.
 */
function MoonMonth({ days, dayProps, value, today, allowed, marks, white, title }) {
    const step = 360 / days.length;
    const nights = useMemo(() => days.map((iso) => partsOf(iso, HIJRI).day), [days]);
    const chosen = value && days.includes(value) ? value : null;
    return (
        <div className="relative w-full max-w-[340px] aspect-square mx-auto">
            <svg viewBox={`0 0 ${BOX} ${BOX}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
                <circle cx={C} cy={C} r={168} className="fill-gold-light stroke-gold-ink" strokeWidth={1} />
                {Array.from({ length: 48 }, (_, k) => {
                    const [x, y] = pt(161.5, k * 7.5);
                    return <polygon key={k} points={starPoints(x, y, 4.2, k * 7.5)} fill="none" className="stroke-gold-ink" strokeWidth={0.7} />;
                })}
                <circle cx={C} cy={C} r={155} className="fill-primary-dark dark:fill-primary-light" />
                <circle cx={C} cy={C} r={146} fill="none" className="stroke-gold" strokeWidth={0.5} opacity={0.35} />
                {days.map((iso, i) => {
                    const ang = i * step;
                    const [mx, my] = pt(124, ang);
                    const [nx, ny] = pt(99, ang);
                    const [gx, gy] = pt(146, ang);
                    const sel = iso === chosen;
                    const isWhite = white(iso);
                    const ok = allowed(iso);
                    return (
                        <g key={iso} opacity={ok ? 1 : 0.35}>
                            {sel && <circle cx={mx} cy={my} r={15} className="fill-primary stroke-gold" strokeWidth={2} />}
                            {isWhite && !sel && <circle cx={mx} cy={my} r={11.5} fill="none" className="stroke-gold" strokeWidth={1} />}
                            {iso === today && !sel && <circle cx={mx} cy={my} r={13} fill="none" className="stroke-primary-light dark:stroke-primary" strokeWidth={1.4} strokeDasharray="2 2" />}
                            <circle cx={mx} cy={my} r={sel ? 10 : 8.5} className="fill-[#0D5A5A] dark:fill-[#16403E]" />
                            <path d={moonPath(mx, my, sel ? 10 : 8.5, nights[i])} className={sel ? 'fill-gold' : 'fill-[#F3E8CF]'} />
                            {sel && <circle cx={mx} cy={my} r={10} fill="none" className="stroke-gold" strokeWidth={1.1} />}
                            <text x={nx} y={ny} dominantBaseline="central" textAnchor="middle"
                                  className={`font-numeral ${sel || isWhite ? 'fill-gold font-bold' : 'fill-[#F3E8CF]'} text-[10.5px]`} opacity={sel || isWhite ? 1 : 0.8}>
                                {formatDay(iso, { day: 'numeric' }, HIJRI)}
                            </text>
                            <text x={gx} y={gy} dominantBaseline="central" textAnchor="middle" className="fill-[#E3F6F4] text-[6.5px] font-sans" opacity={0.55}>
                                {formatDay(iso, { day: 'numeric' })}
                            </text>
                            {marks[iso] && <circle cx={pt(110, ang)[0]} cy={pt(110, ang)[1]} r={1.8} className="fill-gold" />}
                        </g>
                    );
                })}
                <circle cx={C} cy={C} r={70} className="fill-surface" />
                <circle cx={C} cy={C} r={65} fill="none" className="stroke-gold" strokeWidth={1} />
                <polygon points={starPoints(C, C - 44, 6.5)} className="fill-gold stroke-gold-ink" strokeWidth={0.6} />
                {chosen ? (
                    <>
                        <text x={C} y={C - 20} textAnchor="middle" className="fill-gold-ink text-[10px] font-sans font-bold">{title}</text>
                        <text x={C} y={C + 16} textAnchor="middle" className="fill-primary-dark dark:fill-primary text-[38px] font-numeral font-bold">{formatDay(chosen, { day: 'numeric' }, HIJRI)}</text>
                        <text x={C} y={C + 33} textAnchor="middle" className="fill-text-secondary text-[9.5px] font-sans">{formatDay(chosen, { weekday: 'long', day: 'numeric', month: 'long' })}</text>
                        {marks[chosen] && <text x={C} y={C + 48} textAnchor="middle" className="fill-gold-ink text-[8.5px] font-sans font-semibold">{marks[chosen]}</text>}
                    </>
                ) : (
                    <text x={C} y={C + 6} textAnchor="middle" className="fill-primary-dark dark:fill-primary text-[15px] font-serif font-bold">{title}</text>
                )}
            </svg>
            {days.map((iso, i) => (
                <button
                    key={iso}
                    {...dayProps(iso)}
                    style={placeAt(124, i * step)}
                    className="absolute w-[9%] aspect-square rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-default"
                />
            ))}
        </div>
    );
}

export default MoonMonth;
