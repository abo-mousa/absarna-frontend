import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { displayDate, formatPublishDate } from '@/lib/dayjsAr';

/**
 * Both functions here exist because of a bug a reader saw on every card, and neither had a test.
 *
 * `formatPublishDate` carried the locale on only one of its two branches, so anything older than
 * a week fell back to dayjs's default and printed its month in English — "17 June 2007" in the
 * middle of an otherwise Arabic card. Invisible while the catalogue was days old; every imported
 * video is older than a week, so the first YouTube import made it the common case.
 *
 * `displayDate` exists because `publishDate` means "when this landed on the platform", which is
 * the right thing to sort on and the wrong thing to show. An import stamps a whole back catalogue
 * with one day, so nineteen years of lectures all read "منذ ١٩ ساعة".
 */
describe('formatPublishDate', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-09-08T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('is relative for something published in the last week', () => {
        // The branch, not dayjs's own pluralisation: how many days it rounds to depends on the
        // running machine's timezone, which is not what this is pinning.
        expect(formatPublishDate('2026-09-06')).toMatch(/^منذ /);
    });

    it('is an absolute date past a week', () => {
        expect(formatPublishDate('2026-06-17')).toBe('17 يونيو 2026');
    });

    it('names the month in Arabic on the absolute branch too', () => {
        // The regression: only the relative branch carried .locale('ar-latn'), so this printed
        // "17 June 2007". Asserted against the whole string rather than a contains, because an
        // English month is a substring failure, not a missing one.
        expect(formatPublishDate('2007-06-17')).toBe('17 يونيو 2007');
        expect(formatPublishDate('2011-01-05')).toBe('5 يناير 2011');
    });

    it('keeps Latin digits, unlike dayjs\'s own ar locale', () => {
        // dayjs's bundled 'ar' postformats to Arabic-Indic (١٢٣), which is what made durations,
        // subscriber counts and publish dates disagree with each other across the app.
        expect(formatPublishDate('2007-06-17')).toMatch(/\d/);
        expect(formatPublishDate('2007-06-17')).not.toMatch(/[٠-٩]/);
    });

    it('is empty rather than "Invalid Date" for something unparseable', () => {
        expect(formatPublishDate('not a date')).toBe('');
    });

    it('is empty for a missing date, so a card renders nothing instead of a placeholder', () => {
        expect(formatPublishDate(null)).toBe('');
        expect(formatPublishDate(undefined)).toBe('');
        expect(formatPublishDate('')).toBe('');
    });

    it('treats the seven-day boundary as the switch to absolute', () => {
        // Six days is still relative; eight is not. The exact boundary matters only because
        // CommentsSection uses the same threshold and the two must agree.
        expect(formatPublishDate('2026-09-02')).toMatch(/^منذ/);
        expect(formatPublishDate('2026-08-31')).toBe('31 أغسطس 2026');
    });
});

describe('displayDate', () => {
    it('prefers the original publish date, which is what a reader is asking for', () => {
        expect(displayDate({ publishDate: '2026-09-07', originalPublishDate: '2007-06-17' }))
            .toBe('2007-06-17');
    });

    it('falls back to the platform date for content that originated here', () => {
        // Null for platform-native content, where the two are the same thing.
        expect(displayDate({ publishDate: '2026-09-07', originalPublishDate: null }))
            .toBe('2026-09-07');
        expect(displayDate({ publishDate: '2026-09-07' })).toBe('2026-09-07');
    });

    it('is null when there is no date at all, not undefined', () => {
        expect(displayDate({})).toBeNull();
        expect(displayDate(null)).toBeNull();
        expect(displayDate(undefined)).toBeNull();
    });
});
