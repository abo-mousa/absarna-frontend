import { describe, expect, it } from 'vitest';
import { videoPageHref } from '@/components/channel/tabs/VideosTab';

/** Which rows in the owner's video list link to the public page. */
describe('videoPageHref', () => {
    it('links a video that can play', () => {
        expect(videoPageHref({ id: 42, status: 'READY' })).toBe('/video/42');
    });

    it('links a held or hidden video too — its page tells the owner why nobody else sees it', () => {
        expect(videoPageHref({ id: 7, status: 'READY', visible: false })).toBe('/video/7');
        expect(videoPageHref({ id: 8, status: 'READY', review: [{ holds: true }] })).toBe('/video/8');
    });

    it('does not link a video with nothing to play yet', () => {
        // Its page would open on a player with no source.
        expect(videoPageHref({ id: 1, status: 'UPLOADED' })).toBeNull();
        expect(videoPageHref({ id: 2, status: 'FAILED' })).toBeNull();
        expect(videoPageHref({ id: 3 })).toBeNull();
    });
});
