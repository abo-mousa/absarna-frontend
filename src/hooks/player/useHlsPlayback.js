import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * How many times one viewing session will re-fetch its playback URL after a fatal network error.
 *
 * A segment that 403s is very often a credential that has expired rather than a broken file, and
 * under HLS that surfaces within six seconds rather than on the next seek — the player pulls a
 * segment continuously, so an expired URL is an immediate hard stop. Re-minting is the correct
 * response and the backend hands out a fresh URL for as long as the viewer may still watch.
 *
 * Bounded because the failure it cannot fix looks identical: if the viewer's access was revoked,
 * every refresh returns a 404 and retrying forever would hammer the API on behalf of someone no
 * longer permitted to watch. Three rides out an expiry and a blip without becoming a loop.
 */
const MAX_URL_REFRESHES = 3;

/**
 * How long to wait before retrying the segment fetch that just failed, times the attempt number.
 *
 * The retry and the fix are racing each other. Re-minting the playback URL is a round trip and a
 * re-render; retrying the *same* expired URL fails again in well under a second. Without a pause
 * all three attempts were spent in about two seconds against the dead URL, and the player was
 * destroyed at almost exactly the moment its replacement arrived — the recovery path defeating
 * itself.
 */
const URL_REFRESH_BACKOFF_MS = 1000;

/**
 * Plays HLS through hls.js, where the browser cannot play it itself.
 *
 * <p><b>The library is imported dynamically, and that is not micro-optimisation.</b> It builds to
 * ~595 KB (~186 KB gzipped) — larger than every other chunk in this app, React and pdfjs included
 * — and every page that is not a video detail page has no use for it, including all of Safari,
 * which never reaches this branch at all. A static import would put it in the main bundle for
 * everyone.
 *
 * @param pendingSeekRef the shared "where to resume" ref; a value in it means this instance is a
 *                       continuation of a playlist swap rather than a fresh load
 * @returns the parsed variant list, the selected level and its setter, and the two entry points
 *          the element's own events drive — `startLoadAt` and `seekBeforeLoad`
 */
