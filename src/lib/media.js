import { API_BASE_URL } from './env';

// Resolves a file URL coming back from the BE (which may be a full URL, or a
// relative /uploads or /stream path, or a bare filename) against the API host.
export const resolveMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
    return `${API_BASE_URL}/uploads/${url}`;
};

export const extractYouTubeId = (sourceUrl) => {
    try {
        const url = new URL(sourceUrl);
        if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
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
