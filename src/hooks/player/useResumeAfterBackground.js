import { useEffect, useRef } from 'react';
import {
    RESUME_STALL_CHECK_MS,
    resumeAction,
    stillStalled,
} from '@/lib/player/resume';

/**
 * Puts a video back together after the phone took it away.
 *
 * <p><b>The bug this is for.</b> Playing a lecture on a phone, leaving the browser — a message, a
 * call, the screen locking — and coming back to a player that shows the right frame at the right
 * position and does nothing. Pressing play does nothing either. See `lib/player/resume.js` for the
 * three unrelated states that all look like that from the outside; the short version is that a
 * backgrounded page has its fetches aborted and may have its decoder taken away, and neither of
 * those tells the page anything when it comes back.
 *
 * <p><b>Why it is a listener and not a retry button.</b> There already is a retry button, for the
 * case where the player has given up and said so. This is the case where nothing has said
 * anything: no error is surfaced, no state is wrong to look at, and the only signal is that the
 * page was away and the playhead is not moving. A viewer has no reason to suspect the app rather
 * than the video, so the app has to notice on their behalf.
 *
 * <p><b>It never stops the video on the way out.</b> It used to: a playing video was paused the
 * moment the page was hidden, against Chrome on Android carrying a lecture on in somebody's pocket.
 * But listening to a lecture while doing something else — another tab, another app, the phone in
 * a pocket on the way to work — is how much of this catalogue is actually used, and pausing it
 * stopped exactly that (product owner, 2026-10-02). A viewer who wants it stopped has the media
 * notification and the pause button, the same as on every other player.
 *
 * <p><b>And nothing here ever presses play for anybody.</b> If the platform paused the video while
 * the page was away (iOS does), it stays paused until the viewer says otherwise: starting a
 * lecture by itself is a worse thing to get wrong than not starting it — in a mosque, a lecture
 * hall or a quiet room it is the one failure everybody in earshot notices. `wasPlaying` is still
 * recorded, because the REPAIR below needs to know whether there was anything to repair; it is
 * not a licence to start playing.
 *
 * @param videoRef   the element to watch
 * @param enabled    off unless there is an element (the YouTube and link branches have none)
 * @param onRecover  called with `{position, resume}` when the element needs more than a play() —
 *                   the player knows which of its paths owns the source and how to rebuild it
 */
export function useResumeAfterBackground({ videoRef, enabled = true, onRecover }) {
    const wasPlayingRef = useRef(false);
    const positionRef = useRef(0);
    const checkTimerRef = useRef(null);
    // Held in a ref so a new callback identity on every render does not tear the listeners down
    // and rebuild them — which would also lose whatever the last `pagehide` recorded.
    const recoverRef = useRef(onRecover);
    recoverRef.current = onRecover;

    useEffect(() => {
        if (!enabled || typeof document === 'undefined') return undefined;

        const remember = () => {
            const el = videoRef.current;
            if (!el) return;
            wasPlayingRef.current = !el.paused && !el.ended;
            positionRef.current = el.currentTime;
        };

        const recover = () => {
            const el = videoRef.current;
            recoverRef.current?.({
                // The element's own position if it still has one: it may have advanced a little
                // before it stalled, and sending the viewer back to where they were when the
                // screen locked would re-play seconds they already heard.
                position: Number.isFinite(el?.currentTime) && el.currentTime > 0
                    ? el.currentTime
                    : positionRef.current,
                // Never true for a video that came back paused. A repair puts the source and the
                // position back; whether to play is the viewer's.
                resume: wasPlayingRef.current && !el?.paused,
            });
        };

        const returned = () => {
            const el = videoRef.current;
            if (!el) return;
            clearTimeout(checkTimerRef.current);

            const action = resumeAction({
                error: el.error,
                readyState: el.readyState,
                paused: el.paused,
                ended: el.ended,
                wasPlaying: wasPlayingRef.current,
            });
            if (action === 'reload') {
                recover();
                return;
            }
            // `'play'` is deliberately not acted on. It is the honest reading of the element's
            // state — it was playing, it is paused, so continuing is what would put it back — but
            // the platform paused it while the viewer was away, and a lecture that starts by
            // itself on their return is the worse mistake. They start it again, or they do not.
            if (!wasPlayingRef.current) return;

            // The quiet case, and the one that needs a second look rather than a single read:
            // an element that is not paused, holds no error, and is not moving because whatever
            // was feeding it stopped while the page was hidden. A `readyState` sampled in the same
            // task as the visibility change says almost nothing, so the answer is whether the
            // playhead has gone anywhere a second later.
            const before = el.currentTime;
            checkTimerRef.current = setTimeout(() => {
                const current = videoRef.current;
                if (!current) return;
                if (current.error) {
                    recover();
                    return;
                }
                if (stillStalled({
                    before,
                    after: current.currentTime,
                    paused: current.paused,
                    ended: current.ended,
                    readyState: current.readyState,
                })) {
                    recover();
                }
            }, RESUME_STALL_CHECK_MS);
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') remember();
            else returned();
        };
        // `pagehide` as well as the visibility change, and both directions of it. On iOS a
        // backgrounded page is often put in the back/forward cache rather than merely hidden: it
        // leaves through `pagehide` and comes back through `pageshow` with `persisted` set, and
        // in that round trip the media element is restored in whatever state the platform felt
        // like restoring it in.
        const onPageShow = (e) => {
            if (e.persisted) returned();
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('pagehide', remember);
        window.addEventListener('pageshow', onPageShow);
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('pagehide', remember);
            window.removeEventListener('pageshow', onPageShow);
            clearTimeout(checkTimerRef.current);
        };
    }, [enabled, videoRef]);
}
