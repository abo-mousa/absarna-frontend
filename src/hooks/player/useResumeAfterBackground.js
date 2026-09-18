import { useEffect, useRef } from 'react';
import {
    RESUME_STALL_CHECK_MS,
    resumeAction,
    shouldPauseWhenHidden,
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
 * <p><b>It also stops the video on the way out, and that half is not a detail.</b> Leaving the
 * browser does not reliably stop a video — Chrome on Android keeps the audio going with a media
 * notification, which is deliberate and is the right default for a music site — so a lecture
 * opened and left behind carried on talking into somebody's pocket, on their data. See
 * `shouldPauseWhenHidden` for the two cases where playing on IS what the viewer asked for.
 *
 * <p><b>And nothing here ever presses play for anybody.</b> A video this hook paused stays paused
 * until the viewer says otherwise: resuming on return would undo the stop they just watched
 * happen, and starting a lecture by itself is a worse thing to get wrong than not starting it — in
 * a mosque, a lecture hall or a quiet room it is the one failure everybody in earshot notices.
 * `wasPlaying` is still recorded, because the REPAIR below needs to know whether there was
 * anything to repair; it is not a licence to start playing.
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
            const playing = !el.paused && !el.ended;
            wasPlayingRef.current = playing;
            positionRef.current = el.currentTime;

            if (shouldPauseWhenHidden({
                playing,
                pictureInPicture: typeof document !== 'undefined'
                    && document.pictureInPictureElement === el,
                // Safari's own property, and the only page-visible sign that the sound is coming
                // out of a television rather than the phone. Absent everywhere else, which reads
                // as false and is correct there.
                castingToRemote: Boolean(el.webkitCurrentPlaybackTargetIsWireless),
            })) {
                el.pause();
            }
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
                // Never true for a video this hook paused. A repair puts the source and the
                // position back; whether to play is the viewer's, and they have just been shown a
                // stopped video.
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
            // this hook is why it is paused, and pressing play here would hand the viewer back a
            // lecture they watched stop when they left. They start it again, or they do not.
            if (!wasPlayingRef.current) return;

            // The quiet case, and the one that needs a second look rather than a single read:
            // an element that is not paused, holds no error, and is not moving because whatever
            // was feeding it stopped while the page was hidden. A `readyState` sampled in the same
            // task as the visibility change says almost nothing, so the answer is whether the
            // playhead has gone anywhere a second later. It survives the pause above because
            // picture-in-picture and casting are exempt from it — they are exactly the two
            // sessions still running while nobody is looking, and the two with nobody watching to
            // notice that they stalled.
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
