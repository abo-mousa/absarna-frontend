import { API_BASE_URL } from './env';

// Resolves a file URL coming back from the BE (which may be a full URL, or a
// relative /uploads or /stream path, or a bare filename) against the API host.
//
// `token` is optional and only needed for a hidden (or suspended-channel) item's own file —
// the backend's MediaAccessInterceptor 404s a hidden item's /uploads or /stream URL unless the
// caller proves they're the owner/admin, but <img>/<video>/<a> tags never attach an
// Authorization header, so the token is passed as a query param instead (see JwtFilter's
// matching fallback, scoped to just these two paths). Never appended to an external URL
// (e.g. a YouTube thumbnail) — only our own API host understands it.
export const resolveMediaUrl = (url, token) => {
    if (!url) return null;
    let resolved;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        resolved = url;
    } else if (url.startsWith('/')) {
        resolved = `${API_BASE_URL}${url}`;
    } else {
        resolved = `${API_BASE_URL}/uploads/${url}`;
    }
    if (token && resolved.startsWith(API_BASE_URL)) {
        resolved += `${resolved.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    }
    return resolved;
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
