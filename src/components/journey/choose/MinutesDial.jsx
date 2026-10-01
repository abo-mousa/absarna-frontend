import { useEffect, useRef, useState } from 'react';
import { DIAL_MAX, DIAL_MIN, DIAL_USUAL, angleOf, minutesAt, stepFor } from '@/lib/minutesDial';
import { KHATAM_POINTS } from '@/lib/khatam';
import { learningTime } from '@/lib/goalText';
import { formatCount } from '@/lib/numbers';
import { currentLocale, formatDigits, isRtl, t } from '@/i18n';

const C = 170;            // the centre, in a 340 × 340 box
const TRACK = 128;        // the radius the arc and the star run on
const HIT_INNER = 84;     // a press inside the plate is not a choice

const pt = (r, degrees) => {
    const a = ((degrees - 90) * Math.PI) / 180;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

/** A star polygon {n/k} — the astrolabe's openwork, under the readout. */
function Rosette({ r, n, k, className }) {
    const pts = Array.from({ length: n }, (_, i) => pt(r, (i * 360) / n));
    return pts.map((a, i) => {
        const b = pts[(i + k) % n];
        return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={className} />;
    });
}

/** Points of the khatam star (`KHATAM_POINTS`, a 100-unit box) scaled to radius `r` at (x, y). */
const khatamAt = (x, y, r) => KHATAM_POINTS.split(' ').map((p) => {
    const [px, py] = p.split(',').map(Number);
    return `${(x + ((px - 50) / 40) * r).toFixed(2)},${(y + ((py - 50) / 40) * r).toFixed(2)}`;
}).join(' ');

function vibrate(ms) {
    try {
        navigator.vibrate?.(ms);
    } catch {
        // A browser without it, or one that refuses it, simply does not buzz.
    }
}

/**
 * «كم من يومك؟» as the astrolabe's dial — the mockup the product owner chose, the time picker's
 * only form (the date picker's three styles do not apply to it). One turn is two hours, read
 * clockwise from the top; a gold-edged turquoise arc fills to the length and the khatam star is
 * its handle; the usual lengths are gold beads on the rim.
 *
 * <h4>What a finger meets</h4>
 * <ul>
 *   <li>Five-minute steps (`lib/minutesDial`), and the usual lengths pull a little harder.</li>
 *   <li>Dragging the star, or pressing anywhere on the ring, follows the finger; the number in the
 *       middle shows the length that will be chosen, never an in-between one, and the choice is
 *       made when the finger lifts — so the address is written once, not twenty times a drag.</li>
 *   <li>It never wraps: past two hours holds at two hours, below five minutes at five.</li>
 *   <li>A light vibration per step where the phone has one, stronger at a usual length.</li>
 *   <li>Arrows move five minutes (left and right mirrored in Arabic), Page Up/Down fifteen, Home
 *       and End to the ends; a screen reader hears the length as a sentence.</li>
 *   <li>With a mouse: click anywhere on the ring, drag the star (the cursor says which), or turn
 *       the wheel once the dial is focused — five minutes a notch.</li>
 * </ul>
 * The arc and the star glide between steps; under reduced motion they jump.
 */
function MinutesDial({ value, onChange }) {
    const [live, setLive] = useState(null);       // the length while a finger is down
    // A drag follows the finger with no glide; a click or a tap glides to where it landed.
    const [dragged, setDragged] = useState(false);
    // The length just chosen, held until the page has it: between the finger lifting and the
    // address changing there is a render with the old `value`, and showing it was the «blip» —
    // the star snapped back to where it had been, then jumped forward again.
    const [held, setHeld] = useState(null);
    useEffect(() => setHeld(null), [value]);
    const svgRef = useRef(null);
    const sliderRef = useRef(null);
    const latest = useRef({ value, onChange });
    latest.current = { value, onChange };
    const shown = live ?? held ?? value;
    const rtl = isRtl();

    const read = (event, previous) => {
        const box = svgRef.current.getBoundingClientRect();
        const scale = 340 / box.width;
        const dx = (event.clientX - box.left) * scale - C;
        const dy = (event.clientY - box.top) * scale - C;
        if (previous == null && Math.hypot(dx, dy) < HIT_INNER) return null;
        return minutesAt(dx, dy, previous);
    };
    const buzz = (next) => vibrate(DIAL_USUAL.includes(next) ? 12 : 4);
    const onPointerDown = (event) => {
        const next = read(event, null);
        if (next == null) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        if (next !== shown) buzz(next);
        setDragged(false);
        setLive(next);
    };
    const onPointerMove = (event) => {
        if (live == null) return;
        const next = read(event, live);
        if (next == null || next === live) return;
        buzz(next);
        setDragged(true);
        setLive(next);
    };
    const finish = () => {
        if (live == null) return;
        const chosen = live;
        setLive(null);
        setDragged(false);
        if (chosen !== value) {
            setHeld(chosen);
            onChange(chosen);
        }
    };
    // A mouse wheel or a trackpad turns the dial — but only once the dial has been clicked or
    // tabbed to, so scrolling the page past it never changes a choice. Listened to directly,
    // because React's wheel handler is passive and could not keep the page from scrolling too.
    useEffect(() => {
        const node = sliderRef.current;
        if (!node) return undefined;
        let pending = 0;
        const onWheel = (event) => {
            if (document.activeElement !== node) return;
            event.preventDefault();
            pending += event.deltaY;
            if (Math.abs(pending) < 40) return;   // a trackpad sends many small deltas: one step per notch's worth
            const { value: current, onChange: change } = latest.current;
            const next = stepFor(pending < 0 ? 'ArrowUp' : 'ArrowDown', current);
            pending = 0;
            if (next !== current) change(next);
        };
        node.addEventListener('wheel', onWheel, { passive: false });
        return () => node.removeEventListener('wheel', onWheel);
    }, []);

    const onKeyDown = (event) => {
        const next = stepFor(event.key, value, rtl);
        if (next == null) return;
        event.preventDefault();
        if (next !== value) onChange(next);
    };

    const angle = angleOf(shown);
    const fill = (shown / DIAL_MAX) * 100;
    const unit = new Intl.PluralRules(currentLocale()).select(shown) === 'few' ? t('journey.dial.unitFew') : t('journey.dial.unitMany');
    const hint = t(`journey.choose.minutesHint.${shown < 15 ? 'm10' : shown < 35 ? 'm20' : shown < 55 ? 'm45' : 'm60'}`);
    const glide = dragged ? '' : 'transition-[stroke-dasharray,transform] duration-200 ease-out motion-reduce:transition-none';

    return (
        <div
            ref={sliderRef}
            role="slider"
            tabIndex={0}
            aria-label={t('journey.dial.aria')}
            aria-valuemin={DIAL_MIN}
            aria-valuemax={DIAL_MAX}
            aria-valuenow={shown}
            aria-valuetext={learningTime(shown)}
            onKeyDown={onKeyDown}
            className="relative w-full max-w-[340px] aspect-square mx-auto rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-bg touch-none select-none"
        >
            <svg
                ref={svgRef}
                viewBox="0 0 340 340"
                className={`w-full h-full ${dragged ? 'cursor-grabbing' : 'cursor-pointer'}`}
                aria-hidden="true"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={finish}
                onPointerCancel={finish}
            >
                {/* the limb, engraved */}
                <circle cx={C} cy={C} r={166} className="fill-gold-light stroke-gold-ink" strokeWidth={1.3} />
                {Array.from({ length: 120 }, (_, k) => {
                    const [x1, y1] = pt(166, k * 3);
                    const [x2, y2] = pt(k % 5 ? 162.5 : 161, k * 3);
                    return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-gold-ink" strokeWidth={0.6} opacity={0.5} />;
                })}
                <circle cx={C} cy={C} r={159} className="fill-surface stroke-gold-ink" strokeWidth={0.8} />

                {/* the track, and the length on it — a dash on one circle, so it can glide */}
                <circle cx={C} cy={C} r={TRACK} fill="none" className="stroke-border-light" strokeWidth={22} />
                <circle
                    cx={C} cy={C} r={TRACK} fill="none" pathLength={100}
                    strokeDasharray={`${fill} 100`} transform={`rotate(-90 ${C} ${C})`}
                    className={`stroke-gold ${glide}`} strokeWidth={25}
                />
                <circle
                    cx={C} cy={C} r={TRACK} fill="none" pathLength={100}
                    strokeDasharray={`${fill} 100`} transform={`rotate(-90 ${C} ${C})`}
                    className={`stroke-primary ${glide}`} strokeWidth={21}
                />

                {/* ticks every five minutes, longer on the quarter hours */}
                {Array.from({ length: DIAL_MAX / 5 }, (_, i) => {
                    const m = i * 5;
                    const major = m % 15 === 0;
                    const [x1, y1] = pt(157, angleOf(m));
                    const [x2, y2] = pt(major ? 149 : 153, angleOf(m));
                    return <line key={m} x1={x1} y1={y1} x2={x2} y2={y2} className={major ? 'stroke-gold-ink' : 'stroke-text-muted'} strokeWidth={major ? 1.3 : 0.8} />;
                })}
                {[15, 30, 45, 60, 75, 90, 105, 120].map((m) => {
                    const [x, y] = pt(100, angleOf(m % DIAL_MAX));
                    const label = m === 60 ? t('journey.dial.hour') : m === 120 ? t('journey.dial.twoHours') : formatDigits(String(m));
                    const on = m === shown;
                    return (
                        <text key={m} x={x} y={y} dominantBaseline="central" textAnchor="middle"
                              className={`${on ? 'fill-primary-dark dark:fill-primary font-bold' : 'fill-text-secondary font-semibold'} ${m % 60 === 0 ? 'text-[10px] font-sans' : 'text-[12px] font-numeral'}`}>
                            {label}
                        </text>
                    );
                })}

                {/* the usual lengths, as gold beads on the rim */}
                {DIAL_USUAL.map((m) => {
                    const [x, y] = pt(159, angleOf(m));
                    return <circle key={m} cx={x} cy={y} r={3.2} className="fill-gold stroke-gold-ink" strokeWidth={0.6} />;
                })}

                {/* the plate: the rete's openwork and the readout */}
                <circle cx={C} cy={C} r={84} className="fill-bg stroke-border" strokeWidth={1} />
                <Rosette r={82} n={16} k={6} className="stroke-gold-ink" />
                <g opacity={0.5}><Rosette r={82} n={8} k={3} className="stroke-gold" /></g>
                <circle cx={C} cy={C} r={52} className="fill-surface stroke-gold" strokeWidth={1.2} />
                <text x={C} y={C - 27} textAnchor="middle" className="fill-text-secondary text-[9.5px] font-sans">{hint}</text>
                <text x={C} y={C + 14} textAnchor="middle" className="fill-primary-dark dark:fill-primary text-[42px] font-numeral font-bold">{formatCount(shown)}</text>
                <text x={C} y={C + 32} textAnchor="middle" className="fill-gold-ink text-[11px] font-sans font-semibold">{unit}</text>

                {/* the handle: the khatam star at the end of the arc */}
                <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${C}px ${C}px` }} className={`${glide} ${dragged ? 'cursor-grabbing' : 'cursor-grab'}`}>
                    <circle cx={C} cy={C - TRACK} r={17} className="fill-surface stroke-gold" strokeWidth={2} />
                    <polygon points={khatamAt(C, C - TRACK, 11)} className="fill-gold stroke-gold-ink" strokeWidth={0.8} />
                </g>
            </svg>
        </div>
    );
}

export default MinutesDial;
