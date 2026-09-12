import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Traps Tab/Shift+Tab focus cycling within `containerRef` while `active`, moves focus into
// the container on activation, restores it to whatever was focused before on deactivation,
// locks body scroll, and closes on Escape via `onClose`. Shared by Modal and SideBar's mobile
// drawer — both are overlay panels that need the same dialog behavior.
export function useFocusTrap(active, containerRef, onClose) {
    const previousFocusRef = useRef(null);

    // Body scroll lock. Without it, scrolling over the backdrop scrolls the page behind the
    // dialog; on iOS Safari that scroll chaining moves the page under an open sheet and the user
    // loses their place entirely. It lives here rather than in Modal so the drawer gets it too —
    // they already share this hook, and a second copy is a second thing to forget.
    //
    // The PREVIOUS value is saved and restored, not reset to ''. That is what makes nesting safe:
    // opening a modal on top of the drawer and closing it must not hand scrolling back while the
    // drawer is still open.
    useEffect(() => {
        if (!active) return;
        const previousOverflow = document.body.style.overflow;
        const previousPaddingRight = document.body.style.paddingRight;
        // Compensate for the scrollbar that is about to disappear, or the whole page shifts
        // sideways as the dialog opens. Zero on overlay-scrollbar platforms, so this is a no-op
        // on most phones and on macOS.
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        return () => {
            document.body.style.overflow = previousOverflow;
            document.body.style.paddingRight = previousPaddingRight;
        };
    }, [active]);

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
