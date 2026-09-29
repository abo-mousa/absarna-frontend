import { Modal, Button } from '@/components/ui';
import { t } from '@/i18n';

/**
 * A yes/no question in the platform's own dialog, for the places that used `window.confirm`.
 *
 * <p>The browser's confirm is unstyled, ignores the page's direction and language, and blocks the
 * event loop; two admin screens reached for it anyway because nothing shared existed. This is
 * that thing. `danger` colours the confirming button for an action that takes something away.
 */
function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, danger = false, pending = false,
                         onConfirm, onClose }) {
    return (
        <Modal open={open} onClose={onClose} title={title} maxWidth="480px">
            {body && <p className="text-sm text-text-secondary leading-relaxed mb-5">{body}</p>}
            <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose} disabled={pending}>
                    {cancelLabel ?? t('common.cancel')}
                </Button>
                <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={pending}>
                    {confirmLabel ?? t('common.confirm')}
                </Button>
            </div>
        </Modal>
    );
}

export default ConfirmDialog;
