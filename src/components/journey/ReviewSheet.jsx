import { useState } from 'react';
import { Modal, Button } from '../ui';
import { Chips, MultiChips } from './controls';
import DayStars from './DayStars';
import SacredText from './SacredText';
import { useSaveReview } from '@/hooks/useProgress';
import { useToast } from '@/contexts/ToastContext';
import { goalTitle, amountText, measureOf } from '@/lib/goalText';
import { SLOTS } from '@/lib/slots';
import { describeError } from '@/lib/describeError';
import { t } from '@/i18n';

const HELPED = ['AFTER_FAJR', 'MINIMUM', 'EARLY_SLEEP', 'OTHER'];
const HINDERED = ['LATE_NIGHTS', 'WORK', 'PHONE', 'OTHER'];

/**
 * «محاسبة الأسبوع» — the Friday review, after Jumu'ah until the week ends (PROGRESS-AND-GOALS.md
 * §7.3, the `Muhasaba` board). Three questions and one decision: what helped, what got in the way,
 * and whether to keep the portion, move it, lighten it — or, after two full weeks, add one unit
 * (al-Isra 106: gradually). The note is the reader's alone.
 */
function ReviewSheet({ open, onClose, review, goals }) {
    return (
        <Modal open={open} onClose={onClose} title={t('journey.review.title')} maxWidth="580px">
            {open && review && <ReviewForm review={review} goals={goals} onDone={onClose} />}
        </Modal>
    );
}

function ReviewForm({ review, goals, onDone }) {
    const daily = goals.filter((goal) => goal.period === 'DAY');
    const [helped, setHelped] = useState(review.helped || []);
    const [hindered, setHindered] = useState(review.hindered || []);
    const [adjustment, setAdjustment] = useState(review.adjustment || 'KEEP');
    const [goalId, setGoalId] = useState(review.adjustmentGoalId || review.primaryGoalId || daily[0]?.id || null);
    const [slot, setSlot] = useState(null);
    const [note, setNote] = useState(review.note || '');
    const save = useSaveReview();
    const { showToast } = useToast();
    const goal = daily.find((candidate) => candidate.id === goalId);
    const increaseOffered = goal && (review.increaseOffered || []).includes(goal.id);

    const adjustments = [
        { value: 'KEEP', label: t('journey.review.keep') },
        ...(goal ? [{ value: 'MOVE_SLOT', label: t('journey.review.moveSlot') }] : []),
        ...(goal && goal.minimumAmount < goal.amount ? [{ value: 'LIGHTEN', label: t('journey.review.lighten') }] : []),
        ...(increaseOffered ? [{
            value: 'INCREASE',
            label: t('journey.review.increase', { amount: amountText(measureOf(goal), goal.amount + 1, true) }),
        }] : []),
    ];

    const submit = () => save.mutate({
        weekStart: review.weekStart,
        helped,
        hindered,
        adjustment,
        adjustmentGoalId: adjustment === 'KEEP' ? undefined : goalId,
        slot: adjustment === 'MOVE_SLOT' ? slot : undefined,
        note: note.trim() || undefined,
    }, {
        onSuccess: () => { showToast(t('journey.review.saved'), 'success'); onDone(); },
        onError: (error) => showToast(describeError(error, t('journey.review.saveFailed')), 'error'),
    });

    return (
        <div className="flex flex-col gap-6">
            <SacredText moment="review" kind="AYAH" />
            {review.week?.length > 0 && (
                <div>
                    <p className="text-sm font-semibold mb-2">{t('journey.review.yourWeek')}</p>
                    <DayStars days={review.week} weekly={review.weekly} />
                </div>
            )}
            {review.reflections?.length > 0 && (
                <div>
                    <p className="text-sm font-semibold mb-2">{t('journey.review.reflections')}</p>
                    <ul className="flex flex-col gap-2">
                        {review.reflections.map((row) => (
                            <li key={row.id} className="text-sm border-s-2 border-gold/50 ps-3">
                                <span dir="auto" className="font-reading">{row.text}</span>
                                {row.itemTitle && <span dir="auto" className="block text-xs text-text-muted">{row.itemTitle}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <MultiChips label={t('journey.review.helped')} values={helped} onChange={setHelped}
                        options={HELPED.map((code) => ({ value: code, label: t(`journey.review.answers.${code}`) }))} />
            <MultiChips label={t('journey.review.hindered')} values={hindered} onChange={setHindered}
                        options={HINDERED.map((code) => ({ value: code, label: t(`journey.review.answers.${code}`) }))} />
            {daily.length > 1 && (
                <Chips label={t('journey.review.whichGoal')} value={goalId} onChange={(id) => { setGoalId(id); setAdjustment('KEEP'); }}
                       options={daily.map((candidate) => ({ value: candidate.id, label: goalTitle(candidate) }))} />
            )}
            <Chips label={t('journey.review.adjustment')} value={adjustment} onChange={setAdjustment} options={adjustments} />
            {adjustment === 'MOVE_SLOT' && (
                <Chips label={t('journey.review.newSlot')} value={slot} onChange={setSlot}
                       options={SLOTS.filter((candidate) => candidate !== goal?.slot)
                           .map((candidate) => ({ value: candidate, label: t(`journey.slots.${candidate}`) }))} />
            )}
            <SacredText moment={increaseOffered ? 'gradual' : 'review'} kind="HADITH" size="sm" />
            <label className="block">
                <span className="block text-sm font-semibold mb-2">{t('journey.review.note')}</span>
                <textarea dir={note ? 'auto' : undefined} rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-border bg-surface font-reading" />
                <span className="block text-xs text-text-muted mt-1">{t('journey.dialog.intentionPrivate')}</span>
            </label>
            <div className="flex justify-end pt-2 border-t border-border-light">
                <Button onClick={submit} disabled={save.isPending || (adjustment === 'MOVE_SLOT' && !slot)}>
                    {save.isPending ? t('common.saving') : t('journey.review.save')}
                </Button>
            </div>
        </div>
    );
}

export default ReviewSheet;
