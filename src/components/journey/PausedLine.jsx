import { Link } from 'react-router-dom';
import { PauseCircle } from 'lucide-react';
import { useHistorySettings } from '@/hooks/useHistorySettings';
import { t } from '@/i18n';

/**
 * One quiet line while the reader has paused recording (PROGRESS-AND-GOALS.md §7.6): under the
 * player and the book reader it says the place is not being kept, on the journey pages that
 * progress is not being counted. Resuming is one tap on the record page, which this links to.
 */
function PausedLine({ where = 'player', className = '' }) {
    const settings = useHistorySettings();
    if (!settings.data?.paused) return null;
    return (
        <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted ${className}`}>
            <PauseCircle size={15} aria-hidden="true" className="flex-shrink-0" />
            <span>{where === 'journey' ? t('journey.paused.journey') : t('journey.paused.player')}</span>
            <Link to="/journey/record#recording" className="font-semibold">{t('journey.paused.resume')}</Link>
        </p>
    );
}

export default PausedLine;
