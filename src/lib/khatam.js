/**
 * The eight-pointed star's geometry and arithmetic, kept out of `ui/Khatam.jsx` so that file
 * exports components only (fast refresh) and this is tested without a DOM.
 */

/** The logo's outer ring, in the same 100×100 box as IrisMark. */
export const KHATAM_POINTS =
    '90,50 78.284,61.716 78.284,78.284 61.716,78.284 50,90 38.284,78.284 21.716,78.284 ' +
    '21.716,61.716 10,50 21.716,38.284 21.716,21.716 38.284,21.716 50,10 61.716,21.716 ' +
    '78.284,21.716 78.284,38.284';

/**
 * Clamps a completion fraction to the 0–100 that `stroke-dasharray` is measured in.
 *
 * <p>Exported so the arithmetic is tested without a DOM. `pathLength="100"` makes the outline 100
 * units long whatever its true perimeter, so the dash is simply the percentage — but a value past
 * 1 or below 0 (a watch position past a stale duration, a negative from bad data) would draw a
 * full star or a sliver that means nothing, so it is held to the range.
 */
export function khatamDash(fraction) {
    const value = Number(fraction);
    if (!Number.isFinite(value)) return 0;
    return Math.round(Math.min(1, Math.max(0, value)) * 1000) / 10;
}

/**
 * The wedge that reveals a progress star: a pie slice from the centre, starting at twelve o'clock
 * and sweeping clockwise through `fraction` of a turn, as an SVG path in the star's 100×100 box.
 * Null for nothing to reveal and for the whole star, which is drawn unmasked.
 *
 * <p><b>Why a wedge and not a dash along the outline.</b> A dash starts and ends with square cuts,
 * so it began at the star's right-most tip (the polygon's first point, three o'clock, not twelve),
 * sliced any tip it stopped inside at a slant, and at 100% met itself at that tip as two cut ends
 * instead of a mitred corner — a notch in a finished star. Revealing the complete, closed outline
 * through a wedge has none of that: the edge of the reveal is one clean radial line, a tip is
 * either reached or not, and each of the eight points is exactly an eighth of the way.
 *
 * <p>Clockwise in both directions of the interface, as a clock is in both.
 */
export function khatamSweep(fraction) {
    const value = Number(fraction);
    if (!Number.isFinite(value) || value <= 0 || value >= 1) return null;
    const r = 60; // past the stroked tips (at most ~47 from the centre), so nothing is clipped
    const angle = value * 2 * Math.PI;
    const x = Math.round((50 + r * Math.sin(angle)) * 1000) / 1000;
    const y = Math.round((50 - r * Math.cos(angle)) * 1000) / 1000;
    const largeArc = value > 0.5 ? 1 : 0;
    return `M50 50 L50 ${50 - r} A${r} ${r} 0 ${largeArc} 1 ${x} ${y} Z`;
}
