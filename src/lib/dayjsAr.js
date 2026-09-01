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

export default dayjs;
