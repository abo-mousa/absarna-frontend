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
