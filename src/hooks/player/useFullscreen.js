import { useCallback, useEffect, useState } from 'react';
import { exitFullscreenNow, fullscreenElementNow, requestFullscreenOn }
    from '@/lib/player/fullscreen';

/**
 * Fullscreen on the wrapper rather than on the `<video>`.
 *
 * <p><b>This is the fix for "I can't change the quality in fullscreen".</b> A browser renders only
 * the fullscreen element's own subtree, so anything outside the `<video>` — the settings menu —
 * does not exist while the `<video>` itself is the fullscreen element. So the wrapper goes
 * fullscreen and the control bar inside it comes along.
 *
 * <p><b>Which is only possible because the bar is ours.</b> While the browser owned it, its
 * fullscreen button targeted the `<video>` and there was nothing to be done about it: it cannot be
 * intercepted (closed shadow root), re-pointing the request needs a second request the browser may
 * refuse, and Safari's button does not use that API at all — it puts the element into its own
 * presentation mode, where no `fullscreenchange` fires. The listener here only *reports* what
 * happened, since the browser also leaves fullscreen on its own (Escape, the tab backgrounding).
 */
export function useFullscreen(containerRef, videoRef) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const sync = () => {
            const container = containerRef.current;
            setIsFullscreen(Boolean(container) && fullscreenElementNow() === container);
        };
        document.addEventListener('fullscreenchange', sync);
        document.addEventListener('webkitfullscreenchange', sync);
        return () => {
            document.removeEventListener('fullscreenchange', sync);
            document.removeEventListener('webkitfullscreenchange', sync);
        };
    }, [containerRef]);

    const toggleFullscreen = useCallback(() => {
        if (fullscreenElementNow()) {
            exitFullscreenNow();
            return;
        }
        if (requestFullscreenOn(containerRef.current)) return;
        // iOS Safari gives a plain element no fullscreen at all: the `<video>`'s own presentation
        // mode is the only one there, and it draws the system player — with the system's controls
        // — over everything. The one platform where the settings menu cannot follow the viewer
        // into fullscreen, and still far better than a fullscreen button that does nothing.
        videoRef.current?.webkitEnterFullscreen?.();
    }, [containerRef, videoRef]);

    return { isFullscreen, toggleFullscreen };
}
