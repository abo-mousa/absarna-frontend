import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { displayDate, formatHijriDate, formatPublishDate, parseTimestamp } from '@/lib/datetime';

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

    it('never turns a date with no time in it into an hour count', () => {
        // The bug someone saw on their own upload: `publishDate` is a backend LocalDate —
        // "2026-09-18", a day and nothing else — and dayjs parses that as local MIDNIGHT, so
        // fromNow() answered with the hours since then. A video uploaded this afternoon read
        // «منذ 15 ساعات», and one uploaded five minutes before midnight would have read «منذ 23
        // ساعات». The number was never the upload time; it was the time of day, backwards.
        expect(formatPublishDate('2026-09-08')).toBe('اليوم');
        expect(formatPublishDate('2026-09-08')).not.toMatch(/ساع/);
    });

    it('says how many minutes ago for a publication moment, read as UTC', () => {
        // 20 minutes before the fake clock's 12:00Z, sent zoneless as the backend writes it.
        // Read as local time this would be hours off anywhere but UTC.
        expect(formatPublishDate('2026-09-08T11:40:00')).toBe('منذ ٢٠ دقائق');
    });

    it('says yesterday rather than counting hours across one midnight', () => {
        // 30 hours and 20 hours are both "أمس" to a reader, and a date cannot tell them apart
        // anyway.
        expect(formatPublishDate('2026-09-07')).toBe('أمس');
    });

    it('falls back to the absolute date for a publish date in the future', () => {
        // Bad data — a wrong timezone on an import, a mistyped year. «بعد يومين» on a video that
        // is already playing reads as a broken page; the date reads as a mistake in the data,
        // which is what it is.
        expect(formatPublishDate('2026-09-20')).toBe('٢٠ سبتمبر ٢٠٢٦');
    });

    it('is relative for something published in the last week', () => {
        // The branch, not dayjs's own pluralisation: how many days it rounds to depends on the
        // running machine's timezone, which is not what this is pinning.
        expect(formatPublishDate('2026-09-06')).toMatch(/^منذ /);
    });

    it('is an absolute date past a week', () => {
        expect(formatPublishDate('2026-06-17')).toBe('١٧ يونيو ٢٠٢٦');
    });

    it('names the month in Arabic on the absolute branch too', () => {
        // The regression: only the relative branch carried .locale('ar-latn'), so this printed
        // "17 June 2007". Asserted against the whole string rather than a contains, because an
        // English month is a substring failure, not a missing one.
        expect(formatPublishDate('2007-06-17')).toBe('١٧ يونيو ٢٠٠٧');
        expect(formatPublishDate('2011-01-05')).toBe('٥ يناير ٢٠١١');
    });

    /**
     * <b>The reverse of what this file used to assert.</b> It once pinned Latin digits here, to
     * end an era when counts were Arabic-Indic and dates were not; the mixture was the bug, and the
     * app now reads in Arabic digits throughout. What must not come back is a screen with both.
     *
     * <p>The `postformat` doing this is dead code without `dayjs/plugin/preParsePostFormat` — dayjs
     * core never calls it — and the failure is silent, so it is worth a test of its own: the month
     * name would still be right and only the digits would stay Latin.
     */
    it('reads in Arabic digits, which needs the preParsePostFormat plugin', () => {
        expect(formatPublishDate('2007-06-17')).toMatch(/[٠-٩]/);
        expect(formatPublishDate('2007-06-17')).not.toMatch(/[0-9]/);
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
        expect(formatPublishDate('2026-08-31')).toBe('٣١ أغسطس ٢٠٢٦');
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

    it('prefers the publication moment, which carries the time of day', () => {
        expect(displayDate({ publishedAt: '2026-09-19T08:14:03', originalPublishDate: '2026-09-19', publishDate: '2026-09-25' }))
            .toBe('2026-09-19T08:14:03');
    });

    it('is null when there is no date at all, not undefined', () => {
        expect(displayDate({})).toBeNull();
        expect(displayDate(null)).toBeNull();
        expect(displayDate(undefined)).toBeNull();
    });
});

/**
 * Reading a timestamp that does not say what zone it is in.
 *
 * <p>`createdAt` is a LocalDateTime on the backend, so Jackson writes it with no `Z` and no
 * offset, and both `Date` and dayjs read that as the READER'S local time. The servers run UTC --
 * the deployment runbook sets it on all three boxes so the logs and metrics can be joined -- so
 * every timestamp arrived shifted by the reader's own offset: a comment posted a moment ago read
 * «منذ ساعتين» in Berlin, «منذ 3 ساعات» in Cairo, and «بعد 5 ساعات» in São Paulo.
 *
 * <p>The bug is invisible on any machine whose clock agrees with the server's, which is every CI
 * runner and anyone who happens to work in UTC. Hence a test that states the instant rather than
 * trusting the environment.
 */
describe('parseTimestamp', () => {
    it('reads a timestamp with no zone as UTC', () => {
        // The backend's own format, and the exact case that made a fresh comment two hours old.
        expect(parseTimestamp('2026-09-18T14:03:21.482').toISOString())
            .toBe('2026-09-18T14:03:21.482Z');
        expect(parseTimestamp('2026-09-18T14:03:21').toISOString())
            .toBe('2026-09-18T14:03:21.000Z');
        expect(parseTimestamp('2026-09-18T14:03').toISOString())
            .toBe('2026-09-18T14:03:00.000Z');
    });

    it('leaves a timestamp that already names its zone alone', () => {
        // What keeps this safe to hold on to: the day the backend sends an Instant, the `Z`
        // answers the question and this function stops guessing. An offset counts as an answer
        // too -- appending a second zone to one would throw the instant out by hours.
        expect(parseTimestamp('2026-09-18T14:03:21Z').toISOString())
            .toBe('2026-09-18T14:03:21.000Z');
        expect(parseTimestamp('2026-09-18T16:03:21+02:00').toISOString())
            .toBe('2026-09-18T14:03:21.000Z');
    });

    it('is an invalid date for nothing at all, rather than the epoch or now', () => {
        // Both callers check isValid() and render an empty string; "1 يناير 1970" under a comment
        // would be worse than no date, and today's date would be a lie.
        expect(parseTimestamp(null).isValid()).toBe(false);
        expect(parseTimestamp('').isValid()).toBe(false);
        expect(parseTimestamp('not a date').isValid()).toBe(false);
    });
});

/**
 * The navbar's Hijri date. The property worth pinning is the one-script rule: a date the app
 * formats reads entirely in the locale's digits, so the Arabic build must not print «14» inside
 * «ربيع الآخر», and the English one must not print «١٤٤٨».
 */
describe('formatHijriDate', () => {
    // Midday UTC, so the day is the same in every zone a CI runner or a laptop could be in.
    const friday = new Date('2026-09-25T12:00:00Z');

    it('reads the Umm al-Qura date in Arabic-Indic digits in the Arabic build', () => {
        const text = formatHijriDate(friday, 'ar-EG');
        expect(text).toContain('ربيع الآخر');
        expect(text).toContain('١٤٤٨');
        expect(text).not.toMatch(/[0-9]/);
    });

    it('and in Latin digits in the English one', () => {
        const text = formatHijriDate(friday, 'en-US');
        expect(text).toContain('1448');
        expect(text).not.toMatch(/[٠-٩]/);
    });

    it('shows nothing rather than a wrong date when the runtime cannot format it', () => {
        expect(formatHijriDate(friday, 'not a locale!')).toBe('');
    });
});
