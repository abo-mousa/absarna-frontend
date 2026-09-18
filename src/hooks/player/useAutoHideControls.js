import { useCallback, useEffect, useRef, useState } from 'react';
import { pointerMoved } from '@/lib/player/gestures';

/**
 * How long the control bar stays up after the pointer stops moving.
 *
 * <p>Only while something is actually playing: a paused video is not being watched, and hiding the
 * controls on it just makes them hard to find. Roughly what the browsers' own bars used (Chrome
 * ~2.5s), because that is the delay this audience already has in its fingers.
 */
const CONTROLS_IDLE_MS = 2800;

/**
 * Shows and fades the overlay cluster.
 *
 * <p>`nudge` is called from the container's pointer handlers and from the shortcut handler, so the
 * bar appears the moment the viewer looks for it. The fade is only re-armed while something is
 * playing — a paused player keeps its controls, and a viewer who paused to change quality would
 * otherwise watch the menu button vanish under their pointer.
 */
export function useAutoHideControls(videoRef) {
    const [controlsVisible, setControlsVisible] = useState(true);
    const idleTimerRef = useRef(null);
    // Where the pointer was the last time it reported a position — see `nudgeFromPointer`.
    const lastPointRef = useRef(null);

    const nudge = useCallback(() => {
        setControlsVisible(true);
        clearTimeout(idleTimerRef.current);
        const el = videoRef.current;
        if (el && !el.paused && !el.ended) {
            idleTimerRef.current = setTimeout(() => setControlsVisible(false), CONTROLS_IDLE_MS);
        }
    }, [videoRef]);

    /**
     * The same, for a `pointermove` — and it ignores one that reports the position it reported
     * last time.
     *
     * <p><b>This is what makes the fade work at all.</b> A browser dispatches a move at unchanged
     * coordinates whenever the element under the cursor changes, and this player changes it twice
     * on every fade: the control row and the centre disc both go `pointer-events-none` as they
     * disappear. So hiding the controls handed us a `pointermove`, the move was read as the viewer
     * reaching for something, and they were shown again within the frame — for a cursor that had
     * been still for minutes. The bar simply never faded, in fullscreen or out of it.
     *
     * <p>Not throttling or a distance threshold: the question a fade-on-idle asks is whether the
     * pointer has MOVED, and an event carrying the previous point is the browser answering no.
     */
    const nudgeFromPointer = useCallback((e) => {
        if (!pointerMoved(lastPointRef.current, e.clientX, e.clientY)) return;
        lastPointRef.current = { x: e.clientX, y: e.clientY };
        nudge();
    }, [nudge]);

    /** A paused video keeps its controls, like every native bar: pausing is often the first half
     *  of reaching for one of them. */
    const pin = useCallback(() => {
        clearTimeout(idleTimerRef.current);
        setControlsVisible(true);
    }, []);

    // The pointer leaving the player is the one case that hides them at once rather than after the
    // delay: the viewer is demonstrably not reaching for a control.
    const hideNow = useCallback(() => {
        clearTimeout(idleTimerRef.current);
        // Forgotten on the way out, whether or not anything is hidden: a pointer that leaves and
        // comes back to the very same pixel — which is what a click on something outside the
        // player and a move back looks like — would otherwise have its first move dismissed as
        // "it has not moved", and the controls would stay away.
        lastPointRef.current = null;
        const el = videoRef.current;
        if (el && !el.paused && !el.ended) setControlsVisible(false);
    }, [videoRef]);

    useEffect(() => () => clearTimeout(idleTimerRef.current), []);

    return { controlsVisible, nudge, nudgeFromPointer, pin, hideNow };
}
