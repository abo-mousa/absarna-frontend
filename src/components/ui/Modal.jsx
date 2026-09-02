import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// Kept as a constant so the exit timeout below always matches the CSS `duration-200`
// classes — drifting the two apart would either cut the fade short or leave a mounted-but
// -invisible modal hanging around for a beat.
const TRANSITION_MS = 200;

function Modal({ open, onClose, title, children, maxWidth = '800px' }) {
    // `open` turning false can't unmount immediately — there'd be nothing left to animate.
    // Stay mounted (`rendered`) through the exit transition, then unmount.
    const [rendered, setRendered] = useState(open);
    const [visible, setVisible] = useState(false);
    const dialogRef = useRef(null);
    const titleId = useId();

    useEffect(() => {
        if (open) {
            setRendered(true);
            const raf = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(raf);
        }
        setVisible(false);
        const timeout = setTimeout(() => setRendered(false), TRANSITION_MS);
        return () => clearTimeout(timeout);
    }, [open]);

    useFocusTrap(open, dialogRef, onClose);

    if (!rendered) return null;

    return (
        <div
            className={`fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4
                transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`bg-surface rounded-xl w-full max-h-[90vh] overflow-auto shadow-lg outline-none
                    transition-all duration-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                style={{ maxWidth }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-border-light">
                    <h3 id={titleId} className="m-0">{title}</h3>
                    <button
                        onClick={onClose}
                        aria-label="إغلاق"
                        className="text-text-muted hover:text-text-primary transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

export default Modal;
