import { useEffect, useRef, useState } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { useSetChannelReviewExemptions } from '@/hooks/useChannels';
import { t } from '@/i18n';

/**
 * The detectors a platform admin has excused a channel from.
 *
 * <p><b>One component, two mounts</b> — the admin channel list, where the question is "which
 * channels across the platform", and the channel's own settings, where it is "this channel, which
 * I am looking at". Shared rather than written twice because what has to be identical is not the
 * markup but the RULES: the reason is required, the set is replaced whole, and the copy says what
 * this does not do. Two copies of that drift, and the half that drifts is the explanation.
 */
const DETECTORS = ['MUSIC', 'NUDITY'];

export default function ReviewExemptionDialog({ channel, exemptions, open, onClose }) {
    const { showToast } = useToast();
    const save = useSetChannelReviewExemptions();
    const [types, setTypes] = useState([]);
    const [reason, setReason] = useState('');

    // Read through a ref so that re-seeding depends on OPENING, and on nothing else. Depending on
    // `exemptions` directly says "re-seed whenever this data changes identity", which is not the
    // intent and is not harmless: a refetch while the dialog is open — a reconnect is enough —
    // would tick the checkboxes back to the server's state and wipe the reason mid-sentence,
    // under someone who is part way through a decision.
    //
    // The reason deliberately does NOT carry over between openings: every save restamps who
    // decided and why, so pre-filling the previous sentence would attribute one admin's reasoning
    // to another's decision.
    const latest = useRef(exemptions);
    latest.current = exemptions;
    useEffect(() => {
        if (!open) {
            return;
        }
        setTypes((latest.current ?? []).map((e) => e.type));
        setReason('');
    }, [open]);

    const toggle = (type) =>
        setTypes((current) =>
            current.includes(type) ? current.filter((other) => other !== type) : [...current, type]);

    const submit = () => {
        save.mutate(
            { id: channel.id, types, reason: reason.trim() },
            {
                onSuccess: () => {
                    showToast(t('admin.exemptions.saved'), 'success');
                    onClose();
                },
                onError: () => showToast(t('admin.exemptions.saveFailed'), 'error'),
            },
        );
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t('admin.exemptions.title', { name: channel?.name })}
            maxWidth="520px"
        >
            <p className="text-text-secondary mb-2">{t('admin.exemptions.intro')}</p>
            {/* Both halves of what this does NOT do. Neither is obvious from the control, and an
                admin who assumes either is wrong in a direction that matters: that ticking a box
                publishes what is already held, or that it re-examines what has already been
                uploaded. */}
            <p className="text-text-muted text-sm mb-4">{t('admin.exemptions.scope')}</p>

            <div className="grid gap-2 mb-4">
                {DETECTORS.map((type) => (
                    <label
                        key={type}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border-light
                            cursor-pointer hover:bg-surface-hover transition-colors"
                    >
                        <input
                            type="checkbox"
                            className="mt-1 accent-primary"
                            checked={types.includes(type)}
                            onChange={() => toggle(type)}
                        />
                        <span>
                            <span className="font-semibold block">
                                {t(`admin.exemptions.detector.${type}`)}
                            </span>
                            <span className="text-text-muted text-sm">
                                {t(`admin.exemptions.detectorHint.${type}`)}
                            </span>
                        </span>
                    </label>
                ))}
            </div>

            <Input
                label={t('admin.exemptions.reasonLabel')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                textarea
                rows={2}
                required
            />
            <p className="text-text-muted text-xs mt-1">{t('admin.exemptions.reasonHint')}</p>

            <div className="flex gap-2 justify-end mt-5">
                <button onClick={onClose} className="px-4 py-2 text-text-secondary font-semibold">
                    {t('common.cancel')}
                </button>
                <Button onClick={submit} disabled={!reason.trim() || save.isPending}>
                    {t('common.save')}
                </Button>
            </div>
        </Modal>
    );
}

/** The row/inline summary both mounts show, so "unscanned" reads the same in either place. */
export function ReviewExemptionSummary({ exemptions }) {
    if (!exemptions?.length) return null;
    return t('admin.exemptions.badge', {
        types: exemptions.map((e) => t(`admin.exemptions.detector.${e.type}`)).join(t('common.listSeparator')),
    });
}
