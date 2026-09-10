import { useCallback, useEffect, useRef, useState, useId, forwardRef, useImperativeHandle } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { safeExternalUrl, extractYouTubeId } from '@/lib/media';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoPlaybackUrl } from '@/hooks/useMediaUrl';
import api from '@/lib/api/client';
import { flushOnUnload } from '@/lib/api/beacon';
import { t, tOptional } from '@/i18n';

// How often onTimeUpdate (fires several times a second) is allowed to actually hit the
// backend — watch history is a convenience feature, not an analytics stream, so this stays
// coarse on purpose. Safe to keep coarse because `pagehide` below now catches the exact-exit
// moment separately — this interval only bounds how much is lost if the tab disappears
// *without* a clean exit (crash, force-kill), not the common refresh/navigate-away case.
const PROGRESS_REPORT_INTERVAL_MS = 60000;

// Below this, a play doesn't count as a "watch" for history purposes — otherwise clicking a
// thumbnail by accident and backing out immediately would still create/bump a watch-history
// row, pushing an actually-watched video out of the per-user cap.
//
// A flat 5s is only the right floor for long-form content. On a 13-second clip it silently
// swallows the first 38% of the video, so watching a few seconds and navigating away recorded
// nothing at all — which is what "the video is never added to my watch history" turned out to
// be. The floor is therefore also capped at a fraction of the video's real duration whenever
// the player knows it: unchanged (5s) for a 45-minute lecture, ~1.3s for a 13-second clip.
// Nothing here autoplays — the viewer has to press play — so the accidental-watch case this
// guards against is narrower than it looks, and a short clip needs a proportionally small floor.
const MIN_WATCH_SECONDS = 5;
const SHORT_VIDEO_WATCH_FRACTION = 0.1;
const ABSOLUTE_MIN_WATCH_SECONDS = 1;

// `durationSeconds` is whatever the player reports, which is NaN/0/Infinity for a source whose
// metadata hasn't loaded (or a live stream) — anything non-finite falls back to the flat floor.
//
// Exported so the rule is testable without a DOM. It is the arithmetic behind "the video is never
// added to my watch history", it is consulted from four separate report paths (throttled
// timeupdate, pause/ended, the unmount flush and the pagehide flush) across two player
// implementations, and none of them makes it visible in a rendered page.
export const watchThreshold = (durationSeconds) => {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return MIN_WATCH_SECONDS;
    return Math.min(
        MIN_WATCH_SECONDS,
        Math.max(ABSOLUTE_MIN_WATCH_SECONDS, durationSeconds * SHORT_VIDEO_WATCH_FRACTION),
    );
};

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

/**
 * The label for one rung of the ladder.
 *
 * <p>Most rung names — "1080p", "720p" — are not words and are shown as the worker produced them;
 * translating them would be wrong. `audio` is the exception: the worker's audio-only rung is named
 * with an identifier, not with copy, so it gets a real label from the catalog. Anything the
 * catalog does not name falls through to the rung's own name, which is what keeps a rung the
 * worker adds later from rendering as a missing-key warning.
 */
const qualityLabel = (quality) => tOptional(`video.qualityLabels.${quality}`) ?? quality;

/**
 * Whether this browser plays HLS in a <video> tag by itself.
 *
 * Safari does, on macOS and iOS, and there it is strictly better than hls.js: it is the platform
 * decoder, it costs no JavaScript, and on iOS it is the only thing that works at all. Everything
 * else — Chrome, Edge, Firefox — plays HLS only through Media Source Extensions, which is what
 * hls.js drives. So this is not a capability check for a fallback; it decides which of two
 * first-class paths to take.
 *
 * Computed once against a detached element: canPlayType allocates nothing, but calling it per
 * render on the real element would be pointless churn, and the answer cannot change mid-session.
 */
let nativeHlsSupport = null;
const supportsNativeHls = () => {
    if (nativeHlsSupport === null) {
        nativeHlsSupport =
            document.createElement('video').canPlayType('application/vnd.apple.mpegurl') !== '';
    }
    return nativeHlsSupport;
};

