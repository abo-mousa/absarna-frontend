import { readerTimeZone } from './timeZone';
import { creditDayFor } from './qada';

/**
 * The query a progress report carries: the reader's zone (which learning day it counts for) and,
 * while making up yesterday's portion before noon, the day to credit (lib/qada.js).
 */
export function reportParams({ seriesId = null, bookId = null } = {}) {
    const params = { tz: readerTimeZone() };
    const creditDay = creditDayFor({ seriesId, bookId });
    if (creditDay) params.creditDay = creditDay;
    return params;
}

/** The same as a query string, for the keepalive flush, which takes a path. */
export function reportQuery(target) {
    const params = reportParams(target);
    const query = Object.entries(params).filter(([, v]) => v != null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    return query ? `?${query}` : '';
}
