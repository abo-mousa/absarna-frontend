/**
 * The arithmetic of a ring-shaped month that turns (`ui/calendar/useRotatingRing`): a fixed marker
 * at the top, the month's days laid round the ring, and the ring turned by a finger or a mouse
 * like a dial — the day under the marker is the one chosen. Turning clockwise goes forward in time,
 * as a clock does, so the days are laid counter-clockwise: tomorrow comes up from the left.
 *
 * <p>The ring's position is a day and a fraction of one (`{ iso, frac }`): `frac` is how far past
 * that day the marker stands, −½…½. Turning adds to the fraction; every whole day of it moves the
 * day on — past the month's end into the next month, whose first day takes the same place — so a
 * date months away is one long turn. Pure, so the rules a finger meets are tested.
 */
import { addDays } from './calendarMonth';

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

/** Where day `i` of a ring of `n` stands, in degrees clockwise from the top, when `rot` is at the marker. */
export const dayAngle = (i, rot, n) => ((((rot - i) * 360) / n) % 360 + 360) % 360;

/** The day of a ring of `n` nearest a point at `angle`, when `rot` is at the marker. */
export function dayAtAngle(angle, rot, n) {
    const signed = angle > 180 ? angle - 360 : angle;   // left of the top is negative
    const i = Math.round(rot - (signed * n) / 360);
    return ((i % n) + n) % n;
}

/**
 * The ring turned by `days` (a day's arc is one; may be fractional, either sign): the fraction
 * grows, and each whole day past ½ moves the day on (or back). `allowed(iso)` says whether a day
 * may be chosen; the ring will not turn past the last one that may — it stops there, fraction 0.
 */
export function advance({ iso, frac }, days, allowed) {
    let at = iso;
    let f = frac + days;
    while (f > 0.5) {
        const next = addDays(at, 1);
        if (!allowed(next)) return { iso: at, frac: 0 };
        at = next;
        f -= 1;
    }
    while (f < -0.5) {
        const prev = addDays(at, -1);
        if (!allowed(prev)) return { iso: at, frac: 0 };
        at = prev;
        f += 1;
    }
    return { iso: at, frac: f };
}

/**
 * How fast a turn was going when the finger lifted, in days per millisecond — from the moves of
 * the last `windowMs` (`samples`: `{ t, days }`, the days each move turned). Older moves are left
 * out, so a turn that slowed to a stop before lifting has no speed to coast on.
 */
export function flingVelocity(samples, now, windowMs = 90) {
    const recent = samples.filter((s) => now - s.t <= windowMs);
    if (recent.length < 2) return 0;
    const span = Math.max(16, now - recent[0].t);
    return recent.slice(1).reduce((sum, s) => sum + s.days, 0) / span;
}

/** Fastest a fling may coast, days per millisecond (120 a second); the slowest worth coasting on. */
export const FLING_MAX = 0.12;
export const FLING_MIN = 0.002;
/** How quickly a coasting ring slows: its speed falls by 1/e every `COAST_TAU` ms. */
export const COAST_TAU = 380;

/**
 * One frame of coasting: the days turned in `dt` ms at speed `v` slowing by friction, and the speed
 * left. A fling at speed v coasts about v × COAST_TAU days in all: 50 days a second → ~19 days.
 */
export function coast(v, dt, tau = COAST_TAU) {
    const next = v * Math.exp(-dt / tau);
    return { days: (v - next) * tau, v: next };
}

/** How far ahead a day is, in the unit a person would say it in: days, then weeks, then months. */
export function distanceOf(days) {
    if (days < 14) return { unit: 'DAYS', count: days };
    if (days < 60) return { unit: 'WEEKS', count: Math.round(days / 7) };
    return { unit: 'MONTHS', count: Math.round(days / 30.44) };
}
