import { useEffect } from 'react';

// Calls `onOutside` on a pointerdown outside `ref`'s element — used to close dropdowns/menus.
export function useOutsideClick(ref, onOutside) {
    useEffect(() => {
        const handlePointerDown = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onOutside();
            }
        };
        // pointerdown, not mousedown: iOS Safari synthesises mouse events only for targets it
        // thinks are clickable, so a tap on the bare page background never closed a menu.
        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [ref, onOutside]);
}
