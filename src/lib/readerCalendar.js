import { hasHijriCalendar } from './hijriSeasons';
import { formatDay } from './dayFormat';
import { safeStorage } from './safeStorage';
import { currentLocale } from '@/i18n';

/**
 * The calendar a reader reads dates in: what they last chose in `ui/CalendarPicker` («هجري |
 * ميلادي»), else Hijri for an Arabic reader and Gregorian otherwise. One reading for the picker
 * and for every date the goal screens say back — a day picked as «٢٩ شعبان» was read back as
 * "7 February" on the chip beside it, because the chips formatted in Gregorian unconditionally.
 */
export const HIJRI = 'islamic-umalqura';
export const GREGORY = 'gregory';
export const CALENDAR_KEY = 'absarna.calendar';

export function readerCalendar() {
    if (!hasHijriCalendar()) return GREGORY;
    const stored = safeStorage.getItem(CALENDAR_KEY);
    if (stored === HIJRI || stored === GREGORY) return stored;
    return currentLocale() === 'ar' ? HIJRI : GREGORY;
}

/** The calendar the reader does NOT read in — for a date said in both. */
export const otherCalendar = (calendar = readerCalendar()) => (calendar === HIJRI ? GREGORY : HIJRI);

/** `formatDay` in the reader's calendar. */
export const formatReaderDay = (iso, options = { day: 'numeric', month: 'long' }) => formatDay(iso, options, readerCalendar());
