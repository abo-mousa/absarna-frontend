import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

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

// Shared "2 days ago" / "1 month ago" convention for date-only fields (publishDate, a `LocalDate`
// with no time-of-day) across every card/detail page that shows one — relative under a week old,
// an absolute date past that, same threshold CommentsSection already uses for comment timestamps
// (that one keeps a time-of-day since comments have one; this doesn't, since publish dates don't).
export function formatPublishDate(dateStr) {
    if (!dateStr) return '';
    const date = dayjs(dateStr);
    if (!date.isValid()) return '';
    // Both branches carry the locale. Only the relative one did, so anything older than a week
    // fell back to dayjs's default locale and printed its month in English — "17 June 2007" in the
    // middle of an otherwise Arabic card. Invisible while the catalogue was days old; every
    // imported video is older than a week.
    const localised = date.locale('ar-latn');
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
