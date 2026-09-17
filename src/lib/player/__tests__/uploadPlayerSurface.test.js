import { describe, expect, it } from 'vitest';
import { uploadPlayerSurface } from '@/lib/player/playback';

/**
 * Which of the player's three surfaces one of our own uploads gets.
 *
 * <p>The case this exists for is the one that had no surface at all. `playback-url` is queried
 * with `retry: false` — a 404 there means "not visible to you" and retrying cannot change it — so
 * a 5xx or a dropped connection settles immediately into `isLoading: false` with no data, which
 * is indistinguishable from "the URL has not arrived yet" unless the error is read first. It was
 * not, and the player showed a pulsing black rectangle for as long as the page stayed open.
 */
describe('uploadPlayerSurface', () => {
    const state = (over) => uploadPlayerSurface({
        urlFailed: false, hlsGaveUp: false, urlLoading: false, playbackUrl: null, ...over,
    });

    it('plays once there is a URL', () => {
        expect(state({ playbackUrl: 'https://media.example/v2-abc/master.m3u8' })).toBe('ready');
    });

    it('waits while the URL is being minted', () => {
        expect(state({ urlLoading: true })).toBe('loading');
        // Settled, no error, no URL yet — the render between the query resolving and the data
        // reaching this component.
        expect(state({})).toBe('loading');
    });

    it('reports a failed mint instead of waiting for it forever', () => {
        // The reported bug, exactly: the query has failed and will not be retried, so `urlLoading`
        // is false and `playbackUrl` is null — the two conditions the old check read as "loading".
        expect(state({ urlFailed: true })).toBe('failed');
    });

    it('reports a player that destroyed itself', () => {
        // hls.js past its refresh budget. The URL is perfectly good and present, which is why this
        // cannot be inferred from the query at all — what is broken is the instance attached to
        // the <video>, and the poster it leaves behind looks like a video waiting to be played.
        expect(state({ hlsGaveUp: true, playbackUrl: 'https://media.example/v2-abc/master.m3u8' }))
            .toBe('failed');
    });

    it('prefers the error over the placeholder when a retry is in flight', () => {
        // Pressing retry refetches, so `urlLoading` goes true again with the failure still set.
        // Flipping back to the skeleton would take the button away mid-press and, if the retry
        // fails too, flicker between the two.
        expect(state({ urlFailed: true, urlLoading: true })).toBe('failed');
    });
});
