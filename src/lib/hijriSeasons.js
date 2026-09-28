/**
 * The deadlines a goal dialog offers besides a date: the seasons ahead in the Hijri calendar —
 * before Ramadan, before the ten days of Dhu al-Hijjah, the end of this month, the end of the year
 * (PROGRESS-AND-GOALS.md §7.10). Computed here with `Intl`'s Umm al-Qura calendar, as `DatePair`
 * reads it, and sent to the backend as a plain date — the server knows nothing of Hijri months.
 *
 * <p>Each is the last day BEFORE the season begins, so «قبل رمضان» ends on the 29th or 30th of
 * Sha'ban. A season less than three days away is left out (there is no portion to plan), and a
 * runtime without the calendar offers none rather than guessing.
 */
const MIN_DAYS = 3;
const HORIZON_DAYS = 400;

let formatter;
function hijriParts(date) {
    formatter ??= new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
        day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
    const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
    return { day: Number(parts.day), month: Number(parts.month), year: Number.parseInt(parts.year, 10) };
}

export function hasHijriCalendar() {
    try {
        return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura').resolvedOptions().calendar === 'islamic-umalqura';
    } catch {
        return false;
    }
}

const isoDay = (date) => date.toISOString().slice(0, 10);

/**
 * `[{ key, date }]`, soonest first — `key` is `ramadan`, `dhulHijjah`, `monthEnd` or `yearEnd`,
 * `date` is 'YYYY-MM-DD'. `now` is read as the reader's local calendar day.
 */
export function hijriDeadlines(now = new Date()) {
    if (!hasHijriCalendar()) return [];
    // Noon UTC on the reader's local date: a whole day either side of any zone's midnight.
    const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    const found = {};
    let previous = null;
    for (let offset = 0; offset <= HORIZON_DAYS; offset++) {
        const day = new Date(start + offset * 86_400_000);
        const hijri = hijriParts(day);
        if (hijri.day === 1 && previous && offset > MIN_DAYS) {
            // `previous` is the day before a month begins: the last day before its season.
            if (!found.monthEnd) found.monthEnd = previous;
            if (hijri.month === 9 && !found.ramadan) found.ramadan = previous;
            if (hijri.month === 12 && !found.dhulHijjah) found.dhulHijjah = previous;
            if (hijri.month === 1 && !found.yearEnd) found.yearEnd = previous;
        }
        previous = day;
    }
    const seen = new Set();
    return ['monthEnd', 'ramadan', 'dhulHijjah', 'yearEnd']
        .filter((key) => found[key])
        .map((key) => ({ key, date: isoDay(found[key]) }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .filter(({ date }) => (seen.has(date) ? false : seen.add(date)));
}
