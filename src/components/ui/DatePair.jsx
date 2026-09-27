import { useState } from 'react';
import { formatHijriDate, formatGregorianDate } from '@/lib/datetime';

/**
 * Today, in both calendars: the Hijri date first and plainly the main one, the Gregorian smaller
 * and quieter. `size="bar"` stacks them for the navbar; `"page"` sets them on one line for Today's
 * header.
 *
 * <p>Read once per mount, not per render — the navbar re-renders on every fetch — so a page left
 * open past midnight keeps yesterday's until the next load. Renders nothing when the runtime has
 * no Hijri calendar, rather than a Gregorian date alone posing as the pair.
 */
function DatePair({ size = 'page', className = '' }) {
    const [dates] = useState(() => ({ hijri: formatHijriDate(), gregorian: formatGregorianDate() }));
    if (!dates.hijri) return null;
    const bar = size === 'bar';
    if (!bar) {
        // Today's dateline: one line, not two — the Hijri date large in the heading face, the
        // Gregorian after it on the same baseline, so the date reads first without a stack.
        return (
            <p className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 leading-none ${className}`}>
                <span className="font-serif text-[1.75rem] font-semibold text-gold-ink whitespace-nowrap">{dates.hijri}</span>
                {dates.gregorian && (
                    <span className="text-sm text-text-muted whitespace-nowrap">{dates.gregorian}</span>
                )}
            </p>
        );
    }
    return (
        <span className={`flex flex-col items-start leading-tight whitespace-nowrap ${className}`}>
            <span className="text-xs font-bold text-text-primary">{dates.hijri}</span>
            {dates.gregorian && <span className="text-[0.65rem] text-text-muted">{dates.gregorian}</span>}
        </span>
    );
}

export default DatePair;