export function useHlsPlayback({ enabled, playbackUrl, videoId, videoRef, pendingSeekRef,
                                 rememberPosition }) {
    const queryClient = useQueryClient();
    const hlsRef = useRef(null);
    const urlRefreshesRef = useRef(0);
    // Whether this instance has been told to start fetching. See startLoadAt for why it must
    // happen exactly once per instance rather than on every play.
    const loadStartedRef = useRef(false);

    // The variants hls.js found in master.m3u8, once it has parsed it. Null until then, and null
    // forever on every other path.
    const [levels, setLevels] = useState(null);
    // -1 is hls.js's "decide for me", which is the entire point of ABR and therefore the default.
    const [selectedLevel, setSelectedLevel] = useState(-1);

    const selectedLevelRef = useRef(selectedLevel);
    selectedLevelRef.current = selectedLevel;
    const rememberRef = useRef(rememberPosition);
    rememberRef.current = rememberPosition;

    useEffect(() => {
        if (!enabled || !playbackUrl) return undefined;
        const el = videoRef.current;
        if (!el) return undefined;

        let cancelled = false;
        let hls = null;
        let retryTimer = null;
        loadStartedRef.current = false;
        // The manifest describes this URL, so a list left over from the previous one would be
        // offered in the selector until the new manifest parses — and switching to the audio rung
        // means a playlist with no video variants at all, whose stale levels would be actively
        // wrong rather than merely early.
        setLevels(null);

        import('hls.js').then(({ default: Hls }) => {
            if (cancelled) return;
            if (!Hls.isSupported()) {
                // No MSE at all. Rare and old, and there is nothing to fall back to — an .m3u8 in
                // a <video> tag here plays nothing, so the element's own "unsupported" text is the
                // honest outcome.
                return;
            }
            hls = new Hls({
                // The playhead is restored by the element's loadedmetadata handler, which fires
                // for this path too — leaving hls.js to guess a start position as well would have
                // the two fight over the first second of playback.
                startPosition: -1,
                // NOT the default (true), and the single most expensive default in the library for
                // this audience. hls.js starts buffering the moment a source is attached, ignoring
                // preload="metadata" entirely — so opening a lecture page and reading the
                // description would pull up to 30s or 60 MB of video before anyone pressed play.
                // The catalogue is hour-long lectures watched on metered mobile data, so this is
                // real money on someone else's bill. Loading starts on the first play instead.
                autoStartLoad: false,
                // Also not the default. Without it ABR will happily choose the 1080p rung for a
                // 640px-wide player, which is bandwidth spent on pixels the element cannot show.
                capLevelToPlayerSize: true,
                // How far AHEAD to fetch, and this pair is one setting, not two.
                //
                // `maxBufferLength` is a floor, not a ceiling — the name reads like a cap and is
                // not one. hls.js treats 30s as the target it must reach, then keeps doubling
                // towards `maxMaxBufferLength` (default 600s) for as long as `maxBufferSize`
                // (default 60 MB) allows, so pressing play pulled tens of megabytes of a lecture
                // nobody had decided to finish: 60 MB is six minutes of the 480p rung. That is the
                // same bill `autoStartLoad: false` protects, spent one click later.
                //
                // 90s ahead and 20 MB is still several segments of headroom, which is what rides
                // out a lift or a dropped signal; beyond that the buffer is only insurance against
                // a network problem the viewer may never have, bought with their data.
                maxMaxBufferLength: 90,
                maxBufferSize: 20 * 1000 * 1000,
                // How far BEHIND to keep, where the default is Infinity: every second watched
                // stays in memory, so an hour-long lecture ends as a gigabyte of decoded video
                // held by a tab. A minute covers the small scrub-back a viewer actually does; a
                // longer jump re-fetches, which is what a jump does anyway.
                backBufferLength: 60,
            });
            hlsRef.current = hls;

            hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
                if (cancelled) return;
                // Named from the manifest rather than from the API's `qualities`: this list is
                // what the player can actually switch between, and building the selector from
                // anything else risks offering a rung that is not in this playlist.
                //
                // Ordered largest-first to match master.m3u8 and the API's own `qualities`.
                // hls.js sorts data.levels ascending by bitrate, so taking them as they come would
                // put 480p at the top of a selector that reads 1080p-first everywhere else.
                setLevels(data.levels
                    .map((level, index) => ({
                        index,
                        height: level.height ?? 0,
                        label: level.height
                            ? `${level.height}p`
                            : `${Math.round(level.bitrate / 1000)}k`,
                    }))
                    .sort((a, b) => b.height - a.height));
                hls.currentLevel = selectedLevelRef.current;

                // A pending seek means this instance is a CONTINUATION — the viewer swapped to the
                // audio rung, or back off it, mid-lecture — so there is no play event coming to
                // start the fetching that `autoStartLoad: false` deferred. Without this the switch
                // deadlocks: loadedmetadata is what resumes playback, and it cannot fire until an
                // init segment is buffered, which cannot happen until something loads.
                if (pendingSeekRef.current != null) {
                    loadStartedRef.current = true;
                    hls.startLoad(pendingSeekRef.current);
                }
            });

            // A segment that loads is proof the URL is good, so the refresh budget starts again
            // from zero. Without this, three unrelated blips an hour apart would leave a session
            // permanently unable to recover from an expiry.
            hls.on(Hls.Events.FRAG_BUFFERED, () => {
                urlRefreshesRef.current = 0;
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (!data.fatal || cancelled) return;

                // An expired URL and a dead network are the same event here, so both are met the
                // same way: re-mint, and let hls.js resume once something has changed.
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    if (urlRefreshesRef.current < MAX_URL_REFRESHES) {
                        urlRefreshesRef.current += 1;
                        rememberRef.current?.();
                        queryClient.invalidateQueries({
                            queryKey: ['videoPlaybackUrl', videoId],
                        });
                        // Deliberately NOT an immediate startLoad(); see URL_REFRESH_BACKOFF_MS.
                        // If the refetch returns a different URL this instance is torn down and
                        // rebuilt by the effect (and this timer cleared unfired), so the backoff
                        // only has to cover the case where it comes back unchanged.
                        clearTimeout(retryTimer);
                        retryTimer = setTimeout(() => {
                            if (!cancelled) hls.startLoad();
                        }, URL_REFRESH_BACKOFF_MS * urlRefreshesRef.current);
                        return;
                    }
                    hls.destroy();
                    return;
                }
                if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    // A decode stall, not a delivery problem — refetching the URL would not help.
                    hls.recoverMediaError();
                    return;
                }
                hls.destroy();
            });

            hls.loadSource(playbackUrl);
            hls.attachMedia(el);
        });

        return () => {
            cancelled = true;
            clearTimeout(retryTimer);
            // Destroy, not detach: hls.js holds a MediaSource, a fetch loop and (for fMP4) a
            // demuxer worker. Leaving one running per quality switch would keep pulling segments
            // for a video nobody is watching.
            hls?.destroy();
            if (hlsRef.current === hls) hlsRef.current = null;
        };
        // selectedLevel is deliberately absent — it is read through a ref above: changing it must
        // not tear the player down and rebuild it, which is the whole reason level switching is
        // free. `selectLevel` applies it to the live instance instead.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, playbackUrl, videoId, queryClient]);

    /**
     * Switching between the video variants of one master playlist.
     *
     * <p>This is the case HLS makes cheap: the manifest is already loaded and every rung was cut
     * at the same instants, so hls.js swaps at the next segment boundary. Nothing reloads, the
     * playhead does not move, and none of the seek-restore machinery runs. `-1` hands the choice
     * back to the ABR algorithm.
     */
    const selectLevel = useCallback((level) => {
        setSelectedLevel(level);
        if (hlsRef.current) hlsRef.current.currentLevel = level;
    }, []);

    /**
     * Starts fetching, on the viewer's first play rather than on page load.
     *
     * <p>The other half of `autoStartLoad: false`. The start position is passed rather than left
     * to default to zero, so a deep link to a timestamp buffers from there instead of buffering
     * the opening, seeking, and discarding it.
     *
     * <p><b>Once per player, and the guard is not tidiness.</b> `startLoad(n)` assigns hls.js's
     * next load position outright, so calling it again on a later play — after the viewer had
     * scrubbed forward and paused — would drag them back to the deep-link timestamp.
     */
    const startLoadAt = useCallback((seconds) => {
        if (!enabled || loadStartedRef.current || !hlsRef.current) return;
        loadStartedRef.current = true;
        hlsRef.current.startLoad(seconds > 0 ? seconds : -1);
    }, [enabled]);

    /**
     * Moves where loading will START, for a scrub that happens before the first play.
     *
     * <p>Re-issued on a second scrub rather than guarded by the once-per-player flag: startLoad
     * moves the position loading starts from, so the last drag before playback begins is the one
     * that decides where the first bytes come from. The flag is still set, so the viewer's
     * eventual press of play does not restart the load at `startTime` and drag them back.
     */
    const seekBeforeLoad = useCallback((seconds) => {
        const hls = hlsRef.current;
        if (!enabled || !hls) return;
        loadStartedRef.current = true;
        hls.startLoad(seconds);
    }, [enabled]);

    return { levels, selectedLevel, selectLevel, startLoadAt, seekBeforeLoad };
}
