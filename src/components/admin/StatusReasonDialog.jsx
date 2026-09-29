import { useEffect, useState } from 'react';
import { Modal, Input, Button, RejectedFields } from '@/components/ui';
import { t } from '@/i18n';

/**
 * The sentence behind an approve, reject, suspend or reactivate.
 *
 * <p>Suspending a live channel blacks it out at once, and deleting one asked the admin to type
 * its slug — while suspend and reject asked nothing and recorded nothing, so the owner learned
 * "suspended" and no more, and the next admin could not tell a colleague's decision from a slip.
 * This dialog is the one place all four decisions pass through: it asks why, says who will read
 * the answer (the owner, on their dashboard), and the backend stores it with the actor and time.
 *
 * <p>The reason is REQUIRED for reject and suspend and optional for approve and reactivate — the
 * backend refuses the first two without one (`STATUS_REASON_REQUIRED`), and this mirrors that so
 * the refusal is never the way an admin learns the rule. It opens empty every time: a reason is
 * this decision's, never the last one's.
 *
 * @param action 'approve' | 'reject' | 'suspend' | 'reactivate' — the copy and the requirement
 */
export default function StatusReasonDialog({ channel, action, open, pending = false, error = null,
                                            onConfirm, onClose }) {
    const [reason, setReason] = useState('');
    useEffect(() => {
        if (open) setReason('');
    }, [open, channel?.id, action]);

    const required = action === 'reject' || action === 'suspend';
    const canConfirm = !pending && (!required || reason.trim().length > 0);
    const key = action ?? 'approve';

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t(`admin.decision.${key}.title`, { name: channel?.name ?? '' })}
            maxWidth="520px"
        >
            <p className="text-sm text-text-secondary leading-relaxed mb-1">
                {t(`admin.decision.${key}.body`)}
            </p>
            <p className="text-xs text-text-muted mb-4">{t('admin.decision.ownerReads')}</p>
            <RejectedFields error={error}>
                <Input
                    label={required ? t('admin.decision.reasonLabel') : t('admin.decision.reasonOptionalLabel')}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    textarea
                    rows={3}
                    maxLength={500}
                    autoFocus
                    field="reason"
                />
            </RejectedFields>
            <div className="flex gap-2 justify-end mt-5">
                <Button variant="outline" onClick={onClose} disabled={pending}>{t('common.cancel')}</Button>
                <Button
                    variant={required ? 'danger' : 'primary'}
                    onClick={() => onConfirm(reason)}
                    disabled={!canConfirm}
                >
                    {t(`admin.decision.${key}.action`)}
                </Button>
            </div>
        </Modal>
    );
}
