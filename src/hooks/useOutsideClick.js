import { useEffect } from 'react';

// Calls `onOutside` on a pointerdown outside `ref`'s element — used to close dropdowns/menus.
export function useOutsideClick(ref, onOutside) {
    useEffect(() => {
        const handlePointerDown = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onOutside();
            }
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [ref, onOutside]);
}
