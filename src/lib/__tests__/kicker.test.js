import { describe, expect, it } from 'vitest';
import { videoKicker } from '@/lib/kicker';

/**
 * The line above a card's title. What must hold: the number is the backend's public position,
 * not the owner's sort key; a row with no public position never claims one; and the owner's own
 * words keep their digits while the app's numbers take the locale's.
 */
describe('videoKicker', () => {
    const lecture = { seriesId: 7, seriesTitle: 'السيرة النبوية | 102', seriesPosition: 103, seriesLength: 140 };

    it('names the series and the place in it, in the locale\'s digits', () => {
        const kicker = videoKicker(lecture);
        expect(kicker.seriesId).toBe(7);
        expect(kicker.text).toContain('١٠٣');
        expect(kicker.text).toContain('١٤٠');
    });

    it('leaves the owner\'s own digits alone', () => {
        // «| 102» is part of a title someone typed; only the counted numbers are localised.
        expect(videoKicker(lecture).text).toContain('السيرة النبوية | 102');
    });

    it('ignores orderInSeries, a sort key a reader never counts', () => {
        const spaced = { seriesId: 7, seriesTitle: 'الورقات', orderInSeries: 70 };
        expect(videoKicker(spaced).text).toBe('الورقات');
    });

    it('gives an owner\'s hidden row its series but no number', () => {
        const hidden = { seriesId: 7, seriesTitle: 'الورقات', seriesPosition: null, seriesLength: null };
        expect(videoKicker(hidden)).toEqual({ text: 'الورقات', seriesId: 7 });
    });

    it('falls back to the category, which links nowhere', () => {
        expect(videoKicker({ category: 'سيرة' })).toEqual({ text: 'سيرة', seriesId: null });
    });

    it('draws no line for a video with neither', () => {
        expect(videoKicker({})).toBeNull();
    });
});
