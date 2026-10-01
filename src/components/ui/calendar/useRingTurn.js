import { useRef } from 'react';
import { addDays, monthDays, partsOf } from '@/lib/calendarMonth';
import { angleAt, dayIndexAt, spend, turnBetween } from '@/lib/ringTurn';

function vibrate(ms) {
    try {
        navigator.vibrate?.(ms);
    } catch {
        // No vibration here, or refused: nothing to do.
    }
}

/**
 * Turning a ring-shaped month with a finger or a mouse (`lib/ringTurn`). Pressing on the ring
 * picks the day under the pointer; going round from there moves it a day per day's arc, and
 * past the month's end into the next month (its first day takes the same place at the top), so a
 * date months away is one long turn. Within `allowed` only; a light buzz per day, a stronger one
 * per month. Nothing is chosen until the pointer lifts — the goal dialog closes on a choice.
 *
 * <p>A press inside the plate, outside the ring, or on a control of its own (`data-ring-skip`: the
 * astrolabe's months) is not a turn; a press on a day that cannot be
 * chosen starts from the nearest one that can. The click a button would get
 * after a turn is swallowed: the turn has chosen already.
 *
 * @param offset where a ring lays day i: at (i + offset) day-arcs from the top
 */
export function useRingTurn({ ref, days, offset, calendar, allowed, onLive, onCommit }) {
    const state = useRef(null);
    const swallow = useRef(false);

    const read = (event) => {
        const box = ref.current.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        return { angle: angleAt(dx, dy), r: Math.hypot(dx, dy) / (box.width / 2) };
    };

    const onPointerDown = (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        // A control of its own on the ring (the astrolabe's months) is pressed, not turned.
        if (event.target.closest?.('[data-ring-skip]')) return;
        const { angle, r } = read(event);
        if (r < 0.52 || r > 1.02) return;
        // On a day that cannot be chosen (one already past), the turn starts from the nearest one
        // that can — pressing there must still begin a turn, not do nothing.
        const index = dayIndexAt(angle, days.length, offset);
        let iso = null;
        for (let d = 0; d < days.length && !iso; d++) {
            for (const i of [index + d, index - d]) {
                if (i >= 0 && i < days.length && allowed(days[i])) { iso = days[i]; break; }
            }
        }
        if (!iso) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        state.current = { iso, last: angle, acc: 0 };
        vibrate(4);
        onLive(iso);
    };

    const onPointerMove = (event) => {
        const s = state.current;
        if (!s) return;
        const { angle } = read(event);
        s.acc += turnBetween(s.last, angle);
        s.last = angle;
        const step = 360 / monthDays(s.iso, calendar).length;
        const { moved, left } = spend(s.acc, step, (n) => allowed(addDays(s.iso, n)));
        s.acc = left;
        if (!moved) return;
        const next = addDays(s.iso, moved);
        const newMonth = partsOf(next, calendar).month !== partsOf(s.iso, calendar).month;
        s.iso = next;
        vibrate(newMonth ? 18 : 4);
        onLive(next);
    };

    const finish = () => {
        const s = state.current;
        if (!s) return;
        state.current = null;
        swallow.current = true;
        setTimeout(() => { swallow.current = false; }, 0);
        onCommit(s.iso);
    };

    const onClickCapture = (event) => {
        if (!swallow.current) return;
        swallow.current = false;
        event.stopPropagation();
        event.preventDefault();
    };

    return { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish, onClickCapture };
}
