import { API_BASE_URL } from './env';

// Our own API's origin, parsed once — see isOwnMediaUrl.
const apiOrigin = (() => {
    try {
        return new URL(API_BASE_URL, window.location.href).origin;
    } catch {
        return null;
    }
})();

// Whether `resolved` is one of *our* gated media URLs, and so somewhere the media token may go.
//
// This used to be `resolved.startsWith(API_BASE_URL)` — a prefix test on a URL string, not an
// origin check. It therefore also passed for any host whose name merely begins with ours
// (`https://api.example.com.evil.tld/…`) and for userinfo syntax
// (`https://api.example.com@evil.tld/…`, which the browser sends to evil.tld). That was
// reachable, not theoretical: the backend's SafeUrl allowlist admits any absolute https URL, so
// a channel owner could store such a value as a hidden video's sourceUrl and collect the media
// token of anyone able to view it — a platform admin moderating that channel included.
//
// Also narrowed to the two paths MediaAccessInterceptor actually gates. The token authenticates
// nothing else (JwtFilter only accepts it from ?token= on /uploads and /stream), so sending it
// anywhere else was pure leak surface — and it closes the "wider contract than its comment
// claims" note in CLAUDE.md at the same time.
const isOwnMediaUrl = (resolved) => {
    if (!apiOrigin) return false;
    let parsed;
    try {
        parsed = new URL(resolved, window.location.href);
    } catch {
        return false;
    }
    return parsed.origin === apiOrigin
        && (parsed.pathname.startsWith('/uploads/') || parsed.pathname.startsWith('/stream/'));
};

// Resolves a file URL coming back from the BE (which may be a full URL, or a
// relative /uploads or /stream path, or a bare filename) against the API host.
//
// `token` is optional and only needed for a hidden (or suspended-channel) item's own file —
// the backend's MediaAccessInterceptor 404s a hidden item's /uploads or /stream URL unless the
// caller proves they're the owner/admin, but <img>/<video>/<a> tags never attach an
// Authorization header, so the token is passed as a query param instead (see JwtFilter's
// matching fallback, scoped to just these two paths). Only ever appended to an /uploads or
// /stream path on our own origin — never to an external URL (e.g. a YouTube thumbnail), and
// never to another route on our own host; see isOwnMediaUrl below for why that check is an
// origin comparison rather than a string prefix.
//
// Pass the **media token** from hooks/useMediaToken, never the session token from useAuth():
// a query param ends up in the API's access logs, every proxy's logs, and browser history, so
// what goes in it must be short-lived and useless for anything but fetching a file. See that
// hook, and JwtUtil.generateMediaToken on the backend.
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
    if (token && isOwnMediaUrl(resolved)) {
        resolved += `${resolved.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    }
    return resolved;
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
// rather than silently resolved against the frontend's own origin. For our *own* API-hosted
// files (relative /uploads and /stream paths) use resolveMediaUrl above, not this.
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
