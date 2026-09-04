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
    } catch (e) {
        return null;
    }
    // parsed.href, not the original string: the URL parser strips embedded tabs/newlines, and
    // returning the raw input would put them back into the href for the browser to re-parse.
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
};

const YOUTUBE_HOSTNAMES = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

export const extractYouTubeId = (sourceUrl) => {
    try {
        const url = new URL(sourceUrl);
        if (YOUTUBE_HOSTNAMES.has(url.hostname)) {
            return url.searchParams.get('v') || url.pathname.split('/').pop();
        }
    } catch (e) {
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
