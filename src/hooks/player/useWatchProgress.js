import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/client';
import { flushOnUnload } from '@/lib/api/beacon';
import { isDuplicateReport, watchThreshold } from '@/lib/player/playback';

/**
 * Records how far into a video the viewer got.
 *
 * <p>Four report paths, and each exists because the others do not fire: a throttled `timeupdate`
 * while playing, pause/ended, an unmount flush for SPA navigation, and a `pagehide` flush for the
 * hard refresh/tab-close case. Shared by the native-element and YouTube-embed players, which is
 * why it takes a `positionOf` callback rather than an element — a YouTube iframe has no
 * `currentTime`, only `getCurrentTime()`.
 *
 * <p>They are not mutually exclusive, so the last playhead handed to the network is remembered and
 * a repeat of it is dropped (`isDuplicateReport`) — two of these paths fire in the same moment on
 * the way out of a page, and on a first watch both requests insert and one dies on the backend's
 * unique constraint.
 *
 * @param videoId    the row to write against
 * @param positionOf returns the playhead in seconds, or null when there is nothing to read
 * @returns report(seconds), duration setter/reader, and the pagehide binding
 */
export function useWatchProgress(videoId, positionOf) {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    // The video's length once the player knows it — feeds watchThreshold.
    const durationRef = useRef(NaN);
    // Mirrors token/videoId into a ref so the unmount effect always reports against the latest
    // values without re-subscribing (and re-flushing) on every render.
    const authRef = useRef({ token, videoId });
    authRef.current = { token, videoId };
    // Kept in a ref for the same reason: the mount-only effects below must not be torn down when
    // the caller's closure changes identity.
    const positionRef = useRef(positionOf);
    positionRef.current = positionOf;
    // The last report handed to the network, and — separately — the one still on the wire, which
    // only the axios path ever has. Both are read by the `pagehide` flush below.
    const sentRef = useRef(null);
    const inFlightRef = useRef(null);

    const report = useCallback((seconds, auth = authRef.current) => {
        const { token: authToken, videoId: authVideoId } = auth;
        if (!authToken || !authVideoId) return;
        const progressSeconds = Math.floor(seconds);
        if (progressSeconds < watchThreshold(durationRef.current)) return;

        const pending = { videoId: authVideoId, progressSeconds, at: Date.now() };
        if (isDuplicateReport(sentRef.current, pending)) return;
        sentRef.current = pending;

        // This write goes straight through axios, bypassing React Query, so nothing else marks the
        // cached ['watch-history'] query stale — and the app-wide QueryClient has refetchOnMount
        // disabled, so History/Home/Bookmarks would keep serving the pre-watch snapshot for up to
        // its 60s staleTime. Invalidating is what makes a partial watch show up without a full
        // page reload.
        const invalidate = () => queryClient.invalidateQueries({ queryKey: ['watch-history'] });

        // A hidden page is a page that may never get another turn: the tab is closing, or the
        // phone's browser is on its way to the background where it can be killed without notice.
        // A normal XHR issued there is cancelled mid-flight by an unload that follows, so this
        // takes the same keepalive path `pagehide` does — which is also what lets that listener
        // recognise this report as already sent instead of sending it a second time.
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            flushOnUnload(`/videos/${authVideoId}/watch`, { progressSeconds });
            invalidate();
            return;
        }

        inFlightRef.current = pending;
        api.post(`/videos/${authVideoId}/watch`, { progressSeconds })
            .then(invalidate)
            .catch(() => {
                // Best-effort: never let a failed watch-history write disrupt playback. Forgetting
                // it is what lets the same position be sent again rather than deduped against a
                // write that never landed.
                if (sentRef.current === pending) sentRef.current = null;
            })
            .finally(() => {
                if (inFlightRef.current === pending) inFlightRef.current = null;
            });
    }, [queryClient]);

    // Flush the last-seen position on unmount — navigating away mid-playback doesn't reliably fire
    // onPause first. Covers in-app (SPA) navigation only: a real unmount never happens on a hard
    // refresh or tab close, since the whole JS context is discarded first.
    //
    // Mount-only, and that is the whole mechanism: the cleanup IS the flush. Listing `report` as a
    // dependency would tear this down and re-run it on every render, writing a progress row each
    // time instead of once on the way out.
    useEffect(() => () => {
        const seconds = positionRef.current?.();
        if (seconds != null && seconds > 0) {
            report(seconds, authRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Covers the hard-refresh/tab-close/hard-navigation case above: `pagehide` fires there (unlike
    // unmount), but by then a normal axios/XHR call would be cancelled mid-flight by the browser,
    // so this uses a `keepalive` fetch instead — see lib/api/beacon.js.
    useEffect(() => {
        const handlePageHide = () => {
            const { videoId: id } = authRef.current;
            const seconds = positionRef.current?.() ?? 0;
            const progressSeconds = Math.floor(seconds);
            if (!id || progressSeconds < watchThreshold(durationRef.current)) return;

            const pending = { videoId: id, progressSeconds, at: Date.now() };
            // The usual case is that `visibilitychange` already beaconed this exact position a
            // moment ago, and sending it again is what puts two inserts in flight at once. An
            // axios request still on the wire is the exception and not a reason to stay quiet:
            // unload is about to cancel it, so this is the only copy that will arrive.
            if (!inFlightRef.current && isDuplicateReport(sentRef.current, pending)) return;
            sentRef.current = pending;
            flushOnUnload(`/videos/${id}/watch`, { progressSeconds });
        };
        window.addEventListener('pagehide', handlePageHide);
        return () => window.removeEventListener('pagehide', handlePageHide);
    }, []);

    return { report, durationRef };
}
