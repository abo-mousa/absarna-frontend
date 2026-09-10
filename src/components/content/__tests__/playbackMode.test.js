import { describe, expect, it } from 'vitest';
import { playbackMode } from '@/components/content/VideoPlayer';

/**
 * Which player drives a given playback URL — the one decision in VideoPlayer whose failure is
 * both silent and per-browser.
 *
 * <p>Getting it wrong does not throw and does not log. Hand an `.m3u8` to a plain `<video>` tag in
 * Chrome and the player renders black with no error the page can read. Reach for hls.js in Safari
 * on iOS and it plays nothing at all, because iOS WebKit gives a regular page no Media Source
 * Extensions — while the same code works perfectly in Safari on the Mac, which is where anyone
 * developing this would notice. So the matrix is pinned here rather than left to whichever
 * browser happens to be open.
 */
describe('playbackMode', () => {
    const hls = { url: 'https://media/videos/7/42/v2/master.m3u8', format: 'hls' };
    const mp4 = { url: 'https://media/videos/7/42/v1/720p.mp4', format: 'progressive' };

    it('sends HLS to the browser itself where the browser can play it', () => {
        // Safari, macOS and iOS. Strictly better than hls.js there: it is the platform decoder,
        // it costs no JavaScript, and on iOS it is the only thing that works.
        expect(playbackMode(hls, true)).toBe('hls-native');
    });

    it('sends HLS to hls.js everywhere else', () => {
        // Chrome, Edge, Firefox: no native HLS, so the manifest and its segments are fed to the
        // element through Media Source Extensions instead.
        expect(playbackMode(hls, false)).toBe('hls-js');
    });

    it('leaves a progressive MP4 on the element in every browser', () => {
        // Videos transcoded before the migration keep a v1/ MP4 ladder and must keep playing
        // exactly as they did — including in Safari, where the native branch would otherwise be
        // an easy thing to route them into by accident.
        expect(playbackMode(mp4, true)).toBe('progressive');
        expect(playbackMode(mp4, false)).toBe('progressive');
    });

    it('falls back to sniffing the URL when the response predates the format field', () => {
        // React Query caches this payload for thirty minutes, so a response fetched from a
        // backend that did not yet report `format` can outlive the deploy that added it. Treating
        // that as progressive would hand an .m3u8 to a <video> tag.
        expect(playbackMode({ url: 'https://media/x/master.m3u8' }, false)).toBe('hls-js');
        expect(playbackMode({ url: 'https://media/x/master.m3u8' }, true)).toBe('hls-native');
        expect(playbackMode({ url: 'https://media/x/720p.mp4' }, false)).toBe('progressive');
    });

    /**
     * The sniff reads the PATH, not the whole string. A query string is exactly where a delivery
     * layer puts things -- a presigned signature today, a scoped token tomorrow -- so a naive
     * `includes('.m3u8')` would call a progressive MP4 an HLS stream the moment one of those
     * mentioned a playlist, and hand it to hls.js, which plays nothing.
     */
    it('ignores the query string when sniffing', () => {
        expect(playbackMode({ url: 'https://media/x/720p.mp4?from=master.m3u8' }, false))
            .toBe('progressive');
        expect(playbackMode({ url: 'https://media/x/master.m3u8?e=1&t=abc' }, false))
            .toBe('hls-js');
    });

    it('trusts the reported format over the file extension', () => {
        // The extension is a heuristic and the backend's answer is not. A signed URL can carry
        // arbitrary query parameters after the key, and a future delivery change could put the
        // key somewhere the extension is not the last thing in the string.
        expect(playbackMode({ url: 'https://media/x/master.m3u8?e=1&t=abc', format: 'hls' }, false))
            .toBe('hls-js');
    });

    it('is progressive before anything has arrived, rather than throwing', () => {
        // The component renders a placeholder until the URL resolves, but this runs on every
        // render including those — so undefined has to be an answer, not an exception.
        expect(playbackMode(undefined, false)).toBe('progressive');
        expect(playbackMode(null, true)).toBe('progressive');
        expect(playbackMode({}, false)).toBe('progressive');
    });
});
