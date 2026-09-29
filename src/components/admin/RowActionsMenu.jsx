import { useEffect, useId, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { t } from '@/i18n';

/**
 * The secondary actions of an admin row, behind one button.
 *
 * <p>A channel row carried up to ten buttons in a wrap, which on a phone was a wall and on a
 * desktop hid the two that matter (suspend, delete) among the ones pressed once a year (transfer,
 * history, affirmations, scanning). The frequent decisions stay on the row; the rest live here.
 *
 * <p>A plain toggle button and a list of buttons, closed on outside click and on Escape. Not
 * `role="menu"`: that promises arrow-key navigation this does not implement, the same reason the
 * review queue's tabs are toggle buttons rather than a tablist.
 *
 * @param items `[{ id, label, icon, onClick }]`
 */
export default function RowActionsMenu({ items }) {
    const [open, setOpen] = useState(false);
    const root = useRef(null);
    const listId = useId();

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (event) => {
            if (root.current && !root.current.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div ref={root} className="relative">
            <button
                type="button"
                aria-expanded={open}
                aria-controls={listId}
                aria-label={t('admin.more')}
                title={t('admin.more')}
                onClick={() => setOpen((value) => !value)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-sm font-semibold text-text-secondary hover:bg-surface-hover transition-colors"
            >
                <MoreHorizontal size={16} aria-hidden="true" />
            </button>
            {open && (
                <ul
                    id={listId}
                    className="absolute end-0 z-20 mt-1 min-w-[200px] bg-surface border border-border rounded-lg shadow-lg p-1"
                >
                    {items.map(({ id, label, icon: Icon, onClick }) => (
                        <li key={id}>
                            <button
                                type="button"
                                onClick={() => { setOpen(false); onClick(); }}
                                className="w-full text-start inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-surface-hover transition-colors"
                            >
                                {Icon && <Icon size={14} aria-hidden="true" className="flex-shrink-0" />}
                                {label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
