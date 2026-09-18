import { useCallback, useEffect, useRef, useState } from 'react';
import { nextTapRun, tapSeekSeconds, tapZone } from '@/lib/player/gestures';

/**
 * How long the «10 ثوانٍ» flash stays after the last tap of a run.
 *
 * <p>Long enough to read the number, and deliberately longer than the window in which another tap
 * would join the run — so a viewer tapping three times sees one flash counting up (10, 20, 30)
 * rather than three flashes, and the flash is still there when they decide whether to tap again.
 */
const FEEDBACK_MS = 700;

/**
 * How long after a touch tap on a seek zone a `click` is still that tap's.
 *
 * <p>Generous, because it is only ever consulted on a device that has just produced a touch: a
 * mouse click 400ms after a finger tapped the same player is not a thing that happens.
 */
const TOUCH_GESTURE_MS = 400;

/**
 * Double-tap the sides of the picture to jump back or forward.
 *
 * <p><b>The gesture takes the side zones away from tap-to-pause, and that is the design.</b> The
 * alternative is to hold every single tap for the length of the double-tap window before acting on
 * it, so the first tap can be taken back — which puts a visible delay on pausing, the most common
 * thing anyone does to a video. Instead the picture is divided: the middle pauses (and shows the
 * disc that says so), the sides seek, and nothing has to be undone because nothing was done early.
 *
 * <p>Touch only. Under a mouse the timeline is a precise instrument and a double-click already
 * means fullscreen — a gesture defined by how hard the target is to hit should not exist where the
 * target is easy to hit. Both the click and the double-click the browser synthesises after a touch
 * tap are therefore suppressed for the window after one, or a double-tap to seek would also toggle
 * playback and then throw the player into fullscreen.
 *
 * @param videoRef the element the taps are measured against — its box is the zone map, and its
 *                 `duration` is what a seek is clamped to
 * @param enabled  off wherever there is no element to seek (the YouTube and link branches)
 * @returns the `pointerup` handler for the picture, a predicate the click handlers consult, and
 *          the flash to render
 */
export function useDoubleTapSeek({ videoRef, enabled = true }) {
    const runRef = useRef(null);
    const touchUntilRef = useRef(0);
    const feedbackTimerRef = useRef(null);
    const [feedback, setFeedback] = useState(null);

    const handlePointerUp = useCallback((e) => {
        // `pointerType` rather than a media query: a tablet with a mouse plugged in gets the mouse
        // behaviour for the mouse and the touch behaviour for the finger, which is the honest
        // answer for a device that genuinely has both.
        if (!enabled || e.pointerType !== 'touch') return;
        const el = videoRef.current;
        const zone = tapZone(e.clientX, el?.getBoundingClientRect());
        if (zone === 'centre') {
            // A tap in the middle ends any run rather than being counted into it: the viewer moved
            // the gesture somewhere else, and the next tap on a side is a first tap again.
            runRef.current = null;
            return;
        }

        // Claimed whether or not this tap seeks — the first tap of every run has to be harmless
        // for the second one to be able to mean something. See the note above.
        touchUntilRef.current = Date.now() + TOUCH_GESTURE_MS;

        const run = nextTapRun(runRef.current, zone, Date.now());
        runRef.current = run;
        const delta = tapSeekSeconds(run);
        if (!delta || !el) return;

        // Before the first play on the hls.js path the element has no timeline at all, and an
        // assignment to `currentTime` there is discarded. Nothing is offered for that case: a
        // gesture with no visible control cannot also explain itself, and a flash claiming to have
        // moved a playhead that did not move is worse than no flash.
        if (!Number.isFinite(el.duration) || el.duration <= 0) return;
        el.currentTime = Math.min(el.duration, Math.max(0, el.currentTime + delta));

        setFeedback({ zone: run.zone, seconds: Math.abs(delta) });
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    }, [enabled, videoRef]);

    /**
     * Whether the click now arriving belongs to a touch gesture this hook has already answered.
     *
     * <p>Read rather than consumed, because one tap produces both a `click` and — on the second
     * tap — a `dblclick`, and each of those has its own handler on the picture that must stand
     * down.
     */
    const isTouchGesture = useCallback(() => Date.now() < touchUntilRef.current, []);

    useEffect(() => () => clearTimeout(feedbackTimerRef.current), []);

    return { handlePointerUp, isTouchGesture, feedback };
}
