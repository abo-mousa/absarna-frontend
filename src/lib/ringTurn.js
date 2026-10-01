/**
 * The arithmetic of turning a ring-shaped month (`ui/calendar/AstrolabeMonth`, `MoonMonth`):
 * a finger going round moves the chosen day one day per day's arc, and going past the last day
 * of the month carries on into the next — the next month's first day takes the same place at the
 * top, so the finger never has to let go. Pure, so the rules a finger meets are tested.
 */

/** Signed shortest turn from `from` to `to`, in degrees (−180…180]. */
export function turnBetween(from, to) {
    let d = (to - from) % 360;
    if (d > 180) d -= 360;
    if (d <= -180) d += 360;
    return d;
}

/** Degrees clockwise from the top for a point (`dx`, `dy`) from the centre, screen y down. */
export function angleAt(dx, dy) {
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    return deg < 0 ? deg + 360 : deg;
}

/** The index of the day under `angle` on a ring of `n` days whose day i sits at (i + offset) arcs. */
export function dayIndexAt(angle, n, offset) {
    const step = 360 / n;
    return ((Math.round(angle / step - offset) % n) + n) % n;
}

/**
 * One move of a turn. `acc` is the turn not yet spent; each whole day's arc of it (`step`, which
 * the caller gives for the month the day is in now — months differ) moves the day one on, or
 * back. `canMove(direction)` says whether the next day that way may be chosen; where it may not,
 * the leftover is dropped so turning back responds at once. Returns the days moved and what is
 * left of the turn.
 */
export function spend(acc, step, canMove) {
    let moved = 0;
    let left = acc;
    while (Math.abs(left) >= step) {
        const direction = left > 0 ? 1 : -1;
        if (!canMove(moved + direction)) return { moved, left: 0 };
        moved += direction;
        left -= direction * step;
    }
    return { moved, left };
}

/** How far ahead a day is, in the unit a person would say it in: days, then weeks, then months. */
export function distanceOf(days) {
    if (days < 14) return { unit: 'DAYS', count: days };
    if (days < 60) return { unit: 'WEEKS', count: Math.round(days / 7) };
    return { unit: 'MONTHS', count: Math.round(days / 30.44) };
}
