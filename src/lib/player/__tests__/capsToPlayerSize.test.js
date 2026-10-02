import { describe, expect, it } from 'vitest';
import { capsToPlayerSize } from '@/lib/player/quality';

/**
 * A 720p lecture on a 1× monitor played at 480p because the size cap reads device pixels; the
 * cap is kept only for ladders with something above 720p to save.
 */
describe('capsToPlayerSize', () => {
    it('lets a 720p ladder play its top rung in a small player', () => {
        expect(capsToPlayerSize([{ width: 1280, height: 720 }, { width: 854, height: 480 }])).toBe(false);
        expect(capsToPlayerSize([{ width: 854, height: 480 }])).toBe(false);
    });

    it('keeps the cap where there is a 1080p rung to hold back', () => {
        expect(capsToPlayerSize([{ width: 1920, height: 1080 }, { width: 1280, height: 720 }])).toBe(true);
    });

    it('reads the short side, so a portrait 720p is a 720p', () => {
        expect(capsToPlayerSize([{ width: 720, height: 1280 }])).toBe(false);
        expect(capsToPlayerSize([{ width: 1080, height: 1920 }])).toBe(true);
    });

    it('keeps the library default when the manifest names no sizes', () => {
        expect(capsToPlayerSize([])).toBe(true);
        expect(capsToPlayerSize([{ bitrate: 64000 }])).toBe(true);
    });
});
