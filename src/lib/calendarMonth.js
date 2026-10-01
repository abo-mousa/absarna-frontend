/**
 * The arithmetic behind `ui/CalendarPicker`: calendar months in either calendar the app shows —
 * Umm al-Qura Hijri, as `DatePair` and `hijriSeasons` read it, or Gregorian — as lists of plain
 * 'YYYY-MM-DD' days. Everything is a Gregorian ISO day underneath, because that is what the
 * backend stores; the Hijri calendar is only ever a way of reading one.
 *
 * <p>Read through `Intl` at noon UTC, in UTC, so no zone moves a day — the same rule `formatDay`
 * follows. A Hijri month is found by walking days rather than computed: Umm al-Qura months are
 * set by observation tables, not by a formula worth reimplementing.
 */

const formatters = {};
function partsFormatter(calendar) {
    formatters[calendar] ??= new Intl.DateTimeFormat(`en-u-ca-${calendar}-nu-latn`, {
        day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
    return formatters[calendar];
}

const toDate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12));
};

/** `iso` moved by `days`. */
export const addDays = (iso, days) => {
    const date = toDate(iso);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
};

/** `{ year, month, day }` of a day in `calendar` ('islamic-umalqura' or 'gregory'). */
export function partsOf(iso, calendar) {
    const parts = Object.fromEntries(partsFormatter(calendar).formatToParts(toDate(iso)).map((p) => [p.type, p.value]));
    return { year: Number.parseInt(parts.year, 10), month: Number(parts.month), day: Number(parts.day) };
}

/** Every day of the `calendar` month that `iso` falls in, first to last. */
export function monthDays(iso, calendar) {
    const { month } = partsOf(iso, calendar);
    let first = iso;
    while (partsOf(addDays(first, -1), calendar).month === month) first = addDays(first, -1);
    const days = [first];
    while (partsOf(addDays(days[days.length - 1], 1), calendar).month === month) days.push(addDays(days[days.length - 1], 1));
    return days;
}

/** A day in the month before (`-1`) or after (`1`) the one `iso` falls in. */
export function shiftMonth(iso, calendar, direction) {
    const days = monthDays(iso, calendar);
    return direction < 0 ? addDays(days[0], -1) : addDays(days[days.length - 1], 1);
}

/** Its column in a week that starts on Saturday, as «أسبوعك» does: Saturday 0 … Friday 6. */
export const weekColumn = (iso) => (toDate(iso).getUTCDay() + 1) % 7;

/** Seven days from a Saturday, for the weekday header. */
export const aWeekFromSaturday = () => {
    const saturday = '2026-10-03';
    return Array.from({ length: 7 }, (_, i) => addDays(saturday, i));
};
