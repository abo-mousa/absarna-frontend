import { useEffect, useId, useRef } from 'react';
import { PROGRESS_REPORT_INTERVAL_MS } from '@/lib/player/playback';

// Lazily injects the YouTube IFrame Player API script (once per page) so embedded YouTube videos
// can report watch progress the same way native <video> elements do via onTimeUpdate — a plain
// <iframe src="...embed/..."> has no such event.
let youtubeApiPromise = null;
function loadYouTubeIframeApi() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (youtubeApiPromise) return youtubeApiPromise;
    youtubeApiPromise = new Promise((resolve) => {
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            previous?.();
            resolve(window.YT);
        };
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
    });
    return youtubeApiPromise;
}

/**
 * Drives an embedded YouTube video, so most of the catalogue gets the watch-history tracking a
 * native `<video>` gets for free from `onTimeUpdate`.
 *
 * <p>No-ops entirely when the source is not YouTube — hooks run unconditionally, so the branch
 * lives inside rather than around it.
 *
 * <p>The player instance is written into the caller's `playerRef` rather than kept here, because
 * the same ref is what {@link useWatchProgress} reads the playhead from and what the component's
 * imperative handle seeks with.
 *
 * @returns the DOM id the embed must be mounted on
 */
export function useYouTubeEmbed({ enabled, youtubeVideoId, startTime, playerRef, report,
                                  durationRef }) {
    const intervalRef = useRef(null);
    const containerId = `yt-player-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

    // `report` and `durationRef` are read through a ref so a re-created reporter cannot tear the
    // embed down and rebuild it mid-lecture.
    const reportRef = useRef(report);
    reportRef.current = report;

    useEffect(() => {
        if (!enabled || !youtubeVideoId) return undefined;
        let destroyed = false;

        loadYouTubeIframeApi().then((YT) => {
            if (destroyed) return;
            playerRef.current = new YT.Player(containerId, {
                videoId: youtubeVideoId,
                host: 'https://www.youtube-nocookie.com',
                playerVars: startTime > 0 ? { rel: 0, start: Math.floor(startTime) } : { rel: 0 },
                events: {
                    onStateChange: (e) => {
                        // Only known once the embed has actually loaded the video, so it is read
                        // here rather than at construction time.
                        durationRef.current = playerRef.current?.getDuration?.() ?? NaN;
                        clearInterval(intervalRef.current);
                        if (e.data === YT.PlayerState.PLAYING) {
                            intervalRef.current = setInterval(() => {
                                reportRef.current(playerRef.current.getCurrentTime());
                            }, PROGRESS_REPORT_INTERVAL_MS);
                        } else if (e.data === YT.PlayerState.PAUSED
                                || e.data === YT.PlayerState.ENDED) {
                            reportRef.current(playerRef.current.getCurrentTime());
                        }
                    },
                },
            });
        });

        return () => {
            destroyed = true;
            clearInterval(intervalRef.current);
            // No final report here: useWatchProgress's own unmount flush reads the playhead
            // through this same ref, and its effect is declared first, so it runs while the
            // player is still alive.
            playerRef.current?.destroy?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, youtubeVideoId]);

    return containerId;
}
