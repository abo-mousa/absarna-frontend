import { useEffect, useState } from 'react';

// Delays updating the returned value until `value` stops changing for `delayMs` —
// use this to drive a search query from typed input without firing one per keystroke.
export function useDebouncedValue(value, delayMs = 200) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}
