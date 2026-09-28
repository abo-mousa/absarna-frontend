import { Link } from 'react-router-dom';
import { Modal, KhatamStar, Button } from '../ui';
import SacredText from './SacredText';
import { useCompletions } from '@/hooks/useProgress';
import { amountText } from '@/lib/goalText';
import { countOf } from '@/lib/plural';
import { formatDigits, t } from '@/i18n';

/**
 * «الحمد لله» — a programme or book finished. The full star, what was finished and over how long,
 * the verse and the du'a of the moment, and the way on: a next portion, or the journey. No share
 * button (PROGRESS-AND-GOALS.md §10): this is between the reader and their Lord.
 */
function CompletionMoment({ completion, onClose, onNextGoal }) {
    const completions = useCompletions();
    const count = completions.data?.length || 0;
    const days = completion.startedOn && completion.completedAt
        ? Math.max(1, Math.round((new Date(completion.completedAt) - new Date(`${completion.startedOn}T00:00:00`)) / 86_400_000))
        : null;
    const measure = completion.kind === 'BOOK' ? 'PAGES' : 'EPISODES';
    return (
        <Modal open onClose={onClose} title={t('journey.completion.dialogTitle')} maxWidth="520px">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="relative w-28 h-28">
                    <KhatamStar className="absolute inset-0 w-full h-full text-gold" />
                    {count > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center font-numeral font-bold text-[1.6rem] text-gray-900">
                            {formatDigits(String(count))}
                        </span>
                    )}
                </div>
                <h2 className="font-serif text-[1.8rem] font-semibold leading-tight">
                    {t('journey.completion.title')}
                </h2>
                <p dir="auto" className="font-serif text-[1.3rem] text-gold-ink">{completion.titleSnapshot}</p>
                <p className="text-sm text-text-secondary">
                    {[
                        completion.units ? amountText(measure, completion.units) : null,
                        days ? t('journey.completion.over', { days: countOf('journey.units.DAYS', days, { oblique: true }) }) : null,
                    ].filter(Boolean).join(' · ')}
                </p>
                {count > 1 && <p className="text-sm text-text-muted">{t('journey.completion.count', { count })}</p>}
                <SacredText moment="completion" kind="AYAH" className="text-start w-full" />
                <SacredText moment="completion" kind="HADITH" className="text-start w-full" />
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <Button onClick={onNextGoal}>{t('journey.completion.nextGoal')}</Button>
                    <Link to="/journey" onClick={onClose}
                          className="px-5 py-2.5 border border-border rounded-md font-semibold hover:no-underline hover:border-primary">
                        {t('journey.completion.toJourney')}
                    </Link>
                </div>
            </div>
        </Modal>
    );
}

export default CompletionMoment;
