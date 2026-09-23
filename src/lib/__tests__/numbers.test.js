import { afterEach, describe, expect, it } from 'vitest';
import { formatCount, formatCompactCount } from '@/lib/numbers';
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

/**
 * View counts at reading precision. Truncated rather than rounded, so a card never claims a
 * thousand views that have not happened yet.
 */
describe('formatCompactCount', () => {
    afterEach(() => setActiveLocale('ar'));

    it('leaves anything under a thousand exact', () => {
        setActiveLocale('en');
        expect(formatCompactCount(0)).toBe('0');
        expect(formatCompactCount(999)).toBe('999');
    });

    it('abbreviates thousands with one truncated decimal, and drops a zero decimal', () => {
        setActiveLocale('en');
        expect(formatCompactCount(1000)).toBe('1k');
        expect(formatCompactCount(1099)).toBe('1k');
        expect(formatCompactCount(1100)).toBe('1.1k');
        expect(formatCompactCount(1999)).toBe('1.9k');
        expect(formatCompactCount(10_000)).toBe('10k');
        expect(formatCompactCount(10_100)).toBe('10.1k');
        expect(formatCompactCount(999_999)).toBe('999.9k');
    });

    it('moves to millions at a million, and keeps the capital M', () => {
        setActiveLocale('en');
        expect(formatCompactCount(1_000_000)).toBe('1M');
        expect(formatCompactCount(1_250_000)).toBe('1.2M');
    });

    it("uses the locale's own digits and words in Arabic", () => {
        setActiveLocale('ar');
        expect(formatCompactCount(999)).toBe('٩٩٩');
        // A NO-BREAK space between number and word, from Intl itself: a card column can never
        // wrap «١٫١» onto one line and «ألف» onto the next.
        expect(formatCompactCount(1100)).toBe('١٫١\u00a0ألف');
        expect(formatCompactCount(10_100)).toBe('١٠٫١\u00a0ألف');
        expect(formatCompactCount(1_000_000)).toBe('١\u00a0مليون');
    });

    it('renders nothing rather than NaN for a value that is not a number', () => {
        expect(formatCompactCount(null)).toBe('');
        expect(formatCompactCount(undefined)).toBe('');
        expect(formatCompactCount('abc')).toBe('');
    });
});
