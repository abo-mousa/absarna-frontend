import { useState } from 'react';
import { formatHijriDate, formatGregorianDate } from '@/lib/datetime';

/**
 * Today, in both calendars: the Hijri date first and plainly the main one, the Gregorian under it
 * in a smaller, quieter line. `size="bar"` for the navbar, `"page"` for Today's header.
 *
 * <p>Read once per mount, not per render — the navbar re-renders on every fetch — so a page left
 * open past midnight keeps yesterday's until the next load. Renders nothing when the runtime has
 * no Hijri calendar, rather than a Gregorian date alone posing as the pair.
 */
function DatePair({ size = 'page', className = '' }) {
    const [dates] = useState(() => ({ hijri: formatHijriDate(), gregorian: formatGregorianDate() }));
    if (!dates.hijri) return null;
    const bar = size === 'bar';
    return (
        <span className={`flex flex-col items-start leading-tight whitespace-nowrap ${className}`}>
            <span className={bar ? 'text-xs font-bold text-text-primary' : 'text-base font-bold text-gold-ink'}>{dates.hijri}</span>
            {dates.gregorian && (
                <span className={bar ? 'text-[0.65rem] text-text-muted' : 'text-xs text-text-muted mt-0.5'}>{dates.gregorian}</span>
            )}
        </span>
    );
}

export default DatePair;
