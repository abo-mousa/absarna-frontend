import { API_BASE_URL } from './env';

// Resolves a URL that came back from the backend as something a browser can load.
//
// Only handles URLs that are *already* URLs: an absolute http(s) link (a channel logo, a
// YouTube thumbnail, an externally hosted PDF) or a site-rooted path. Anything else — notably an
// object-storage key like `videos/3/7/v1/1080p.mp4` — returns null, because such a key is not
// addressable by the browser at all. Media in object storage is fetched through a presigned URL
// minted by the backend instead: see useVideoPlaybackUrl / useBookReadUrl.
//
// The `token` parameter is gone, along with the whole media-token mechanism. It existed because
// the backend served gated bytes from its own /uploads and /stream URLs and an <img>/<video> tag
// cannot send an Authorization header, so a short-lived credential rode in the query string.
// Presigned URLs carry their own signature, so there is no longer a credential to place there —
// which is strictly better than having a bounded one in a place that reaches access logs and
// browser history.
export const resolveMediaUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
    // A bare object key. Not loadable directly, and deliberately not guessed at — callers render
    // their placeholder instead. (An uploaded video has no thumbnail at all until a worker
    // produces one, so a placeholder here is the correct state, not a degradation.)
    return null;
};

// A URL that came out of the database and is about to become an <a href> or a media <src>.
//
// The backend now allowlists schemes at write time (core/validation/SafeUrl), but that only
// covers rows written after the constraint landed — anything stored before it is still whatever
// someone typed. React 18 only *warns* about a `javascript:` href, it renders it anyway, and
// clicking it runs script on a page whose localStorage holds the session token. Returns null
// for anything that isn't an absolute http(s) URL so the caller can render plain text instead
// of a link.
//
// Deliberately parsed with no base URL: a scheme-less value like "www.example.com" is rejected
// rather than silently resolved against the frontend's own origin. For media held in object storage,
// use the presigned URL from useVideoPlaybackUrl / useBookReadUrl, not this.
export const safeExternalUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }
    // parsed.href, not the original string: the URL parser strips embedded tabs/newlines, and
    // returning the raw input would put them back into the href for the browser to re-parse.
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
};

const YOUTUBE_HOSTNAMES = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

/**
 * A YouTube video id is exactly 11 characters of `[A-Za-z0-9_-]`, and has been for the whole life
 * of the format.
 *
 * <p>Checked, because the id is not merely displayed: it is handed to the IFrame Player API as
 * `videoId` and interpolated into `https://img.youtube.com/vi/{id}/…` for a poster. Without this,
 * any URL on a host we accept produced *something* — `https://youtube.com/feed/history` yielded
 * `history`, a bare `https://youtu.be/` yielded `youtu.be`, `?v=` yielded the empty string — and
 * the player then rendered an embed that could only fail, with no route to the "watch on YouTube"
 * fallback that exists for exactly this case. A value that is not an id is not an id, whatever
 * the host said.
 */
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export const isYouTubeId = (value) => typeof value === 'string' && YOUTUBE_ID_PATTERN.test(value);

/** The video id in a YouTube URL, or `''` — including for a YouTube URL that names no video. */
export const extractYouTubeId = (sourceUrl) => {
    try {
        const url = new URL(sourceUrl);
        if (YOUTUBE_HOSTNAMES.has(url.hostname)) {
            const candidate = url.searchParams.get('v') || url.pathname.split('/').pop();
            // A malformed id falls back to '', which every caller already handles: the player
            // shows its "watch on YouTube" link, and youtubeThumbnail below returns null.
            if (isYouTubeId(candidate)) return candidate;
        }
    } catch {
        // not a valid URL
    }
    return '';
};

export const youtubeThumbnail = (sourceUrl) => {
    const id = extractYouTubeId(sourceUrl);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

// Parses the backend's "MM:SS" / "H:MM:SS" duration string (ContentController's Content.duration)
// into whole seconds, for computing a watched-percentage against WatchHistory.progressSeconds.
export const durationToSeconds = (duration) => {
    if (!duration || typeof duration !== 'string') return null;
    const parts = duration.split(':').map(Number);
    if (parts.length === 0 || parts.some((part) => Number.isNaN(part))) return null;
    return parts.reduce((total, part) => total * 60 + part, 0);
};
