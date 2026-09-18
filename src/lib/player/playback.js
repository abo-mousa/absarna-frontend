import { tOptional } from '@/i18n';

// How often onTimeUpdate (fires several times a second) is allowed to actually hit the backend —
// watch history is a convenience feature, not an analytics stream. Safe to keep coarse because
// `pagehide` catches the exact-exit moment separately, so this only bounds what is lost when the
// tab disappears *without* a clean exit (crash, force-kill).
export const PROGRESS_REPORT_INTERVAL_MS = 60000;

// Below this, a play doesn't count as a "watch" — otherwise clicking a thumbnail by accident and
// backing out would still bump a watch-history row, pushing an actually-watched video out of the
// per-user cap.
//
// A flat 5s is only the right floor for long-form content. On a 13-second clip it swallows the
// first 38% of the video, which is what "the video is never added to my watch history" turned out
// to be — so the floor is also capped at a fraction of the real duration: unchanged for a
// 45-minute lecture, ~1.3s for a 13-second clip. Nothing autoplays, so the accidental-watch case
// this guards is narrower than it looks.
const MIN_WATCH_SECONDS = 5;
const SHORT_VIDEO_WATCH_FRACTION = 0.1;
const ABSOLUTE_MIN_WATCH_SECONDS = 1;

/**
 * The floor a position must clear before it is recorded as a watch.
 *
 * `durationSeconds` is whatever the player reports, which is NaN/0/Infinity for a source whose
 * metadata hasn't loaded (or a live stream) — anything non-finite falls back to the flat floor.
 *
 * Consulted from four separate report paths (throttled timeupdate, pause/ended, the unmount flush
 * and the pagehide flush) across two player implementations, and none of them makes it visible in
 * a rendered page.
 */
export const watchThreshold = (durationSeconds) => {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return MIN_WATCH_SECONDS;
    return Math.min(
        MIN_WATCH_SECONDS,
        Math.max(ABSOLUTE_MIN_WATCH_SECONDS, durationSeconds * SHORT_VIDEO_WATCH_FRACTION),
    );
};

/**
 * Whether a progress report repeats one already handed to the network.
 *
 * <p>The four report paths are not mutually exclusive, and on the way out of a page two of them
 * fire in the same moment: leaving the tab pauses the element (`useResumeAfterBackground`), whose
 * `pause` event reports, and `pagehide` flushes the same playhead a beat later. Pausing and then
 * navigating away pairs the same way with the unmount flush. On a video the viewer has never
 * watched there is no history row yet, so both requests take the backend's insert branch and the
 * loser dies on the `(user_id, video_id)` unique constraint — one write silently lost, and a WARN
 * in the backend log for every first watch.
 *
 * <p>Only a repeat of the *same second of the same video* is dropped, and only inside the
 * checkpoint interval: beyond that the position has stood still long enough that re-sending it is
 * a deliberate refresh of when it was last watched, not an echo of a single exit.
 *
 * <p>This narrows the window; it does not close it. Two tabs, or a phone and a laptop, race the
 * same way and no client-side guard reaches that — the backend's write has to be an upsert.
 */
export const isDuplicateReport = (last, { videoId, progressSeconds, at }) => Boolean(last)
    && last.videoId === videoId
    && last.progressSeconds === progressSeconds
    && at - last.at < PROGRESS_REPORT_INTERVAL_MS;

/**
 * The label for one rung of the ladder.
 *
 * Most rung names — "1080p", "720p" — are not words and are shown as the worker produced them;
 * translating them would be wrong. `audio` is the exception: it is named with an identifier, not
 * with copy. Anything the catalog does not name falls through to the rung's own name, which keeps
 * a rung the worker adds later from rendering as a missing-key warning.
 */
export const qualityLabel = (quality) => tOptional(`video.qualityLabels.${quality}`) ?? quality;

/**
 * Whether this browser plays HLS in a <video> tag by itself.
 *
 * Safari does, on macOS and iOS, and there it is strictly better than hls.js: it is the platform
 * decoder, it costs no JavaScript, and on iOS it is the only thing that works at all. Everything
 * else plays HLS only through Media Source Extensions, which is what hls.js drives. So this is not
 * a capability check for a fallback; it decides which of two first-class paths to take.
 *
 * Computed once against a detached element — the answer cannot change mid-session.
 */
let nativeHlsSupport = null;
export const supportsNativeHls = () => {
    if (nativeHlsSupport === null) {
        nativeHlsSupport =
            document.createElement('video').canPlayType('application/vnd.apple.mpegurl') !== '';
    }
    return nativeHlsSupport;
};

/**
 * The extension of a URL's PATH, ignoring its query string and fragment.
 *
 * Naively searching the whole URL for `.m3u8` reads a query parameter as the file type — and a
 * query string is precisely where a delivery layer puts things: a book's presigned signature today,
 * a scoped token on the media host tomorrow, a cache-buster at any point. Anything unparseable is
 * not a playlist, which leaves `format` to decide, which is the authority anyway.
 */
const looksLikeAPlaylist = (url) => {
    if (!url) return false;
    try {
        // A fixed base rather than window.location: every playback URL is absolute, so the base is
        // only there to keep a relative one from throwing — and reaching for `window` would make
        // this the one helper here that cannot be tested without a DOM.
        return new URL(url, 'http://relative.invalid').pathname.endsWith('.m3u8');
    } catch {
        return false;
    }
};

/**
 * Which of the three playback paths a given response takes.
 *
 * Its failure mode is silent and per-browser: pick `progressive` for an HLS URL and Chrome shows a
 * black player with no error the page can read; pick `hls-js` in Safari on iOS and it plays
 * nothing at all, since iOS WebKit gives a regular page no Media Source Extensions. Neither is
 * visible in the browser the developer happens to have open.
 *
 * **`format` is authoritative and sniffing is only the fallback.** The backend reports it because
 * both shapes are legitimately reachable — a `v1/` ladder is still progressive MP4, and the
 * pre-transcode owner-preview fallback always is — but a response cached in React Query from
 * before the field existed carries no `format`, and treating that as progressive would hand an
 * .m3u8 to a <video> tag.
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
 * Which of the three things the player shows for one of our own uploads: the video, a placeholder
 * while its URL is being fetched, or a dead end with a retry button.
 *
 * <p><b>The order is the whole function.</b> `playback-url` is queried with `retry: false`,
 * because a 404 there means "not visible to you" and no number of retries changes that — so a
 * failure settles at once: `isLoading` goes false and `data` stays undefined. Asking "is it still
 * loading, or is there no URL yet?" first therefore answers `loading` for a request that already
 * failed and will never be made again, and the player sat on a pulsing black rectangle for the
 * rest of the page's life. A 5xx or a dropped connection was enough.
 *
 * <p>`hlsGaveUp` is the same dead end reached from the other side — hls.js destroyed after its
 * refresh budget, which leaves a poster and a play button that do nothing — and is checked here
 * rather than in the player so both routes are answered in one place, and by a function that can
 * be pinned without a DOM.
 *
 * @returns 'failed' | 'loading' | 'ready'
 */
export const uploadPlayerSurface = ({ urlFailed, hlsGaveUp, urlLoading, playbackUrl }) => {
    if (urlFailed || hlsGaveUp) return 'failed';
    if (urlLoading || !playbackUrl) return 'loading';
    return 'ready';
};
