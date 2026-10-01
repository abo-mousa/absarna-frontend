import { aWeekFromSaturday, weekColumn } from '@/lib/calendarMonth';
import { formatDay } from '@/lib/dayFormat';
import { starPoints } from './ring';

/**
 * A month as zellige: each day an eight-pointed star tile, Saturday to Friday, with the small
 * cross tiles laid where four days meet — the way the tilework is actually set. The tiles touch
 * point to point (no gap), so the crosses sit exactly on the corners whatever the width.
 */
function ZelligeMonth({ days, dayProps, value, today, allowed, marks, calendar, other, white }) {
    const blanks = weekColumn(days[0]);
    const rows = Math.ceil((blanks + days.length) / 7);
    const filled = new Set(days.map((_, i) => `${Math.floor((blanks + i) / 7)}:${(blanks + i) % 7}`));
    const crosses = [];
    for (let r = 1; r < rows; r++) {
        for (let c = 1; c < 7; c++) {
            if ([`${r - 1}:${c - 1}`, `${r - 1}:${c}`, `${r}:${c - 1}`, `${r}:${c}`].every((k) => filled.has(k))) crosses.push([r, c]);
        }
    }
    return (
        <div className="rounded-2xl border border-border bg-bg p-2.5">
            <div className="grid grid-cols-7 text-center mb-1.5" aria-hidden="true">
                {aWeekFromSaturday().map((day) => (
                    <span key={day} className="text-[0.7rem] font-semibold text-text-muted">{formatDay(day, { weekday: 'short' })}</span>
                ))}
            </div>
            <div className="relative">
                {/* the crosses, behind the stars: columns run from the reading start */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 700 ${rows * 100}`} preserveAspectRatio="none" aria-hidden="true">
                    {crosses.map(([r, c]) => {
                        const x = (document.documentElement.dir === 'rtl' ? 7 - c : c) * 100;
                        const y = r * 100;
                        return <path key={`${r}-${c}`} d={`M${x},${y - 15} L${x + 6},${y - 6} L${x + 15},${y} L${x + 6},${y + 6} L${x},${y + 15} L${x - 6},${y + 6} L${x - 15},${y} L${x - 6},${y - 6} Z`} className="fill-primary-light stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />;
                    })}
                </svg>
                <div className="relative grid grid-cols-7">
                    {Array.from({ length: blanks }, (_, i) => <span key={`b${i}`} />)}
                    {days.map((iso) => {
                        const ok = allowed(iso);
                        const selected = iso === value;
                        const isWhite = white(iso);
                        const tile = selected ? 'fill-primary stroke-gold'
                            : !ok ? 'fill-surface stroke-border-light opacity-50'
                                : isWhite ? 'fill-gold-light stroke-gold'
                                    : 'fill-surface stroke-border';
                        return (
                            <button
                                key={iso}
                                {...dayProps(iso)}
                                className={`group relative aspect-square flex flex-col items-center justify-center leading-none outline-none ${ok ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
                                    <polygon
                                        points={starPoints(50, 50, 47, 0, 0.76)}
                                        className={`${tile} transition-colors ${ok && !selected ? 'group-hover:stroke-primary' : ''} group-focus-visible:stroke-primary`}
                                        strokeWidth={selected ? 4 : 2}
                                        strokeLinejoin="round"
                                    />
                                    {iso === today && !selected && <polygon points={starPoints(50, 50, 40, 0, 0.76)} fill="none" className="stroke-primary" strokeWidth={2} />}
                                </svg>
                                <span className={`relative text-[0.95rem] font-numeral font-bold ${selected ? 'text-white' : isWhite ? 'text-gold-ink' : ok ? 'text-text-primary' : 'text-text-muted'}`}>
                                    {formatDay(iso, { day: 'numeric' }, calendar)}
                                </span>
                                <span className={`relative text-[0.55rem] mt-0.5 ${selected ? 'text-white/80' : 'text-text-muted'}`}>{formatDay(iso, { day: 'numeric' }, other)}</span>
                                {marks[iso] && <span className={`absolute top-[3%] w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : 'bg-gold'}`} aria-hidden="true" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default ZelligeMonth;
