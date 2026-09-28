import { useEffect, useState } from 'react';

/**
 * The time, re-read every `intervalMs` — for a page cached until the day ends whose content moves
 * with the clock (Today's portions change slot at 12:00 and 18:00; the make-up card turns into the
 * after-noon line at noon) without a refetch.
 */
export function useNow(intervalMs = 60_000) {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);
    return now;
}

export default useNow;
