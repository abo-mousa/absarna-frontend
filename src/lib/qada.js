import { safeSessionStorage } from './safeStorage';

/**
 * The make-up in progress: after «أتمِمه الآن», the progress reports for that goal's programme or book
 * carry `creditDay` (yesterday) until noon, so the backend credits them to the missed day
 * (PROGRESS-AND-GOALS.md §6.5, after Muslim 747). The backend re-checks the window on every report,
 * so this is only a hint of which reports to mark — a stale one costs nothing.
 *
 * <p>Session storage: a make-up belongs to this morning in this tab, and must not survive into a
 * later day.
 */
const KEY = 'absarna.qada';

/** Starts a make-up: `{ goalId, creditDay, seriesId?, bookId? }`, ending at noon today. */
export function startQada({ goalId, creditDay, seriesId = null, bookId = null }, now = new Date()) {
    const noon = new Date(now);
    noon.setHours(12, 0, 0, 0);
    safeSessionStorage.setItem(KEY, JSON.stringify({ goalId, creditDay, seriesId, bookId, until: noon.getTime() }));
}

function read(now) {
    try {
        const value = JSON.parse(safeSessionStorage.getItem(KEY) || 'null');
        if (!value || now.getTime() >= value.until) return null;
        return value;
    } catch {
        return null;
    }
}

/** The day to credit a report about this programme or book to, or undefined. */
export function creditDayFor({ seriesId = null, bookId = null }, now = new Date()) {
    const active = read(now);
    if (!active) return undefined;
    if (seriesId != null && active.seriesId === seriesId) return active.creditDay;
    if (bookId != null && active.bookId === bookId) return active.creditDay;
    // A habit pursues no one programme or book: whatever the reader learns this morning makes it up.
    if (active.seriesId == null && active.bookId == null) return active.creditDay;
    return undefined;
}

export function endQada() {
    safeSessionStorage.removeItem(KEY);
}
