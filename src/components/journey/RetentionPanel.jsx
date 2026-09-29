import { useState } from 'react';
import { Button, Modal } from '../ui';
import { Chips } from './controls';
import { useEraseProgress, useHistorySettings, useUpdateHistorySettings } from '@/hooks/useHistorySettings';
import { useToast } from '@/contexts/ToastContext';
import { describeError } from '@/lib/describeError';
import { t } from '@/i18n';

const RETENTIONS = ['FOREVER', 'YEAR', 'QUARTER', 'MONTH'];
// Longest first: a move to the right shortens what is kept.
const shorter = (next, current) => RETENTIONS.indexOf(next) > RETENTIONS.indexOf(current);

/**
 * The reader's control over their record (PROGRESS-AND-GOALS.md §6.6): how long it is kept, a
 * pause, and an erase. Retention and the pause save on the tap — both are undone by the next tap,
 * and a Save button beside two toggles is one more thing to forget. The erase asks, and asks
 * whether the counts go too: they are numbers, not a list of what was watched, and survive a
 * short retention for that reason.
 */
function RetentionPanel() {
    const settings = useHistorySettings();
    const update = useUpdateHistorySettings();
    const [erasing, setErasing] = useState(false);
    const { showToast } = useToast();
    const data = settings.data;
    if (!data) return null;
    const save = (body, message) => update.mutate(body, {
        onSuccess: () => showToast(message, 'success'),
        onError: (error) => showToast(describeError(error, t('journey.record.saveFailed')), 'error'),
    });
    return (
        <section data-guide="control" className="flex flex-col gap-6 p-5 rounded-lg border border-border-light bg-surface">
            <div>
                <h2 className="font-serif text-[1.5rem] font-semibold">{t('journey.record.controlTitle')}</h2>
                <p className="text-sm text-text-secondary mt-1">{t('journey.record.controlText')}</p>
            </div>
            <div>
                <Chips
                    label={t('journey.record.retentionLabel')}
                    value={data.retention}
                    // A shorter retention takes effect at the nightly sweep and cannot be undone after
                    // it — the toast says so, and stays long enough to be read, while the choice can
                    // still be taken back.
                    onChange={(retention) => retention !== data.retention && (shorter(retention, data.retention)
                        ? update.mutate({ retention }, {
                            onSuccess: () => showToast(t('journey.record.retentionShortened', {
                                period: t(`journey.record.retentionPeriod.${retention}`),
                            }), 'info', 9000),
                            onError: (error) => showToast(describeError(error, t('journey.record.saveFailed')), 'error'),
                        })
                        : save({ retention }, t('journey.record.retentionSaved')))}
                    options={RETENTIONS.map((retention) => ({ value: retention, label: t(`journey.record.retention.${retention}`) }))}
                />
                <p className="text-xs text-text-muted mt-2">{t('journey.record.retentionHint')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[14rem]">
                    <p className="text-sm font-semibold">
                        {data.paused ? t('journey.record.pausedTitle') : t('journey.record.recordingTitle')}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                        {data.paused ? t('journey.record.pausedText') : t('journey.record.recordingText')}
                    </p>
                </div>
                <Button
                    variant={data.paused ? 'primary' : 'outline'}
                    size="sm"
                    disabled={update.isPending}
                    onClick={() => save({ paused: !data.paused }, data.paused ? t('journey.record.resumed') : t('journey.record.pausedToast'))}
                >
                    {data.paused ? t('journey.record.resume') : t('journey.record.pause')}
                </Button>
            </div>
            <div className="pt-4 border-t border-border-light">
                <button type="button" onClick={() => setErasing(true)} className="text-sm text-text-muted hover:text-text-primary underline">
                    {t('journey.record.erase')}
                </button>
            </div>
            <EraseDialog open={erasing} onClose={() => setErasing(false)} />
        </section>
    );
}

/** Each opening starts unticked: an erase must never inherit a choice made the last time. */
function EraseDialog({ open, onClose }) {
    return (
        <Modal open={open} onClose={onClose} title={t('journey.record.eraseTitle')} maxWidth="480px">
            {open && <EraseForm onClose={onClose} />}
        </Modal>
    );
}

function EraseForm({ onClose }) {
    const [counts, setCounts] = useState(false);
    const erase = useEraseProgress();
    const { showToast } = useToast();
    return (
        <>
            <div data-guide="erase" className="flex flex-col gap-5">
                <p className="text-sm text-text-secondary">{t('journey.record.eraseText')}</p>
                <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" checked={counts} onChange={(e) => setCounts(e.target.checked)} className="mt-1 accent-primary" />
                    <span>
                        <span className="block font-semibold">{t('journey.record.eraseCounts')}</span>
                        <span className="block text-xs text-text-muted">{t('journey.record.eraseCountsHint')}</span>
                    </span>
                </label>
                <div className="flex flex-wrap justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
                    <Button
                        variant="danger"
                        disabled={erase.isPending}
                        onClick={() => erase.mutate({ counts }, {
                            onSuccess: () => { showToast(t('journey.record.erased'), 'success'); onClose(); },
                            onError: (error) => showToast(describeError(error, t('journey.record.eraseFailed')), 'error'),
                        })}
                    >
                        {counts ? t('journey.record.eraseAllConfirm') : t('journey.record.eraseConfirm')}
                    </Button>
                </div>
            </div>
        </>
    );
}

export default RetentionPanel;
