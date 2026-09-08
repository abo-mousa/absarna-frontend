import { describe, expect, it } from 'vitest';
import { watchThreshold } from '@/components/content/VideoPlayer';

/**
 * The arithmetic behind "the video is never added to my watch history".
 *
 * <p>It is consulted from four separate report paths — the throttled `timeupdate`, pause/ended,
 * the unmount flush and the `pagehide` beacon — across two player implementations, and **none of
 * them makes it visible in a rendered page**. A wrong threshold does not fail; it silently drops
 * progress writes, and "continue watching" is simply empty for the videos it affects.
 */
describe('watchThreshold', () => {
    it('is the flat 5s floor for an ordinary lecture', () => {
        expect(watchThreshold(45 * 60)).toBe(5);
        expect(watchThreshold(50)).toBe(5);
    });

    it('scales down for a short clip, where 5s would be a large share of the whole thing', () => {
        // 10% of the clip: 1.3s of a 13-second clip, not 5s — which would be 38% of it, so a
        // viewer who watched a third of the clip got no history entry at all.
        expect(watchThreshold(13)).toBeCloseTo(1.3, 5);
        expect(watchThreshold(20)).toBe(2);
    });

    it('never drops below 1s, however short the source', () => {
        // 10% of a 2-second clip is 0.2s, which is indistinguishable from a mis-tap.
        expect(watchThreshold(2)).toBe(1);
        expect(watchThreshold(0.5)).toBe(1);
    });

    it('falls back to the flat floor for a duration the player has not resolved', () => {
        // What `video.duration` actually reports before metadata loads, and for a live stream.
        expect(watchThreshold(NaN)).toBe(5);
        expect(watchThreshold(Infinity)).toBe(5);
        expect(watchThreshold(0)).toBe(5);
        expect(watchThreshold(-1)).toBe(5);
        expect(watchThreshold(undefined)).toBe(5);
        expect(watchThreshold(null)).toBe(5);
    });

    it('never exceeds the flat floor, which is what makes it a floor and not a fraction', () => {
        for (const duration of [1, 13, 60, 600, 7200]) {
            expect(watchThreshold(duration)).toBeLessThanOrEqual(5);
        }
    });
});
