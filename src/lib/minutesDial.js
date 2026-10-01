/**
 * The arithmetic of «كم من يومك؟»'s dial (`journey/choose/MinutesDial`): one turn is two hours, read
 * clockwise from the top, in five-minute steps — twenty-four positions, about 35 px apart on a
 * phone, so each can be hit on purpose.
 *
 * <p>Pure, so the rules a finger meets are tested rather than tried: snapping, the slight pull
 * towards the usual lengths, and that the dial never wraps — dragging past two hours stops there,
 * and so does dragging below five minutes, so a slip never turns two hours into five minutes.
 */

export const DIAL_MIN = 5;
export const DIAL_MAX = 120;
export const DIAL_STEP = 5;
/** The four lengths the dial marks with gold beads, which pull a little harder than a plain step. */
export const DIAL_USUAL = [10, 20, 45, 60];
/** How close, in minutes, a usual length starts to pull. */
const PULL = 3;

/** Degrees clockwise from the top, for a length. */
export const angleOf = (minutes) => (minutes / DIAL_MAX) * 360;

/** A raw reading (any number of minutes) snapped: a usual length when close, else the nearest step. */
export function snap(raw) {
    const usual = DIAL_USUAL.find((m) => Math.abs(raw - m) <= PULL);
    const value = usual ?? Math.round(raw / DIAL_STEP) * DIAL_STEP;
    return Math.min(DIAL_MAX, Math.max(DIAL_MIN, value));
}

/**
 * The length a pointer at (`dx`, `dy`) from the centre means — screen coordinates, y down — given
 * the length it was on a moment ago. Crossing the top of the dial is not a wrap: from the last
 * quarter it holds at two hours, from the first it holds at five minutes.
 */
export function minutesAt(dx, dy, previous) {
    let degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (degrees < 0) degrees += 360;
    const raw = (degrees / 360) * DIAL_MAX;
    if (previous != null) {
        if (previous >= DIAL_MAX * 0.75 && raw < DIAL_MAX * 0.25) return DIAL_MAX;
        if (previous <= DIAL_MAX * 0.25 && raw > DIAL_MAX * 0.75) return DIAL_MIN;
    }
    return snap(raw);
}

/** A key's step from `value`; null for a key the dial does not use. `rtl` mirrors left and right. */
export function stepFor(key, value, rtl = false) {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    const next = {
        ArrowUp: value + DIAL_STEP, [forward]: value + DIAL_STEP,
        ArrowDown: value - DIAL_STEP, [back]: value - DIAL_STEP,
        PageUp: value + 15, PageDown: value - 15,
        Home: DIAL_MIN, End: DIAL_MAX,
    }[key];
    if (next == null) return null;
    // A step from an odd value (an address can carry 33) lands on the step grid.
    const aligned = key.startsWith('Arrow') || key.startsWith('Page') ? Math.round(next / DIAL_STEP) * DIAL_STEP : next;
    return Math.min(DIAL_MAX, Math.max(DIAL_MIN, aligned));
}
