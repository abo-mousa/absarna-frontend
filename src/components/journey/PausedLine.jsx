import { PauseCircle } from 'lucide-react';
import { useHistorySettings, useUpdateHistorySettings } from '@/hooks/useHistorySettings';
import { useToast } from '@/contexts/ToastContext';
import { describeError } from '@/lib/describeError';
import { t } from '@/i18n';

/**
 * One quiet line while the reader has paused recording (PROGRESS-AND-GOALS.md §7.6): under the
 * player and the book reader it says the place is not being kept, on Today's portions and the
 * journey pages that progress is not being counted. Resuming is one tap, right here — sending the
 * reader to a panel at the foot of another page to undo a pause was a detour, and the page moved
 * under the anchor as its charts loaded.
 */
function PausedLine({ where = 'player', className = '' }) {
    const settings = useHistorySettings();
    const update = useUpdateHistorySettings();
    const { showToast } = useToast();
    if (!settings.data?.paused) return null;
    return (
        <p data-guide="paused" className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted ${className}`}>
            <PauseCircle size={15} aria-hidden="true" className="flex-shrink-0" />
            <span>{where === 'journey' ? t('journey.paused.journey') : t('journey.paused.player')}</span>
            <button
                type="button"
                disabled={update.isPending}
                onClick={() => update.mutate({ paused: false }, {
                    onSuccess: () => showToast(t('journey.record.resumed'), 'success'),
                    onError: (error) => showToast(describeError(error, t('journey.record.saveFailed')), 'error'),
                })}
                className="font-semibold text-primary hover:underline disabled:opacity-50"
            >
                {t('journey.paused.resume')}
            </button>
        </p>
    );
}

export default PausedLine;
