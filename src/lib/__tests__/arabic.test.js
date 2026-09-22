import { describe, expect, it } from 'vitest';
import { normalizeArabic } from '@/lib/arabic';

/**
 * <b>These cases are the backend's `absarna_normalize_arabic`, restated.</b> That function is what
 * every server-side search normalises through; this is the same rule for the one search that never
 * reaches a server — the PDF reader's, which matches text extracted in the reader's own browser.
 *
 * <p>If the SQL changes, change it there first and follow here. Two searches on one platform that
 * disagree about whether «إسلامية» matches «اسلامية» would be worse than either rule alone.
 */
describe('normalizeArabic', () => {
    it('folds all four alefs together', () => {
        // أ إ آ ٱ are one letter to anybody typing a query.
        expect(normalizeArabic('أحمد')).toBe('احمد');
        expect(normalizeArabic('إسلام')).toBe('اسلام');
        expect(normalizeArabic('آمن')).toBe('امن');
        expect(normalizeArabic('ٱلله')).toBe('الله');
    });

    it('folds alef maqsura into ya and ta marbuta into ha', () => {
        expect(normalizeArabic('مصطفى')).toBe('مصطفي');
        expect(normalizeArabic('إسلامية')).toBe('اسلاميه');
    });

    it('drops every mark the backend drops', () => {
        // Tashkeel, shadda, sukun, superscript alef — a reader types none of them.
        expect(normalizeArabic('مُحَمَّد')).toBe('محمد');
        expect(normalizeArabic('كِتَابٌ')).toBe('كتاب');
        expect(normalizeArabic('هَٰذَا')).toBe('هذا');
    });

    it('drops the tatweel, which is a typesetter\'s stretch and not a letter', () => {
        expect(normalizeArabic('مــــحمد')).toBe('محمد');
    });

    it('lower-cases, so a Latin word in an Arabic book still matches', () => {
        expect(normalizeArabic('PDF')).toBe('pdf');
    });

    /**
     * The one rule that is NOT in the SQL, and the reason the PDF search needed its own copy at
     * all: a PDF's text layer often carries pre-shaped presentation forms rather than ordinary
     * letters, and nothing in the fold above would bring those together with what a reader types.
     */
    it('brings presentation forms back to ordinary letters', () => {
        // U+FEFB, "lam with alef" as one pre-shaped glyph.
        expect(normalizeArabic('ﻻ')).toBe('لا');
        // U+FEDF/U+FE8E, isolated/final forms of lam and alef.
        expect(normalizeArabic('ﻟﺎ')).toBe('لا');
    });

    it('is total, so a caller need not guard', () => {
        expect(normalizeArabic(null)).toBe('');
        expect(normalizeArabic(undefined)).toBe('');
        expect(normalizeArabic('')).toBe('');
        expect(normalizeArabic(123)).toBe('123');
    });

    it('is idempotent, since the search normalises both sides independently', () => {
        const once = normalizeArabic('الإسلاميَّة');
        expect(normalizeArabic(once)).toBe(once);
    });
});