/**
 * Which of the three playback paths a given response takes.
 *
 * <p>Exported so the browser matrix is testable without a browser, because it is the one piece of
 * this component whose failure mode is silent and per-browser: pick `progressive` for an HLS URL
 * and Chrome shows a black player with no error the page can read; pick `hls-js` in Safari on iOS
 * and it plays nothing at all, since iOS WebKit does not give Media Source Extensions to a
 * regular page. Neither is visible in the browser the developer happens to have open.
 *
 * <p><b>`format` is authoritative and sniffing is only the fallback.</b> The backend reports it
 * because both shapes are legitimately reachable during the migration — a video transcoded into
 * `v1/` still serves a progressive MP4 ladder, and the pre-transcode owner-preview fallback
 * always does — but a response cached in React Query from before the field existed carries no
 * `format`, and treating that as progressive would hand an .m3u8 to a <video> tag.
 *
 * @param playback      the `playback-url` payload, or null/undefined before it arrives
 * @param nativeSupport whether this browser plays HLS in a <video> tag by itself
 * @returns 'progressive' | 'hls-native' | 'hls-js'
 */
export const playbackMode = (playback, nativeSupport) => {
    const isHls = playback?.format === 'hls' || looksLikeAPlaylist(playback?.url);
    if (!isHls) return 'progressive';
    return nativeSupport ? 'hls-native' : 'hls-js';
};

/**
 * The extension of a URL's PATH, ignoring its query string and fragment.
 *
 * Naively searching the whole URL for `.m3u8` reads a query parameter as the file type — and a
 * query string is precisely where a delivery layer puts things: a presigned URL's signature today,
 * a scoped token tomorrow. Anything unparseable is not a playlist, which leaves `format` to
 * decide, which is the authority anyway.
 */
const looksLikeAPlaylist = (url) => {
    if (!url) return false;
    try {
        // A fixed base rather than window.location: every playback URL is absolute, so the base
        // is only there to keep a relative one from throwing — and reaching for `window` here
        // would make this the one exported helper in the file that cannot be tested without a DOM.
        return new URL(url, 'http://relative.invalid').pathname.endsWith('.m3u8');
    } catch {
        return false;
    }
};

/**
 * How many times one viewing session will re-fetch its playback URL after a fatal network error.
 *
 * A segment that 403s is very often a credential that has expired rather than a broken file, and
 * under HLS that surfaces within six seconds rather than on the next seek — the player pulls a
 * segment continuously, so an expired URL is an immediate hard stop rather than something the
 * viewer meets when they scrub. Re-minting is the correct response and the backend will hand out
 * a fresh URL for as long as the viewer is still allowed to watch.
 *
 * Bounded because the failure it cannot fix looks identical: if the viewer's access was revoked,
 * every refresh returns a 404 from playback-url and retrying forever would hammer the API on
 * behalf of someone who is no longer permitted to watch. Three is enough to ride out an expiry
 * and a blip without becoming a loop.
 */
const MAX_URL_REFRESHES = 3;

/**
 * How long to wait before retrying the segment fetch that just failed, multiplied by the attempt
 * number.
 *
 * The wait exists because the retry and the fix are racing each other. Re-minting the playback URL
 * is a round trip to the API and a re-render; retrying the *same* expired URL fails again in well
 * under a second. Without a pause the three attempts above were spent in about two seconds, all
 * against the dead URL, and the player was destroyed at almost exactly the moment its replacement
 * arrived — the recovery path defeating itself. A second is long enough for the refetch to land
 * and short enough that a viewer reads it as a buffer rather than a break.
 */
const URL_REFRESH_BACKOFF_MS = 1000;

/**
 * The worker's audio-only rung, which is a rung on the API and NOT a variant of master.m3u8.
 *
 * It is kept out of the manifest on purpose: anything listed there is something an ABR player may
 * switch down to on a weak signal, and a lecture that silently loses its picture in a lift looks
 * broken rather than considerate. So it is the one quality the viewer has to ask for, and the one
 * switch that still costs a reload.
 */
const AUDIO_QUALITY = 'audio';

