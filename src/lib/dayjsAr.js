import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { t } from '@/i18n';

dayjs.extend(relativeTime);

// Registered as a named locale (the trailing `true` keeps it from becoming dayjs's *global*
// default, so unrelated dayjs() calls elsewhere aren't affected) — call .locale('ar-latn')
// explicitly wherever it's needed. Deliberately not dayjs's own bundled 'ar' locale: that one's
// `postformat` swaps digits to Arabic-Indic (١٢٣...), which is what created the inconsistency
// this fixes — durations/subscriber counts/publish dates elsewhere in the app all use Latin
// digits, per CLAUDE.md's UX review ("ar-EG date formatting renders Arabic-Indic digits").
dayjs.locale(
    'ar-latn',
    {
        name: 'ar-latn',
        months: 'يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر'.split('_'),
        weekdays: 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split('_'),
        weekStart: 6,
        relativeTime: {
            future: 'بعد %s',
            past: 'منذ %s',
            s: 'ثوانٍ',
            m: 'دقيقة',
            mm: '%d دقائق',
            h: 'ساعة',
            hh: '%d ساعات',
            d: 'يوم',
            dd: '%d أيام',
            M: 'شهر',
            MM: '%d أشهر',
            y: 'سنة',
            yy: '%d سنوات',
        },
    },
    true
);

/** A backend `LocalDate` — a day with no time-of-day in it. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A timestamp that names no zone: `2026-09-18T14:03:21` or `...21.482`, and nothing after it. */
const ZONELESS_TIMESTAMP = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/**
 * Parses a timestamp the backend sent, reading one that names no zone as UTC.
 *
 * <p><b>Why this is not the browser's job to guess.</b> `createdAt` is a `LocalDateTime` on the
 * backend and Jackson writes it with no `Z` and no offset — `"2026-09-18T14:03:21.482"` — which
 * `Date` and dayjs both read as the READER'S local time. The servers are set to UTC (the
 * deployment runbook does it on all three boxes so Loki and Prometheus can join on timestamps), so
 * every timestamp arrived shifted by the reader's own offset: a comment posted a moment ago read
 * «منذ ساعتين» in Berlin and «منذ 3 ساعات» in Cairo, and one posted at 23:30 UTC was dated
 * tomorrow for nobody and yesterday for some.
 *
 * <p>Anything that DOES name a zone is left alone, which is what makes this safe to keep once the
 * backend starts sending an `Instant`: a `Z` or an offset already answers the question, and this
 * function stops guessing the moment it is given the answer.
 *
 * <p>Exported and tested because the whole bug is invisible on a machine whose clock agrees with
 * the server's — which is every CI runner, and the laptop of anyone who happens to work in UTC.
 */
export function parseTimestamp(value) {
    if (!value) return dayjs(null);
    const raw = String(value).trim();
    return dayjs(ZONELESS_TIMESTAMP.test(raw) ? `${raw}Z` : raw);
}

/**
 * Shared "2 days ago" / "1 month ago" convention for the publish dates on every card and detail
 * page — relative under a week old, an absolute date past that, the same threshold
 * `CommentsSection` uses for comment timestamps (that one keeps a time-of-day, since a comment has
 * one).
 *
 * <p><b>A date is not a timestamp, and this is where that stopped being a detail.</b>
 * `publishDate` and `originalPublishDate` are `LocalDate` on the backend: `"2026-09-18"`, a day
 * and nothing else. `dayjs` parses that as local MIDNIGHT, and `fromNow()` then answers with the
 * hours since it — so a video uploaded this afternoon read «منذ 15 ساعات», and one uploaded five
 * minutes ago at 23:55 would have read «منذ 23 ساعات». The number is not the upload time at all;
 * it is the time of day, counted backwards.
 *
 * <p>So a date-only value never produces an hour count. It can honestly say «اليوم», «أمس» and
 * «منذ 3 أيام», because those are answers a day supports — and nothing finer, because the
 * information is not there. A value that DOES carry a time (nothing sends one today, but the
 * function is shared and shaped to take one) keeps the old behaviour.
 *
 * <p>Both branches carry the locale. Only the relative one did once, so anything older than a week
 * fell back to dayjs's default and printed its month in English — "17 June 2007" in the middle of
 * an otherwise Arabic card.
 */
export function formatPublishDate(dateStr) {
    if (!dateStr) return '';
    const date = dayjs(dateStr);
    if (!date.isValid()) return '';
    const localised = date.locale('ar-latn');

    if (DATE_ONLY.test(String(dateStr).trim())) {
        // Whole days between two midnights, rather than hours between two instants.
        const today = dayjs().startOf('day');
        const days = today.diff(date.startOf('day'), 'day');
        // A publish date in the future is bad data — an import with a wrong timezone, a typed
        // year. «بعد يومين» on a video that is already playing reads as a broken page, where the
        // date itself reads as a mistake in the data, which is what it is.
        if (days < 0) return localised.format('D MMMM YYYY');
        if (days === 0) return t('common.today');
        if (days === 1) return t('common.yesterday');
        // From one midnight to the other, so the phrasing is dayjs's but the unit is a day: the
        // raw value here would round by hours and drift back into the bug above.
        if (days < 7) return localised.startOf('day').from(today);
        return localised.format('D MMMM YYYY');
    }

    if (dayjs().diff(date, 'day') < 7) return localised.fromNow();
    return localised.format('D MMMM YYYY');
}

export default dayjs;

/**
 * The date to show for a piece of content.
 *
 * <p>`publishDate` means "when this landed on the platform", which is the right thing for the
 * backend to sort on and the wrong thing to show a reader. A YouTube import stamps an entire back
 * catalogue with one day, so every card read "منذ ١٩ ساعة" — nineteen years of lectures all
 * claiming to be nineteen hours old. What a viewer is asking is "when was this published", and for
 * imported content the honest answer is the original date.
 *
 * <p>Null for platform-native content, where the two are the same thing and `publishDate` already
 * is the answer.
 */
export function displayDate(item) {
    return item?.originalPublishDate || item?.publishDate || null;
}
