import { useEffect, useRef, useId, forwardRef, useImperativeHandle } from 'react';
import { resolveMediaUrl, safeExternalUrl, extractYouTubeId } from '@/lib/media';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaToken } from '@/hooks/useMediaToken';
import api from '@/lib/api/client';
import { flushOnUnload } from '@/lib/api/beacon';

// How often onTimeUpdate (fires several times a second) is allowed to actually hit the
// backend — watch history is a convenience feature, not an analytics stream, so this stays
// coarse on purpose. Safe to keep coarse because `pagehide` below now catches the exact-exit
// moment separately — this interval only bounds how much is lost if the tab disappears
// *without* a clean exit (crash, force-kill), not the common refresh/navigate-away case.
const PROGRESS_REPORT_INTERVAL_MS = 60000;

// Below this, a play doesn't count as a "watch" for history purposes — otherwise clicking a
// thumbnail by accident and backing out immediately would still create/bump a watch-history
// row, pushing an actually-watched video out of the per-user cap.
const MIN_WATCH_SECONDS = 5;

// Lazily injects the YouTube IFrame Player API script (once per page) so embedded YouTube
// videos can report watch progress the same way native <video> elements do via onTimeUpdate —
// a plain <iframe src="...embed/..."> has no such event.
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

// `ref` exposes getCurrentTime() so a parent (VideoDetail's share sheet, for "copy link at
// this timestamp") can read the playhead on demand without this component re-rendering on
// every tick — the alternative (lifting currentTime into state) would fire a render several
// times a second for something only ever read once, at share-click time.
const VideoPlayer = forwardRef(function VideoPlayer({ contentId, sourceType, sourceUrl, title, visible, startTime = 0 }, ref) {
    // Session token: still the right thing for the watch-progress writes below (they go through
    // axios, which sends it as an Authorization header). It is NOT what goes in the media URL —
    // see useMediaToken.
    const { token } = useAuth();

    // Only a locally-hosted file that's currently hidden needs a token to fetch at all; a public
    // video, and anything hosted elsewhere, never does.
    const needsMediaToken = visible === false && (sourceType === 'LOCAL' || sourceType === 'STREAM');
    const { mediaToken, isLoading: mediaTokenLoading } = useMediaToken(needsMediaToken);
    const videoRef = useRef(null);
    const lastReportedAtRef = useRef(0);
    // Mirrors token/contentId into refs so the unmount effect below always reports against
    // the latest values without re-subscribing (and re-flushing) on every render.
    const authRef = useRef({ token, contentId });
    authRef.current = { token, contentId };

    const reportProgress = (seconds, { token: authToken, contentId: authContentId } = authRef.current) => {
        if (!authToken || !authContentId) return;
        const progressSeconds = Math.floor(seconds);
        if (progressSeconds < MIN_WATCH_SECONDS) return;
        api.post(`/contents/${authContentId}/watch`, { progressSeconds }).catch(() => {
            // Best-effort: never let a failed watch-history write disrupt playback.
        });
    };

    const handleTimeUpdate = (e) => {
        const now = Date.now();
        if (now - lastReportedAtRef.current < PROGRESS_REPORT_INTERVAL_MS) return;
        lastReportedAtRef.current = now;
        reportProgress(e.currentTarget.currentTime);
    };

    const handlePauseOrEnded = (e) => {
        lastReportedAtRef.current = Date.now();
        reportProgress(e.currentTarget.currentTime);
    };

    // Flush the last-seen position on unmount — navigating away mid-playback doesn't
    // reliably fire onPause first. Covers in-app (SPA) navigation only: a real unmount never
    // happens on a hard refresh/tab-close, since the whole JS context is discarded first.
    useEffect(() => {
        return () => {
            const el = videoRef.current;
            if (el && el.currentTime > 0) {
                reportProgress(el.currentTime, authRef.current);
            }
        };
    }, []);

    // Covers the hard-refresh/tab-close/hard-navigation case above: `pagehide` fires in those
    // cases (unlike unmount), but by then a normal axios/XHR call would get cancelled mid-flight
    // by the browser, so this uses a `keepalive` fetch instead — see lib/api/beacon.js.
    useEffect(() => {
        const handlePageHide = () => {
            const el = videoRef.current;
            const { contentId } = authRef.current;
            const progressSeconds = el ? Math.floor(el.currentTime) : 0;
            if (progressSeconds < MIN_WATCH_SECONDS || !contentId) return;
            flushOnUnload(`/contents/${contentId}/watch`, { progressSeconds });
        };
        window.addEventListener('pagehide', handlePageHide);
        return () => window.removeEventListener('pagehide', handlePageHide);
    }, []);

    // --- YouTube-specific: IFrame Player API wiring, so embedded YouTube videos (most of the
    // catalogue) get the same watch-history tracking native <video> elements get for free via
    // onTimeUpdate. Hooks run unconditionally regardless of sourceType; each effect no-ops when
    // the source isn't YOUTUBE.
    const youtubePlayerRef = useRef(null);
    const youtubeIntervalRef = useRef(null);
    const youtubeContainerId = `yt-player-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    const isYouTube = sourceType === 'YOUTUBE';
    const youtubeVideoId = isYouTube ? extractYouTubeId(sourceUrl) : '';

    useImperativeHandle(ref, () => ({
        getCurrentTime: () => {
            if (isYouTube) return youtubePlayerRef.current?.getCurrentTime?.() || 0;
            return videoRef.current?.currentTime || 0;
        },
    }), [isYouTube]);

    useEffect(() => {
        if (!isYouTube || !youtubeVideoId) return;
        let destroyed = false;

        loadYouTubeIframeApi().then((YT) => {
            if (destroyed) return;
            youtubePlayerRef.current = new YT.Player(youtubeContainerId, {
                videoId: youtubeVideoId,
                host: 'https://www.youtube-nocookie.com',
                playerVars: startTime > 0 ? { rel: 0, start: Math.floor(startTime) } : { rel: 0 },
                events: {
                    onStateChange: (e) => {
                        clearInterval(youtubeIntervalRef.current);
                        if (e.data === YT.PlayerState.PLAYING) {
                            youtubeIntervalRef.current = setInterval(() => {
                                reportProgress(youtubePlayerRef.current.getCurrentTime());
                            }, PROGRESS_REPORT_INTERVAL_MS);
                        } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
                            reportProgress(youtubePlayerRef.current.getCurrentTime());
                        }
                    },
                },
            });
        });

        return () => {
            destroyed = true;
            clearInterval(youtubeIntervalRef.current);
            const player = youtubePlayerRef.current;
            if (player?.getCurrentTime) {
                reportProgress(player.getCurrentTime(), authRef.current);
                player.destroy?.();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isYouTube, youtubeVideoId]);

    useEffect(() => {
        if (!isYouTube) return;
        const handlePageHide = () => {
            const player = youtubePlayerRef.current;
            const { contentId } = authRef.current;
            const progressSeconds = player?.getCurrentTime ? Math.floor(player.getCurrentTime()) : 0;
            if (progressSeconds < MIN_WATCH_SECONDS || !contentId) return;
            flushOnUnload(`/contents/${contentId}/watch`, { progressSeconds });
        };
        window.addEventListener('pagehide', handlePageHide);
        return () => window.removeEventListener('pagehide', handlePageHide);
    }, [isYouTube]);

    // Seeking needs the element's duration/metadata loaded first — setting `currentTime` any
    // earlier is silently ignored by the browser.
    const handleLoadedMetadata = (e) => {
        if (startTime > 0) e.currentTarget.currentTime = startTime;
    };

    // An external URL is rendered as-is, so it goes through the scheme allowlist first — a
    // stored `javascript:` value would otherwise become a live href on a page holding the
    // session token in localStorage (React warns about it but renders it anyway).
    const externalUrl = safeExternalUrl(sourceUrl);

    if (sourceType === 'LOCAL' || sourceType === 'STREAM') {
        // Rendering before the token arrives would fire one request that 404s and leave the
        // player showing a permanent error for what is really just a not-yet-authorized fetch.
        if (mediaTokenLoading) {
            return <div className="w-full h-[300px] rounded-lg bg-black/80 animate-pulse" />;
        }

        return (
            <video
                ref={videoRef}
                controls
                playsInline
                preload="metadata"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPause={handlePauseOrEnded}
                onEnded={handlePauseOrEnded}
                className="w-full max-h-[500px] rounded-lg bg-black"
            >
                <source src={resolveMediaUrl(sourceUrl, mediaToken)} type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو
            </video>
        );
    }

    if (sourceType === 'TELEGRAM') {
        if (!externalUrl) {
            return <p className="text-text-muted text-sm">رابط الفيديو غير صالح</p>;
        }
        return (
            <video
                ref={videoRef}
                controls
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPause={handlePauseOrEnded}
                onEnded={handlePauseOrEnded}
                className="w-full max-h-[500px] rounded-lg bg-black"
            >
                <source src={externalUrl} type="video/mp4" />
            </video>
        );
    }

    if (isYouTube) {
        if (!youtubeVideoId) {
            if (!externalUrl) {
                return <p className="text-text-muted text-sm">رابط الفيديو غير صالح</p>;
            }
            return (
                <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold">
                    شاهد على يوتيوب
                </a>
            );
        }

        return (
            <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden border-0">
                <div id={youtubeContainerId} title={title} className="absolute inset-0 w-full h-full" />
            </div>
        );
    }

    if (!externalUrl) {
        return <p className="text-text-muted text-sm">رابط الفيديو غير صالح</p>;
    }

    return (
        <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold">
            شاهد الفيديو
        </a>
    );
});

export default VideoPlayer;
