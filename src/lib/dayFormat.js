import { currentLocaleInfo } from '@/i18n';

/**
 * A calendar day the backend sent ('YYYY-MM-DD', the reader's learning day) as the reader reads
 * it. Formatted at noon UTC in UTC, so no zone can move it to the day before or after — the date
 * is already the reader's own and must not be converted again.
 */
export function formatDay(iso, options = { day: 'numeric', month: 'long' }, calendar = 'gregory') {
    if (!iso) return '';
    const [year, month, day] = iso.split('-').map(Number);
    try {
        return new Intl.DateTimeFormat(`${currentLocaleInfo().numberFormat}-u-ca-${calendar}`, { ...options, timeZone: 'UTC' })
            .format(new Date(Date.UTC(year, month - 1, day, 12)));
    } catch {
        return iso;
    }
}

/** «السبت», "Sat" — a day's name under its star. */
export const weekdayName = (iso, width = 'short') => formatDay(iso, { weekday: width });

/** Whole days from `from` to `to`, both 'YYYY-MM-DD'. */
export const daysBetween = (from, to) =>
    Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);

/** The reader's local calendar day, 'YYYY-MM-DD' — the seed that keeps a text the same all day. */
export const localDay = (now = new Date()) =>
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
