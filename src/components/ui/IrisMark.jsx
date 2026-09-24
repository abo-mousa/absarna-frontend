import { useId } from 'react';

/**
 * The brand mark as inline SVG, optionally animating itself into existence.
 *
 * Bare on purpose — no wrapper, no padding, no layout of its own — so it can be dropped
 * anywhere: a splash, an empty state, a page hero. `Spinner` is this plus the block
 * wrapper that page- and section-level loading needs.
 *
 * <h2>Why the geometry is repeated here</h2>
 * This is a second copy of the artwork in `src/assets/logo.svg`, and it is deliberate: the
 * blades have to be a group CSS can rotate and the rings have to be paths CSS can trace,
 * and an `<img src="logo.svg">` gives no handle on anything inside the file. **If the mark
 * changes, this changes with it** — nothing in the build would catch the drift.
 *
 * Only the parts that read at 40px are reproduced — the blades' lit leading edges are left
 * out as hero-size detail, invisible here and one more thing to keep in sync for no visible
 * gain. The glow spill IS reproduced: it carries the falloff from the aperture outward, and
 * without it the opening reads as a bright slab rather than as a source. Below about 24px
 * the iris stops resolving at all — use a plain icon there rather than shrinking this.
 *
 * <h2>The mark draws itself, and keeps drawing</h2>
 * In the `draw` state, the loading state is the act of drawing: the two rings trace along their
 * own outlines, the iris fades in behind them, the aperture lights last, and once the mark is
 * whole the blades start turning. The rings then keep tracing themselves in and out for as long
 * as the mark is mounted, so a slow load still looks like one in progress. The choreography
 * lives in `src/index.css`; `--len` is
 * each ring's true perimeter, measured off the geometry — get it wrong and a ring either
 * starts part-drawn or never closes.
 *
 * <h2>The three states, and why `turn` is not just `draw` started early</h2>
 * `state` picks one:
 *
 * <ul>
 *   <li><b>`draw`</b> (default) — the loading indicator. Draws itself on a loop, blades turning,
 *       for as long as it is mounted. Right when the mark <em>appears</em> because something is
 *       loading, which is what `Spinner` does.
 *   <li><b>`turn`</b> — already whole, turning. For a mark that was <em>already on screen</em>
 *       before the loading started, the navbar's being the case that matters: redrawing a logo
 *       the visitor has been looking at reads as the page breaking and reassembling, and it
 *       would restart on every one of the dozens of fetches a session makes. Turning says
 *       "still working" without claiming anything has been rebuilt.
 *   <li><b>`still`</b> — finished and motionless, for decorative use.
 * </ul>
 *
 * <h2>Reduced motion</h2>
 * `prefers-reduced-motion` drops the draw and the turn and leaves a finished mark that
 * fades. A loading indicator that goes completely still reads as a frozen page.
 */
