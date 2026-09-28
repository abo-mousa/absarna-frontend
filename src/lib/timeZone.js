/**
 * The reader's IANA time zone ("Asia/Riyadh"), which every progress read and report sends as
 * `?tz=` — the backend counts the reader's day, week and slot of the day in it. Undefined when the
 * browser cannot say; the backend then falls back to the account's stored zone, then UTC.
 */
export const readerTimeZone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    } catch {
        return undefined;
    }
};
