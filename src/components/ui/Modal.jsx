import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { t } from '@/i18n';

// Kept as a constant so the exit timeout below always matches the CSS `duration-200`
// classes — drifting the two apart would either cut the fade short or leave a mounted-but
// -invisible modal hanging around for a beat.
const TRANSITION_MS = 200;

/**
 * `bare` drops the title bar and the body padding, for a dialog that lays out its own heading
 * (SignInPromptContext): `title` then names the dialog for assistive technology only, and the
 * close button floats in the top corner.
 */
function Modal({ open, onClose, title, children, maxWidth = '800px', bare = false }) {
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

    // A click closes only if the gesture BOTH started and ended on the backdrop. `click` fires on
    // mouse-UP, so selecting text in a field, dragging past the dialog's edge and releasing over
    // the backdrop used to close the modal and throw away whatever had been typed — reliably
    // annoying on a form-heavy screen like ChannelManage. Tracking where the press began is the
    // whole fix, and it makes the inner stopPropagation unnecessary: the dialog is never
    // `currentTarget` here, so a click inside it cannot satisfy the second half of the condition.
    const pressStartedOnBackdrop = useRef(false);

    if (!rendered) return null;

    // Into <body>, not in place: a dialog opened from inside another (the subject picker inside the
    // edit dialog) sat inside that dialog's scaled box, and `position: fixed` under a transform is
    // relative to the transformed box rather than the screen.
    return createPortal((
        <div
            className={`fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4
                transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
            onMouseDown={(e) => {
                pressStartedOnBackdrop.current = e.target === e.currentTarget;
            }}
            onClick={(e) => {
                if (pressStartedOnBackdrop.current && e.target === e.currentTarget) {
                    onClose?.();
                }
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={bare ? undefined : titleId}
                aria-label={bare ? title : undefined}
                tabIndex={-1}
                className={`relative bg-surface rounded-xl w-full max-h-[90vh] overflow-auto shadow-lg outline-none
                    transition-all duration-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                style={{ maxWidth }}
            >
                {bare ? (
                    <>
                        <button
                            onClick={onClose}
                            aria-label={t('common.close')}
                            className="absolute top-3 end-3 z-10 p-1.5 rounded-full text-text-secondary
                                hover:text-text-primary hover:bg-surface/70 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        {children}
                    </>
                ) : (
                    <>
                        <div className="flex justify-between items-center p-6 border-b border-border-light">
                            <h3 id={titleId} className="m-0">{title}</h3>
                            <button
                                onClick={onClose}
                                aria-label={t('common.close')}
                                className="text-text-muted hover:text-text-primary transition-colors"
                            >
                                <X size={22} />
                            </button>
                        </div>
                        <div className="p-6">{children}</div>
                    </>
                )}
            </div>
        </div>
    ), document.body);
}

export default Modal;
