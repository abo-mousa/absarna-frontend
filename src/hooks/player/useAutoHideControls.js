import { useCallback, useEffect, useRef, useState } from 'react';

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

    const nudge = useCallback(() => {
        setControlsVisible(true);
        clearTimeout(idleTimerRef.current);
        const el = videoRef.current;
        if (el && !el.paused && !el.ended) {
            idleTimerRef.current = setTimeout(() => setControlsVisible(false), CONTROLS_IDLE_MS);
        }
    }, [videoRef]);

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
        const el = videoRef.current;
        if (el && !el.paused && !el.ended) setControlsVisible(false);
    }, [videoRef]);

    useEffect(() => () => clearTimeout(idleTimerRef.current), []);

    return { controlsVisible, nudge, pin, hideNow };
}
