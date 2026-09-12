import { useCallback, useEffect, useState } from 'react';

/**
 * Picture-in-picture: watch on while browsing the rest of the catalogue.
 *
 * <p>Only offered where the browser has a page-facing API — Firefox implements PiP as its own
 * browser affordance with none, and iOS has a different one again, so an unconditional control
 * would be dead for a good share of viewers.
 *
 * <h3>Why the browser's own button has to be suppressed, and lifted per call</h3>
 * <p><b>Turning `controls` off did not remove it.</b> Chromium draws a picture-in-picture button
 * over the top corner of a hovered `<video>` that is separate from the control bar and survives
 * having no controls at all — so an uploaded video showed two of them, ours in the corner and the
 * browser's floating over the picture, a few pixels apart. It is not reachable from CSS either: it
 * lives in the element's closed user-agent shadow root.
 *
 * <p>`disablePictureInPicture` is the one opt-out, and it is deliberately all-or-nothing: it hides
 * every UA affordance for this element AND makes `requestPictureInPicture()` reject with
 * `InvalidStateError`. So it cannot simply be set — that would take our button down with the
 * browser's. It is held on and lifted for the single call instead.
 *
 * <p><b>Conditional on support, and that is the whole point.</b> The browser's affordance is only
 * worth removing where ours replaces it. Firefox honours the attribute all the same, so setting it
 * unconditionally would not deduplicate anything for a Firefox viewer — it would delete
 * picture-in-picture for them.
 *
 * @returns whether PiP exists here, whether it is active, the toggle, and the callback ref that
 *          installs the suppression as React attaches the element
 */
export function usePictureInPicture(videoRef, ready) {
    const supported = typeof document !== 'undefined'
        && document.pictureInPictureEnabled === true;
    const [pipActive, setPipActive] = useState(false);

    // Stable identity so React doesn't detach/reattach the element on every render.
    //
    // The null write is deliberately ignored: React nulls a `ref={...}` out during the same unmount
    // pass that runs the progress flush, so the element would already be gone by the time the final
    // report tries to read its position. `currentTime` is still readable off the detached node, so
    // holding onto it is what makes that last write possible.
    const attachVideo = useCallback((el) => {
        if (!el) return;
        videoRef.current = el;
        // Set in the callback ref rather than as JSX or in an effect: this runs synchronously as
        // React attaches the element, so the browser's own button never gets a frame to appear in
        // — and React never re-applies a prop that would fight the lift in `togglePip`.
        if (supported) el.disablePictureInPicture = true;
    }, [supported, videoRef]);

    const togglePip = useCallback(async () => {
        const el = videoRef.current;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (el) {
                // Lifted for exactly this call, and in the same task as the request, so there is no
                // frame in between for the browser's own button to be painted in.
                if (supported) el.disablePictureInPicture = false;
                await el.requestPictureInPicture?.();
            }
        } catch {
            // Refused rather than broken — the audio rung has no video track to put in a window,
            // and the request needs user activation the click may have spent.
        }
        // Put the suppression back only when the request did NOT land. If it did, restoring it here
        // would close the window we just opened: setting `disablePictureInPicture` on an element
        // already in picture-in-picture is specified to exit it. The `leavepictureinpicture`
        // handler below restores it in that case.
        if (supported && el && document.pictureInPictureElement !== el) {
            el.disablePictureInPicture = true;
        }
        setPipActive(Boolean(document.pictureInPictureElement));
    }, [supported, videoRef]);

    // The PiP window has its own close button, and a viewer who uses it never touches our toggle.
    // `ready` is in the deps and the guard because the <video> does not exist on the renders before
    // the signed URL arrives, so binding once on mount would bind to nothing.
    useEffect(() => {
        const el = videoRef.current;
        if (!el || !ready) return undefined;
        const sync = () => {
            const inPip = document.pictureInPictureElement === el;
            // The other half of the lift in `togglePip`, and the reason it is done on the event
            // rather than after the await: the viewer can close the window from the window's own
            // button, which never passes through our toggle. Restored only on the way OUT, since
            // setting it on an element still in picture-in-picture would evict it.
            if (supported && !inPip) el.disablePictureInPicture = true;
            setPipActive(inPip);
        };
        el.addEventListener('enterpictureinpicture', sync);
        el.addEventListener('leavepictureinpicture', sync);
        return () => {
            el.removeEventListener('enterpictureinpicture', sync);
            el.removeEventListener('leavepictureinpicture', sync);
        };
    }, [ready, supported, videoRef]);

    return { pipSupported: supported, pipActive, togglePip, attachVideo };
}