// `ref` exposes getCurrentTime() so a parent (VideoDetail's share sheet, for "copy link at
// this timestamp") can read the playhead on demand without this component re-rendering on
// every tick — the alternative (lifting currentTime into state) would fire a render several
// times a second for something only ever read once, at share-click time.
const VideoPlayer = forwardRef(function VideoPlayer({ videoId, sourceType, sourceUrl, title, poster, startTime = 0 }, ref) {
    // Session token: still the right thing for the watch-progress writes below (they go through
    // axios, which sends it as an Authorization header). Nothing goes into the media URL any
    // more — it arrives already signed from the backend. See useVideoPlaybackUrl.
    const { token } = useAuth();
    const queryClient = useQueryClient();

    // Our own uploads are fetched through a presigned URL the backend mints after running its
    // visibility check. Anything hosted elsewhere (a YouTube embed, an external link) never
    // touches this. Note the check is now on every playback, not only a hidden video: the object
    // is private regardless, so even a public video needs a signature.
    const isOwnUpload = sourceType === 'UPLOAD' || sourceType === 'LOCAL' || sourceType === 'STREAM';

    // null means "whatever the backend picks" — the worker nominates a default rung, and until
    // the viewer expresses a preference that is the right answer. Kept as null rather than
    // eagerly set to the served quality so a reload doesn't pin a choice the viewer never made.
    const [selectedQuality, setSelectedQuality] = useState(null);
    const { data: playback, isLoading: playbackUrlLoading } =
        useVideoPlaybackUrl(videoId, isOwnUpload, selectedQuality);
    const playbackUrl = playback?.url;
    const qualities = playback?.qualities ?? [];
    const servedQuality = playback?.quality ?? null;
    // Three paths, decided in one place — see playbackMode for why this is the piece worth
    // pinning without a browser.
    const usesHlsJs = playbackMode(playback, supportsNativeHls()) === 'hls-js';

    // The variants hls.js found in master.m3u8, once it has parsed it. Null until then, and null
    // forever on the native path — Safari owns its own switching and exposes no list.
    const [levels, setLevels] = useState(null);
    // -1 is hls.js's "decide for me", which is the entire point of ABR and therefore the default.
    const [selectedLevel, setSelectedLevel] = useState(-1);
    const hlsRef = useRef(null);
    const urlRefreshesRef = useRef(0);
    // Whether this hls.js instance has been told to start fetching. See handlePlay for why
    // it must happen exactly once per instance rather than on every play.
    const loadStartedRef = useRef(false);
    // Attached via the `setVideoEl` callback ref below rather than `ref={videoRef}`, and it
    // deliberately ignores the null write: React nulls a `ref={...}` out during the same unmount
    // pass that runs the flush effect's cleanup, so the element would already be gone by the time
    // the final progress report tries to read its position. `currentTime` is still readable off
    // the detached node itself, so holding onto it is what makes that last write possible.
    const videoRef = useRef(null);
    // Stable identity so React doesn't detach/reattach it on every render (which, with the
    // ignore-null rule, would be harmless but pointless churn).
    const setVideoEl = useCallback((el) => {
        if (el) videoRef.current = el;
    }, []);
    // The video's length once the player knows it — feeds watchThreshold above.
    const durationRef = useRef(NaN);
    // Where to resume after a quality switch, and whether to keep playing. Swapping a <video>'s
    // source always restarts it from zero, so the playhead has to be carried across by hand —
    // otherwise changing quality mid-lecture silently sends the viewer back to the beginning.
    const pendingSeekRef = useRef(null);
    const resumePlaybackRef = useRef(false);
    const lastReportedAtRef = useRef(0);
    // Mirrors token/videoId into refs so the unmount effect below always reports against
    // the latest values without re-subscribing (and re-flushing) on every render.
    const authRef = useRef({ token, videoId });
    authRef.current = { token, videoId };

    const reportProgress = (seconds, { token: authToken, videoId: authVideoId } = authRef.current) => {
        if (!authToken || !authVideoId) return;
        const progressSeconds = Math.floor(seconds);
        if (progressSeconds < watchThreshold(durationRef.current)) return;
        api.post(`/videos/${authVideoId}/watch`, { progressSeconds })
            .then(() => {
                // This write goes straight through axios, bypassing React Query entirely, so
                // nothing else marks the cached ['watch-history'] query stale — and the app-wide
                // QueryClient has refetchOnMount disabled, so History/Home/Bookmarks would
                // otherwise keep serving the pre-watch snapshot for up to its 60s staleTime (or
                // until something else happens to refetch it) instead of reflecting a watch that
                // just happened. Invalidating here is what makes a partial watch show up without
                // needing a full page reload.
                queryClient.invalidateQueries({ queryKey: ['watch-history'] });
            })
            .catch(() => {
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
    //
    // Reading `videoRef.current` inside the cleanup is only safe because it's a callback ref
    // that ignores React's null-out on unmount (see its definition above). Capturing the element
    // when the effect is *set up* instead would look equivalent but isn't: this effect runs once,
    // on first render, and the hidden-item path renders a placeholder rather than the <video>
    // on that render while the media token loads — so it would capture `null` for good.
    useEffect(() => {
        return () => {
            const el = videoRef.current;
            if (el && el.currentTime > 0) {
                reportProgress(el.currentTime, authRef.current);
            }
        };
        // Mount-only, and that is the whole mechanism: the cleanup IS the flush. `reportProgress`
        // is recreated every render, so listing it would tear down and re-run this effect
        // constantly — writing a progress row on every render instead of once on the way out.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Covers the hard-refresh/tab-close/hard-navigation case above: `pagehide` fires in those
    // cases (unlike unmount), but by then a normal axios/XHR call would get cancelled mid-flight
    // by the browser, so this uses a `keepalive` fetch instead — see lib/api/beacon.js.
    useEffect(() => {
        const handlePageHide = () => {
            const el = videoRef.current;
            const { videoId } = authRef.current;
            const progressSeconds = el ? Math.floor(el.currentTime) : 0;
            if (!videoId || progressSeconds < watchThreshold(durationRef.current)) return;
            flushOnUnload(`/videos/${videoId}/watch`, { progressSeconds });
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
    const qualitySelectId = `quality-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
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
                        // Only known once the embed has actually loaded the video, so it's read
                        // here rather than at construction time.
                        durationRef.current = youtubePlayerRef.current?.getDuration?.() ?? NaN;
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
            const { videoId } = authRef.current;
            const progressSeconds = player?.getCurrentTime ? Math.floor(player.getCurrentTime()) : 0;
            if (!videoId || progressSeconds < watchThreshold(durationRef.current)) return;
            flushOnUnload(`/videos/${videoId}/watch`, { progressSeconds });
        };
        window.addEventListener('pagehide', handlePageHide);
        return () => window.removeEventListener('pagehide', handlePageHide);
    }, [isYouTube]);

    // Seeking needs the element's duration/metadata loaded first — setting `currentTime` any
    // earlier is silently ignored by the browser.
    const handleLoadedMetadata = (e) => {
        durationRef.current = e.currentTarget.duration;
        // A pending seek is a quality switch and takes precedence over `startTime`, which is the
        // deep-link/resume position and was already honoured on the first load.
        if (pendingSeekRef.current != null) {
            e.currentTarget.currentTime = pendingSeekRef.current;
            pendingSeekRef.current = null;
            if (resumePlaybackRef.current) {
                resumePlaybackRef.current = false;
                // Ignored rather than surfaced: autoplay policies can refuse this, and the
                // viewer pressing play is a perfectly good outcome.
                e.currentTarget.play().catch(() => {});
            }
            return;
        }
        if (startTime > 0) e.currentTarget.currentTime = startTime;
    };

    /** Snapshots the playhead so a source swap can put the viewer back where they were. */
    const rememberPosition = () => {
        const el = videoRef.current;
        if (!el) return;
        pendingSeekRef.current = el.currentTime;
        resumePlaybackRef.current = !el.paused && !el.ended;
    };

    /**
     * Switching between the video variants of one master playlist.
     *
     * <p>This is the case HLS makes cheap: the manifest is already loaded and every rung was cut
     * at the same instants, so hls.js swaps at the next segment boundary. Nothing reloads, the
     * playhead does not move, and none of the seek-restore machinery below runs. `-1` hands the
     * choice back to the ABR algorithm.
     */
    const handleLevelChange = (level) => {
        setSelectedLevel(level);
        if (hlsRef.current) hlsRef.current.currentLevel = level;
    };

    /**
     * Switching to a different playlist entirely — which today means the audio-only rung.
     *
     * <p><b>The seek-restore machinery survives for exactly this transition.</b> Audio is
     * deliberately not a variant of master.m3u8 (the worker keeps it out so an ABR player cannot
     * silently drop the picture on a weak signal), so reaching it means asking the backend for a
     * different playlist and handing the player a new source — which always restarts from zero.
     * Level switching above no longer needs any of this; this one still does.
     */
    const handleQualityChange = (quality) => {
        rememberPosition();
        setSelectedQuality(quality);
    };

    // Changing the `src` attribute does not itself reload the element — the browser keeps
    // playing the old source until load() is called. This is also what makes onLoadedMetadata
    // fire again, which is where the pending seek is applied.
    //
    // Only the paths where the element owns its own source: a progressive MP4, and HLS in Safari,
    // which plays an .m3u8 from `src` exactly like any other file. The hls.js path deliberately
    // leaves `src` unset and is driven by the effect below instead.
    useEffect(() => {
        const el = videoRef.current;
        if (usesHlsJs) return;
        if (el && playbackUrl && el.dataset.src !== playbackUrl) {
            el.dataset.src = playbackUrl;
            el.load();
        }
    }, [playbackUrl, usesHlsJs]);

    /**
     * Drives playback through hls.js where the browser cannot play HLS itself.
     *
     * <p><b>The library is imported dynamically, and that is not micro-optimisation.</b> It is
     * ~150 KB and every page in this app that is not a video detail page has no use for it —
     * including all of Safari, which never reaches this branch at all. A static import would put
     * it in the main bundle for everyone.
     */
    useEffect(() => {
        if (!usesHlsJs || !playbackUrl) return undefined;
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
                // No MSE at all. Rare and old, and there is nothing to fall back to — an .m3u8
                // in a <video> tag here plays nothing, so the element's own <track>-less
                // "unsupported" text is the honest outcome.
                return;
            }
            hls = new Hls({
                // The playhead is restored by handleLoadedMetadata, which fires for this path
                // too — leaving hls.js to guess a start position as well would have the two
                // fight over the first second of playback.
                startPosition: -1,
                // NOT the default (true), and this is the single most expensive default in the
                // library for this audience. hls.js starts buffering the moment a source is
                // attached, ignoring the element's preload="metadata" entirely — so opening a
                // lecture page and reading the description would pull up to maxBufferLength (30s)
                // or maxBufferSize (60 MB) of video before anyone pressed play. Under progressive
                // MP4 the same page fetched only the moov atom. The catalogue is hour-long
                // lectures watched on metered mobile data, so this is real money on someone
                // else's bill. Loading starts on the first play() below instead.
                autoStartLoad: false,
                // Also not the default. Without it ABR will happily choose the 1080p rung for a
                // 640px-wide player, which is bandwidth spent on pixels the element cannot show.
                capLevelToPlayerSize: true,
            });
            hlsRef.current = hls;

            hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
                if (cancelled) return;
                // Named from the manifest rather than from the API's `qualities`: this list is
                // what the player can actually switch between, and building the selector from
                // anything else risks offering a rung that is not in this playlist.
                //
                // Ordered largest-first to match master.m3u8 and the API's own `qualities`.
                // hls.js sorts data.levels ascending by bitrate, so taking them as they come
                // would put 480p at the top of a selector that reads 1080p-first everywhere else
                // in this app.
                setLevels(data.levels
                    .map((level, index) => ({
                        index,
                        height: level.height ?? 0,
                        label: level.height
                            ? `${level.height}p`
                            : `${Math.round(level.bitrate / 1000)}k`,
                    }))
                    .sort((a, b) => b.height - a.height));
                hls.currentLevel = selectedLevel;

                // A pending seek means this instance is a CONTINUATION — the viewer swapped to
                // the audio rung, or back off it, mid-lecture — so there is no play event coming
                // to start the fetching that `autoStartLoad: false` deferred. Without this the
                // switch deadlocks: loadedmetadata is what resumes playback, and it cannot fire
                // until an init segment is buffered, which cannot happen until something loads.
                if (pendingSeekRef.current != null) {
                    loadStartedRef.current = true;
                    hls.startLoad(pendingSeekRef.current);
                }
            });

            // A segment that loads is proof the URL is good, so the refresh budget below starts
            // again from zero. Without this, three unrelated blips an hour apart would leave a
            // session permanently unable to recover from an expiry.
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
                        rememberPosition();
                        queryClient.invalidateQueries({
                            queryKey: ['videoPlaybackUrl', videoId],
                        });
                        // Deliberately NOT an immediate startLoad(). Retrying the same expired URL
                        // fails again within a second — long before the refetch resolves and
                        // re-renders — so an immediate retry burned all three attempts in a few
                        // seconds and destroyed the player at exactly the moment the replacement
                        // URL was about to arrive. If the refetch returns a different URL this
                        // instance is torn down and rebuilt by the effect (and the timer below is
                        // cleared unfired); the backoff only has to cover the case where it comes
                        // back unchanged.
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
        // selectedLevel is deliberately absent: changing it must not tear the player down and
        // rebuild it, which is the whole reason level switching is free. handleLevelChange
        // applies it to the live instance instead.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usesHlsJs, playbackUrl, videoId, queryClient]);

    /**
     * Starts hls.js fetching, on the viewer's first play rather than on page load.
     *
     * <p>This is the other half of `autoStartLoad: false`, and it has to be on the element's own
     * `play` event rather than on a click: the controls are the browser's, so there is no button
     * of ours to hang it off, and `play` also covers the keyboard and the media keys.
     *
     * <p>The start position is passed rather than left to default to zero, so a deep link to a
     * timestamp buffers from there instead of buffering the opening, seeking, and discarding it.
     * `handleLoadedMetadata` still sets `currentTime` when it fires; by then it is a no-op re-set
     * of the position hls.js already started at.
     *
     * <p><b>Once per player, and the guard is not tidiness.</b> `startLoad(n)` assigns hls.js's
     * next load position outright, so calling it again on a later play — after the viewer had
     * scrubbed forward and paused — would drag them back to the deep-link timestamp.
     */
    const handlePlay = () => {
        if (!usesHlsJs || loadStartedRef.current || !hlsRef.current) return;
        loadStartedRef.current = true;
        hlsRef.current.startLoad(startTime > 0 ? startTime : -1);
    };

    // An external URL is rendered as-is, so it goes through the scheme allowlist first — a
    // stored `javascript:` value would otherwise become a live href on a page holding the
    // session token in localStorage (React warns about it but renders it anyway).
    const externalUrl = safeExternalUrl(sourceUrl);

    if (isOwnUpload) {
        // Rendering before the signed URL arrives would fire one unsigned request that 403s and
        // leave the player stuck showing an error for what is really just a pending fetch.
        if (playbackUrlLoading || !playbackUrl) {
            return <div className="w-full h-[300px] rounded-lg bg-black/80 animate-pulse" />;
        }

        const onAudioRung = selectedQuality === AUDIO_QUALITY || servedQuality === AUDIO_QUALITY;
        const hasAudioRung = qualities.includes(AUDIO_QUALITY);
        // On the hls.js path the manifest is the source of truth about what can be switched
        // between; the audio rung is not in it (deliberately — see MasterPlaylist in the worker)
        // so it is offered from the API's ladder alongside. Where the browser plays HLS itself,
        // Safari owns switching and exposes no list, so the only choice left to offer is sound.
        const selectorVisible = usesHlsJs
            ? (levels ?? []).length > 1 || hasAudioRung
            : hasAudioRung;

        return (
            <div>
                <video
                    ref={setVideoEl}
                    // Unset on the hls.js path: the library attaches a MediaSource to this
                    // element, and an .m3u8 in `src` alongside it makes the browser try to play
                    // the manifest as a media file and lose the race.
                    src={usesHlsJs ? undefined : playbackUrl}
                    // Without it the element is black until play: hls.js fetches nothing before
                    // then (autoStartLoad: false), and preload="metadata" yields no frame either.
                    poster={poster ?? undefined}
                    controls
                    playsInline
                    // Honoured by the element on the progressive and Safari paths. hls.js ignores
                    // it entirely and is held back by `autoStartLoad: false` plus onPlay below.
                    preload="metadata"
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={handlePlay}
                    onPause={handlePauseOrEnded}
                    onEnded={handlePauseOrEnded}
                    className="w-full max-h-[500px] rounded-lg bg-black"
                >
                    {t('video.unsupported')}
                </video>

                {/* Only worth showing when there is a real choice. A source smaller than 480p
                    produces a single rung, and a lone option is just clutter.

                    Two selectors, because there are two genuinely different kinds of switch and
                    collapsing them would misrepresent one of them. Levels come from the manifest
                    and change nothing but the bitrate, instantly. Audio is a different playlist
                    and a different experience, and reaching it reloads the player. */}
                {selectorVisible && (
                    <div className="flex items-center justify-end gap-2 mt-2">
                        <label htmlFor={qualitySelectId} className="text-sm text-text-muted">
                            {t('video.quality')}
                        </label>
                        <select
                            id={qualitySelectId}
                            value={onAudioRung ? AUDIO_QUALITY : String(selectedLevel)}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === AUDIO_QUALITY) {
                                    handleQualityChange(AUDIO_QUALITY);
                                } else if (onAudioRung) {
                                    // Coming back to the picture: another playlist swap, so the
                                    // playhead has to be carried across by hand again.
                                    handleQualityChange(null);
                                } else {
                                    handleLevelChange(Number(value));
                                }
                            }}
                            className="text-sm bg-surface border border-border rounded px-2 py-1
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            {/* Auto first, and selected by default: with a rendition ladder cut
                                on aligned keyframes, letting the player choose is better than any
                                fixed answer a viewer could give — which is the whole reason for
                                the HLS migration. On the audio rung it is also the way back to
                                the picture. */}
                            <option value="-1">{qualityLabel('auto')}</option>
                            {/* Suppressed on the audio rung, where `levels` describes the AUDIO
                                playlist. That is a media playlist, not a multivariant one, so
                                hls.js synthesises a single pseudo-level from it and offering it
                                would put a bitrate like "64k" in the menu that does nothing but
                                return the viewer to the video ladder — which "auto" already says
                                far better. */}
                            {!onAudioRung && (levels ?? []).map((level) => (
                                <option key={level.index} value={String(level.index)}>
                                    {level.label}
                                </option>
                            ))}
                            {hasAudioRung && (
                                <option value={AUDIO_QUALITY}>{qualityLabel(AUDIO_QUALITY)}</option>
                            )}
                        </select>
                    </div>
                )}
            </div>
        );
    }

    // TELEGRAM is still an accepted `sourceType` on the backend — it is in
    // VideoUpdateRequest.SOURCE_TYPE_PATTERN, so an admin or owner can set it through the create
    // and update endpoints — but nothing writes it automatically and no such row exists today.
    // It therefore keeps a branch, and that branch is a LINK rather than a <video>: the SPA's
    // own CSP names `media-src 'self' blob: <bucket>` and nothing else, so a Telegram CDN URL in
    // a <video> is blocked by the browser with no error the page can see. The player rendered
    // black and the viewer had no route to the file at all. A link is honest about where the
    // bytes live and works under the policy.
    if (sourceType === 'TELEGRAM') {
        if (!externalUrl) {
            return <p className="text-text-muted text-sm">{t('video.invalidUrl')}</p>;
        }
        return (
            <div className="rounded-lg border border-border bg-surface-hover p-4 text-sm">
                <p className="text-text-secondary mb-2">{t('video.externalSourceNotice')}</p>
                <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold"
                >
                    {t('video.openExternalSource')}
                </a>
            </div>
        );
    }

    if (isYouTube) {
        if (!youtubeVideoId) {
            if (!externalUrl) {
                return <p className="text-text-muted text-sm">{t('video.invalidUrl')}</p>;
            }
            return (
                <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold">
                    {t('video.watchOnYouTube')}
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
        return <p className="text-text-muted text-sm">{t('video.invalidUrl')}</p>;
    }

    return (
        <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold">
            {t('video.watchVideo')}
        </a>
    );
});

export default VideoPlayer;
