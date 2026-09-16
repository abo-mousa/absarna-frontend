import { describe, expect, it } from 'vitest';
import { seriesVisibility } from '@/components/channel/SeriesBrowser';

/** What an owner's series row says about who can see it, and so which action it offers. */
describe('seriesVisibility', () => {
    it('is hidden only when every video in it is', () => {
        expect(seriesVisibility({ contentCount: 3, hiddenCount: 3 })).toBe('hidden');
    });

    it('is partial when some are hidden — and still offers "hide", since some are public', () => {
        expect(seriesVisibility({ contentCount: 3, hiddenCount: 1 })).toBe('partial');
    });

    it('is visible when none are hidden', () => {
        expect(seriesVisibility({ contentCount: 3, hiddenCount: 0 })).toBe('visible');
        expect(seriesVisibility({ contentCount: 3 })).toBe('visible');
    });

    it('is empty with no videos, where hiding or showing would do nothing', () => {
        expect(seriesVisibility({ contentCount: 0, hiddenCount: 0 })).toBe('empty');
        expect(seriesVisibility({})).toBe('empty');
    });
});
