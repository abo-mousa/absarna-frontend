/**
 * Geometry shared by the ring-shaped months (`AstrolabeMonth`, `MoonMonth`): a 340-unit square,
 * angles clockwise from the top. Day buttons are HTML laid over the drawing by percentage, so they
 * stay real buttons — focusable, labelled, keyboard-driven — however the ring scales.
 */
export const BOX = 340;
export const C = BOX / 2;

export function pt(r, degrees) {
    const a = ((degrees - 90) * Math.PI) / 180;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

/** Where a point of the drawing sits, as CSS for an absolutely placed element centred on it. */
export const placeAt = (r, degrees) => {
    const [x, y] = pt(r, degrees);
    return { left: `${(x / BOX) * 100}%`, top: `${(y / BOX) * 100}%`, transform: 'translate(-50%, -50%)' };
};

/** A band between two radii over an arc, as a path. */
export function bandPath(r0, r1, a0, a1) {
    const large = a1 - a0 > 180 ? 1 : 0;
    const [x0o, y0o] = pt(r1, a0); const [x1o, y1o] = pt(r1, a1);
    const [x1i, y1i] = pt(r0, a1); const [x0i, y0i] = pt(r0, a0);
    return `M${x0o},${y0o} A${r1},${r1} 0 ${large} 1 ${x1o},${y1o} L${x1i},${y1i} A${r0},${r0} 0 ${large} 0 ${x0i},${y0i} Z`;
}

/** The eight-pointed star at (x, y), radius r — the platform's khatam, as polygon points. */
export function starPoints(x, y, r, rot = 0, inner = 0.72) {
    const out = [];
    for (let k = 0; k < 16; k++) {
        const rr = k % 2 === 0 ? r : r * inner;
        const a = (((rot + k * 22.5) - 90) * Math.PI) / 180;
        out.push(`${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`);
    }
    return out.join(' ');
}

/** A moon of `r` at (x, y) on night `day` of a lunar month, lit limb right while waxing. */
export function moonPath(x, y, r, day) {
    const p = (day - 1) / 29.5;
    const c = Math.cos(2 * Math.PI * p);
    const rx = Math.abs(c) * r;
    const waxing = p < 0.5;
    const s1 = waxing ? 1 : 0;
    const s2 = waxing ? (c > 0 ? 0 : 1) : (c > 0 ? 1 : 0);
    return `M${x},${y - r} A${r},${r} 0 0 ${s1} ${x},${y + r} A${rx},${r} 0 0 ${s2} ${x},${y - r} Z`;
}

/** Star polygon {n/k} lines — the astrolabe's openwork. */
export function rosetteLines(r, n, k) {
    const pts = Array.from({ length: n }, (_, i) => pt(r, (i * 360) / n));
    return pts.map((a, i) => [a, pts[(i + k) % n]]);
}
