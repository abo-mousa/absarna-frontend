import { describe, expect, it } from 'vitest';
import { SACRED_TEXTS, TEXT_CONTEXTS, pickText, textsFor } from '@/lib/sacredTexts';
import SOURCES from '@/lib/__fixtures__/sacredTextSources.json';

/**
 * The texts are the Qur'an and hadith: a wording that is almost right is wrong. These pin every
 * excerpt, Arabic and English, as a verbatim piece of the source it names — the full texts kept in
 * the fixture — so an edit by hand to `sacredTexts.js` that drifts from the source fails here.
 */
const joined = (text, lang) => text.sourceKeys
    .map((key) => SOURCES[key][lang])
    .join(lang === 'ar' ? ' ۝ ' : ' ');

describe('SACRED_TEXTS', () => {
    it.each(SACRED_TEXTS.map((text) => [text.id, text]))('%s is a verbatim excerpt of its source', (_, text) => {
        expect(text.sourceKeys.length).toBeGreaterThan(0);
        text.sourceKeys.forEach((key) => expect(SOURCES[key], key).toBeDefined());
        expect(joined(text, 'ar')).toContain(text.ar);
        expect(joined(text, 'en')).toContain(text.en);
    });

    it('names every text once', () => {
        const ids = SACRED_TEXTS.map((text) => text.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('says where each text comes from and whose translation it is', () => {
        SACRED_TEXTS.forEach((text) => {
            expect(text.refLabel.ar, text.id).toBeTruthy();
            expect(text.refLabel.en, text.id).toBeTruthy();
            expect(text.translation, text.id).toBeTruthy();
            if (text.kind === 'HADITH') expect(text.grading.length, text.id).toBeGreaterThan(0);
        });
    });

    // The moments of PROGRESS-AND-GOALS.md §8.1, restated on purpose: a text deleted from the
    // catalogue would otherwise leave a screen asking for a moment nothing answers, silently.
    const MOMENTS = [
        'consistency', 'capacity', 'slots', 'slotsInsight', 'intention', 'start', 'morning', 'qada',
        'fallback', 'rest', 'lighten', 'excuse', 'returning', 'portionDone', 'weekDone', 'gradual',
        'review', 'completion', 'milestones', 'milestoneReached', 'dailyVerse', 'benefits',
    ];

    it.each(MOMENTS)('has a text for readers at the moment %s', (moment) => {
        expect(textsFor(moment).length).toBeGreaterThan(0);
        expect(TEXT_CONTEXTS).toContain(moment);
    });

});

describe('pickText', () => {
    it('gives the same text for the same moment and day', () => {
        expect(pickText('consistency', '2026-09-27')).toBe(pickText('consistency', '2026-09-27'));
    });

    it('narrows to a kind when asked', () => {
        expect(pickText('completion', '2026-09-27', 'AYAH').kind).toBe('AYAH');
        expect(pickText('completion', '2026-09-27', 'HADITH').kind).toBe('HADITH');
    });

    it('never returns a text kept for the team rather than the reader', () => {
        expect(pickText('principle', '2026-09-27')).toBeNull();
        expect(pickText('companion', '2026-09-27')).toBeNull();
    });

    it('returns nothing for a moment it does not know', () => {
        expect(pickText('no-such-moment', '2026-09-27')).toBeNull();
    });
});