function IrisMark({ size = '40px', state = 'draw', label, className = '' }) {
    // Scoped, so two marks on one page cannot collide over gradient ids.
    const id = useId();
    const g = (name) => `${id}-${name}`;
    // `draw` is the only state that plays the entrance; `turn` starts from a finished mark, so
    // it takes the rotation class alone and none of the opacity/dash choreography.
    const drawing = state === 'draw';
    const turning = state === 'draw' || state === 'turn';
    const on = (cls) => (drawing ? cls : '');

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={`${drawing ? 'iris-mark ' : ''}${className}`}
            {...(label
                ? { role: 'status', 'aria-label': label }
                : { role: 'presentation', 'aria-hidden': true })}
        >
            <defs>
                <linearGradient id={g('teal')} x1="10%" y1="0%" x2="90%" y2="100%">
                    <stop offset="0%" stopColor="#6FF0E0" />
                    <stop offset="55%" stopColor="#25B5AA" />
                    <stop offset="100%" stopColor="#0F7480" />
                </linearGradient>
                <linearGradient id={g('field')} x1="10%" y1="0%" x2="90%" y2="100%">
                    <stop offset="0%" stopColor="#1FA69E" />
                    <stop offset="100%" stopColor="#0D6470" />
                </linearGradient>
                <linearGradient id={g('blade1')} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#23AFB2" />
                    <stop offset="100%" stopColor="#0E6674" />
                </linearGradient>
                <linearGradient id={g('blade2')} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1A98A0" />
                    <stop offset="100%" stopColor="#0C606D" />
                </linearGradient>
                <linearGradient id={g('gold')} x1="10%" y1="0%" x2="90%" y2="100%">
                    <stop offset="0%" stopColor="#FFE7A8" />
                    <stop offset="50%" stopColor="#F5B43B" />
                    <stop offset="100%" stopColor="#CE8A1B" />
                </linearGradient>
                {/* Centred at 50/50 with a real falloff, matching logo.svg — an off-centre
                    hotspot and stops all within a few percent of white made the opening read
                    as a flat slab rather than as a source dimming outward. */}
                <radialGradient id={g('core')} cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="30%" stopColor="#FFFAEC" />
                    <stop offset="65%" stopColor="#FCE9B8" />
                    <stop offset="100%" stopColor="#F3CE84" />
                </radialGradient>
                <radialGradient id={g('glow')} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFF6DE" stopOpacity=".96" />
                    <stop offset="34%" stopColor="#FDEBC2" stopOpacity=".82" />
                    <stop offset="58%" stopColor="#FADFA2" stopOpacity=".50" />
                    <stop offset="80%" stopColor="#F6D189" stopOpacity=".20" />
                    <stop offset="100%" stopColor="#F2C170" stopOpacity="0" />
                </radialGradient>
            </defs>

            <polygon
                points="86.500,50.000 75.809,60.691 75.809,75.809 60.691,75.809 50.000,86.500 39.309,75.809 24.191,75.809 24.191,60.691 13.500,50.000 24.191,39.309 24.191,24.191 39.309,24.191 50.000,13.500 60.691,24.191 75.809,24.191 75.809,39.309"
                fill={`url(#${g('field')})`}
                className={on('iris-field')}
            />

            {/* Fades in behind the rings, then turns once they have finished drawing. The
                origin is the viewBox centre, not the group's own bounding box — that box
                shifts as the blades turn and the iris would wobble. */}
            <g className={on('iris-blades')}>
                {/* `iris-spin` carries the 1.45s delay that waits for the draw; `iris-turn-now`
                    is the same rotation with no delay, for a mark that is already whole. */}
                <g className={turning ? (drawing ? 'iris-spin' : 'iris-turn-now') : ''}>
                    <rect x="25.966" y="25.966" width="48.069" height="48.069" fill={`url(#${g('blade2')})`} />
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <polygon
                            key={i}
                            points="40.046,25.970 59.954,25.970 63.000,44.615 55.385,37.000"
                            fill={`url(#${g(i % 2 === 0 ? 'blade1' : 'blade2')})`}
                            transform={`rotate(${i * 45} 50 50)`}
                        />
                    ))}
                </g>
            </g>

            <polygon
                points="82.000,50.000 72.627,59.373 72.627,72.627 59.373,72.627 50.000,82.000 40.627,72.627 27.373,72.627 27.373,59.373 18.000,50.000 27.373,40.627 27.373,27.373 40.627,27.373 50.000,18.000 59.373,27.373 72.627,27.373 72.627,40.627"
                fill="none"
                stroke={`url(#${g('gold')})`}
                strokeWidth="6.5"
                strokeLinejoin="miter"
                className={on('iris-ring')}
                style={drawing ? { '--len': 215, animationDelay: '0.3s' } : undefined}
            />
            <polygon
                points="90.000,50.000 78.284,61.716 78.284,78.284 61.716,78.284 50.000,90.000 38.284,78.284 21.716,78.284 21.716,61.716 10.000,50.000 21.716,38.284 21.716,21.716 38.284,21.716 50.000,10.000 61.716,21.716 78.284,21.716 78.284,38.284"
                fill="none"
                stroke={`url(#${g('teal')})`}
                strokeWidth="7.5"
                strokeLinejoin="miter"
                className={on('iris-ring')}
                style={drawing ? { '--len': 268 } : undefined}
            />

            {/* Lights last, and after the blades in document order so they turn behind the
                opening rather than sweeping across it — as the real thing does. Spill first,
                then the opening on top, so the two read as one gradient falling off from the
                centre with no step at the aperture edge. */}
            <g className={on('iris-light')}>
                <circle cx="50" cy="50" r="22" fill={`url(#${g('glow')})`} />
                <polygon
                    points="63.000,44.615 63.000,55.385 55.385,63.000 44.615,63.000 37.000,55.385 37.000,44.615 44.615,37.000 55.385,37.000"
                    fill={`url(#${g('core')})`}
                />
            </g>
        </svg>
    );
}

export default IrisMark;
