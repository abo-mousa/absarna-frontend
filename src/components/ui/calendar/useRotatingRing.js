import { useEffect, useRef, useState } from 'react';
import { daysBetween } from '@/lib/dayFormat';
import { partsOf } from '@/lib/calendarMonth';
import { advance, angleAt, dayAtAngle, turnBetween } from '@/lib/ringTurn';

const SETTLE_MS = 220;
const TAP_PX = 6;

function vibrate(ms) {
    try {
        navigator.vibrate?.(ms);
    } catch {
        // No vibration here, or refused: nothing to do.
    }
}

const reducedMotion = () => {
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        return false;
    }
};

/**
 * A ring-shaped month that turns like a dial (`lib/ringTurn`): a fixed marker at the top, and
 * the day under it is the one chosen. Grab the ring anywhere and turn it — clockwise is forward,
 * as on a clock — and the days pass under the marker; past the month's end the next month's days
 * come round in their place, so a date months away is one long turn, never earlier than `allowed`
 * permits. Letting go settles the ring onto the nearest day and chooses it; a tap (no turn)
 * chooses the day tapped and turns the ring to bring it to the marker; a choice made elsewhere —
 * the keys, the month arrows — turns it there too. A light buzz per day, a stronger one per month.
 *
 * <p>A press inside the plate, outside the ring, or on a control of its own (`data-ring-skip`)
 * is not a turn. The click a day's button would get after a turn is swallowed: the turn has chosen.
 *
 * @returns `rot` — the ring's position as a day index (with the fraction of a turn) in `days`;
 *          `turned` — the whole days this turn has moved, while one is under way; and handlers
 */
export function useRotatingRing({ ref, days, shown, allowed, calendar, onLive, onCommit }) {
    const anchor = shown && days.includes(shown) ? shown : (days.find(allowed) ?? days[0]);
    const [pos, setPos] = useState({ iso: anchor, frac: 0 });
    const posRef = useRef(pos);
    posRef.current = pos;
    const drag = useRef(null);
    const frame = useRef(0);
    const swallow = useRef(false);
    const [turned, setTurned] = useState(null);
    // A settle still running when the ring goes (the goal dialog closes on a choice) stops with it.
    useEffect(() => () => cancelAnimationFrame(frame.current), []);

    // Settle on `anchor`: from wherever the ring stands now, turning the short way to it.
    useEffect(() => {
        if (drag.current) return undefined;
        const from = days.indexOf(posRef.current.iso);
        const to = days.indexOf(anchor);
        const start = from >= 0 && to >= 0 ? from + posRef.current.frac - to : 0;
        cancelAnimationFrame(frame.current);
        if (start === 0 || reducedMotion()) {
            setPos({ iso: anchor, frac: 0 });
            return undefined;
        }
        const began = performance.now();
        const tick = (now) => {
            const t = Math.min(1, (now - began) / SETTLE_MS);
            const eased = 1 - (1 - t) ** 3;
            setPos({ iso: anchor, frac: start * (1 - eased) });
            if (t < 1) frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame.current);
    }, [anchor]); // eslint-disable-line react-hooks/exhaustive-deps

    const read = (event) => {
        const box = ref.current.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        return { angle: angleAt(dx, dy), r: Math.hypot(dx, dy) / (box.width / 2) };
    };

    const onPointerDown = (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        if (event.target.closest?.('[data-ring-skip]')) return;
        const { angle, r } = read(event);
        if (r < 0.5 || r > 1.02) return;
        cancelAnimationFrame(frame.current);
        event.currentTarget.setPointerCapture?.(event.pointerId);
        drag.current = { last: angle, x: event.clientX, y: event.clientY, moved: false, startIso: posRef.current.iso };
    };

    const onPointerMove = (event) => {
        const d = drag.current;
        if (!d) return;
        if (!d.moved && Math.hypot(event.clientX - d.x, event.clientY - d.y) < TAP_PX) return;
        d.moved = true;
        const { angle } = read(event);
        const delta = turnBetween(d.last, angle);
        d.last = angle;
        const prev = posRef.current;
        const next = advance(prev, (delta * days.length) / 360, allowed);
        posRef.current = next;
        setPos(next);
        if (next.iso !== prev.iso) {
            const newMonth = partsOf(next.iso, calendar).month !== partsOf(prev.iso, calendar).month;
            vibrate(newMonth ? 18 : 4);
            setTurned(daysBetween(d.startIso, next.iso));
            onLive(next.iso);
        }
    };

    const finish = (event) => {
        const d = drag.current;
        if (!d) return;
        drag.current = null;
        setTurned(null);
        swallow.current = true;
        setTimeout(() => { swallow.current = false; }, 0);
        if (!d.moved) {
            // A tap: the day nearest it, turned to the marker.
            const { angle } = read(event);
            const rot = Math.max(0, days.indexOf(posRef.current.iso)) + posRef.current.frac;
            const iso = days[dayAtAngle(angle, rot, days.length)];
            if (allowed(iso)) {
                vibrate(4);
                onCommit(iso);
            }
            return;
        }
        // A turn: choose the day at the marker, and let the ring settle onto it.
        const { iso, frac } = posRef.current;
        onCommit(iso);
        if (frac !== 0) {
            const began = performance.now();
            const tick = (now) => {
                const t = Math.min(1, (now - began) / SETTLE_MS);
                setPos({ iso, frac: frac * (1 - (1 - (1 - t) ** 3)) });
                if (t < 1) frame.current = requestAnimationFrame(tick);
            };
            if (reducedMotion()) setPos({ iso, frac: 0 });
            else frame.current = requestAnimationFrame(tick);
        }
    };

    const onClickCapture = (event) => {
        if (!swallow.current) return;
        swallow.current = false;
        event.stopPropagation();
        event.preventDefault();
    };

    const index = days.indexOf(pos.iso);
    const rot = (index >= 0 ? index : Math.max(0, days.indexOf(anchor))) + (index >= 0 ? pos.frac : 0);
    return {
        rot,
        turned,
        handlers: { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish, onClickCapture },
    };
}
