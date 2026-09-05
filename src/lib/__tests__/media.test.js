import { describe, expect, it } from 'vitest';
import {
    durationToSeconds,
    extractYouTubeId,
    resolveMediaUrl,
    safeExternalUrl,
    youtubeThumbnail,
} from '@/lib/media';
import { API_BASE_URL } from '@/lib/env';

/**
 * `safeExternalUrl` is the last line of defence for a `javascript:` URL stored before the backend's
 * SafeUrl constraint existed. React 18 only *warns* about such an href and renders it anyway, and
 * clicking it runs script on a page whose localStorage holds the session token — so its tests are
 * written as an allowlist (anything not proven http(s) must come back null), not as a blocklist of
 * known-bad schemes.
 */
describe('resolveMediaUrl', () => {
    it('passes an absolute URL through unchanged', () => {
        expect(resolveMediaUrl('https://img.youtube.com/vi/x/hqdefault.jpg'))
            .toBe('https://img.youtube.com/vi/x/hqdefault.jpg');
        expect(resolveMediaUrl('http://example.com/logo.png')).toBe('http://example.com/logo.png');
    });

    it('roots a relative path at the API origin', () => {
        expect(resolveMediaUrl('/assets/logo.svg')).toBe(`${API_BASE_URL}/assets/logo.svg`);
    });

    it('returns null for a bare object-storage key', () => {
        // A key like this is not addressable by the browser at all — media in object storage is
        // reached through a presigned URL from useVideoPlaybackUrl/useBookReadUrl. Guessing a URL
        // here would render a broken image instead of the caller's placeholder.
        expect(resolveMediaUrl('videos/3/7/v1/1080p.mp4')).toBeNull();
        expect(resolveMediaUrl('books/3/7/book.pdf')).toBeNull();
    });

    it('returns null for anything that is not a usable string', () => {
        expect(resolveMediaUrl(null)).toBeNull();
        expect(resolveMediaUrl(undefined)).toBeNull();
        expect(resolveMediaUrl('')).toBeNull();
        expect(resolveMediaUrl(42)).toBeNull();
        expect(resolveMediaUrl({})).toBeNull();
    });
});

describe('safeExternalUrl', () => {
    it('accepts http and https', () => {
        expect(safeExternalUrl('https://example.com/page')).toBe('https://example.com/page');
        expect(safeExternalUrl('http://example.com/page')).toBe('http://example.com/page');
    });

    it('rejects javascript: in every spelling', () => {
        // The scheme is case-insensitive to the browser, and the URL parser tolerates whitespace
        // and embedded control characters — so a string comparison against "javascript:" is not
        // enough, which is why this is written as a scheme allowlist.
        expect(safeExternalUrl('javascript:alert(1)')).toBeNull();
        expect(safeExternalUrl('JavaScript:alert(1)')).toBeNull();
        expect(safeExternalUrl('  javascript:alert(1)  ')).toBeNull();
        expect(safeExternalUrl('java\tscript:alert(1)')).toBeNull();
        expect(safeExternalUrl('java\nscript:alert(1)')).toBeNull();
    });

    it('rejects other executable or embedding schemes', () => {
        expect(safeExternalUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
        expect(safeExternalUrl('vbscript:msgbox(1)')).toBeNull();
        expect(safeExternalUrl('file:///etc/passwd')).toBeNull();
        expect(safeExternalUrl('blob:https://example.com/uuid')).toBeNull();
    });

    it('rejects a scheme-less value rather than resolving it against our own origin', () => {
        // Parsed with no base URL on purpose: silently turning "www.example.com" into a link to
        // our own site would present someone else's content as ours.
        expect(safeExternalUrl('www.example.com')).toBeNull();
        expect(safeExternalUrl('/relative/path')).toBeNull();
        expect(safeExternalUrl('//example.com')).toBeNull();
    });

    it('returns the parsed href, not the caller\'s raw string', () => {
        // The parser strips embedded tabs and newlines; returning the original would hand them
        // back to the browser to re-parse, which is how the filtered spelling gets through.
        expect(safeExternalUrl('https://exam\tple.com/a')).toBe('https://example.com/a');
        expect(safeExternalUrl('https://example.com')).toBe('https://example.com/');
    });

    it('returns null for anything that is not a usable string', () => {
        expect(safeExternalUrl(null)).toBeNull();
        expect(safeExternalUrl('')).toBeNull();
        expect(safeExternalUrl('not a url at all')).toBeNull();
        expect(safeExternalUrl(123)).toBeNull();
    });
});

describe('extractYouTubeId', () => {
    it('reads the v parameter from a watch URL', () => {
        expect(extractYouTubeId('https://www.youtube.com/watch?v=abc123')).toBe('abc123');
        expect(extractYouTubeId('https://youtube.com/watch?v=abc123&t=90')).toBe('abc123');
        expect(extractYouTubeId('https://m.youtube.com/watch?v=abc123')).toBe('abc123');
    });

    it('reads the last path segment of a short link', () => {
        expect(extractYouTubeId('https://youtu.be/abc123')).toBe('abc123');
    });

    it('ignores hosts that merely resemble YouTube', () => {
        // Matched against an exact hostname set rather than a substring, so a lookalike domain
        // cannot get its id embedded in a youtube.com thumbnail URL.
        expect(extractYouTubeId('https://youtube.com.evil.test/watch?v=abc123')).toBe('');
        expect(extractYouTubeId('https://notyoutube.com/watch?v=abc123')).toBe('');
    });

    it('returns an empty string for a non-URL', () => {
        expect(extractYouTubeId('abc123')).toBe('');
        expect(extractYouTubeId(null)).toBe('');
        expect(extractYouTubeId('')).toBe('');
    });
});

describe('youtubeThumbnail', () => {
    it('builds a thumbnail URL from a recognised video', () => {
        expect(youtubeThumbnail('https://www.youtube.com/watch?v=abc123'))
            .toBe('https://img.youtube.com/vi/abc123/hqdefault.jpg');
    });

    it('returns null when there is no id, so the caller shows a placeholder', () => {
        expect(youtubeThumbnail('https://example.com/video.mp4')).toBeNull();
        expect(youtubeThumbnail(null)).toBeNull();
    });
});

describe('durationToSeconds', () => {
    it('parses MM:SS and H:MM:SS', () => {
        expect(durationToSeconds('05:30')).toBe(330);
        expect(durationToSeconds('1:00:00')).toBe(3600);
        expect(durationToSeconds('2:05:30')).toBe(7530);
    });

    it('parses a bare seconds value', () => {
        expect(durationToSeconds('45')).toBe(45);
    });

    it('handles a long lecture, which is the realistic case here', () => {
        expect(durationToSeconds('1:32:15')).toBe(5535);
    });

    it('returns null rather than NaN for unparseable input', () => {
        // The result divides WatchHistory.progressSeconds to draw a progress bar; a NaN would
        // render as an invalid CSS width rather than as "no progress known".
        expect(durationToSeconds('abc')).toBeNull();
        expect(durationToSeconds('12:ab')).toBeNull();
        expect(durationToSeconds(null)).toBeNull();
        expect(durationToSeconds('')).toBeNull();
        expect(durationToSeconds(330)).toBeNull();
    });
});
