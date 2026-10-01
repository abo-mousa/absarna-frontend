import { Minus, Plus } from 'lucide-react';
import { amountText } from '@/lib/goalText';
import { t } from '@/i18n';

/**
 * A pace of the reader's own: − and + around «حلقتان كل يوم». The track beside it re-cuts as it
 * changes, so the choice is made by seeing where it leads rather than by guessing a number.
 */
function PaceStepper({ measure, amount, onChange, max = 50, period = 'DAY' }) {
    const step = measure === 'PAGES' && amount >= 10 ? 5 : 1;
    const set = (next) => onChange(Math.max(1, Math.min(max, next)));
    const label = period === 'WEEK'
        ? t('journey.track.amountWeek', { amount: amountText(measure, amount) })
        : t('journey.choose.paceDaily', { amount: amountText(measure, amount) });
    const button = 'w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center text-text-primary hover:border-primary disabled:opacity-40 disabled:hover:border-border';
    return (
        <div className="flex items-center justify-between gap-3">
            <button type="button" className={button} onClick={() => set(amount - step)} disabled={amount <= 1} aria-label={t('journey.track.less')}>
                <Minus size={16} aria-hidden="true" />
            </button>
            <span className="text-sm font-bold text-center" aria-live="polite">{label}</span>
            <button type="button" className={button} onClick={() => set(amount + step)} disabled={amount >= max} aria-label={t('journey.track.more')}>
                <Plus size={16} aria-hidden="true" />
            </button>
        </div>
    );
}

export default PaceStepper;
