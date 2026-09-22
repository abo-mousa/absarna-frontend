import { afterEach, describe, expect, it } from 'vitest';
import { formatCount } from '@/lib/numbers';
import { setActiveLocale } from '@/i18n';

/**
 * Counts, in each locale's own digits and grouping.
 *
 * <p>This is the "magnitude" half of the digits rule — `Intl` brings the digits AND the separator
 * together, so Arabic gets «١٬٩٤٣» with U+066C rather than Arabic digits wearing a Latin comma.
 * The other half is `t()`, which localises a numeric placeholder without grouping, because a page
 * number or a year must not come out as «٢٬٠٢٦».
 */
describe('formatCount', () => {
    afterEach(() => setActiveLocale('ar'));

    it('groups and localises for the active locale', () => {
        setActiveLocale('ar');
        expect(formatCount(1943)).toBe('١٬٩٤٣');
        setActiveLocale('en');
        expect(formatCount(1943)).toBe('1,943');
    });

    /**
     * The formatter is cached per locale tag. A single module-level one would format every locale
     * as whichever loaded first — the bug the per-tag key exists to make impossible — while
     * building one per call costs an `Intl.NumberFormat` construction on every count of every card.
     */
    it('does not leak a cached formatter between locales', () => {
        setActiveLocale('ar');
        expect(formatCount(1943)).toBe('١٬٩٤٣');
        setActiveLocale('en');
        expect(formatCount(1943)).toBe('1,943');
        // Back again, now that both are cached.
        setActiveLocale('ar');
        expect(formatCount(1943)).toBe('١٬٩٤٣');
    });

    it('renders nothing rather than NaN for a value that is not a number', () => {
        // A card missing a count should show nothing, not a bug.
        expect(formatCount(null)).toBe('');
        expect(formatCount(undefined)).toBe('');
        expect(formatCount('')).toBe('');
        expect(formatCount('abc')).toBe('');
    });

    it('treats zero as a number', () => {
        expect(formatCount(0)).toBe('٠');
    });
});
