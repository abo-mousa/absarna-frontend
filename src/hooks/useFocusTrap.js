import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Traps Tab/Shift+Tab focus cycling within `containerRef` while `active`, moves focus into
// the container on activation, restores it to whatever was focused before on deactivation,
// and closes on Escape via `onClose`. Shared by Modal and SideBar's mobile drawer — both are
// overlay panels that need the same dialog focus behavior.
export function useFocusTrap(active, containerRef, onClose) {
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (!active) return;
        previousFocusRef.current = document.activeElement;
        const firstFocusable = containerRef.current?.querySelector(FOCUSABLE_SELECTOR);
        (firstFocusable || containerRef.current)?.focus();
        return () => previousFocusRef.current?.focus?.();
    }, [active, containerRef]);

    useEffect(() => {
        if (!active) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
                return;
            }
            if (e.key !== 'Tab') return;
            const focusable = containerRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
            if (!focusable || focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [active, containerRef, onClose]);
}
