import { useMemo, useState } from 'react';
import { Modal, Button } from '../ui';
import { EmailVerificationNotice } from '../auth';
import { Chips, Stepper } from './controls';
import SacredText from './SacredText';
import { useCreateGoal, useGoalPreview, useUpdateGoal } from '@/hooks/useGoals';
import { useToday } from '@/hooks/useToday';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToast } from '@/contexts/ToastContext';
import { hijriDeadlines } from '@/lib/hijriSeasons';
import { amountText, commitmentSentence, goalTitle, measureOf } from '@/lib/goalText';
import { SLOTS } from '@/lib/slots';
import { describeError } from '@/lib/describeError';
import { formatDay } from '@/lib/dayFormat';
import { countOf } from '@/lib/plural';
import { t } from '@/i18n';

const ANCHORS = ['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA', 'MORNING_ADHKAR', 'COMMUTE', 'CUSTOM'];
const IDENTITIES = ['FINISHES_WHAT_HE_STARTS', 'READS_EVERY_DAY', 'TEACHES_HIS_FAMILY'];
const HABITS = [
    { kind: 'HABIT', measure: 'MINUTES', amount: 15 },
    { kind: 'HABIT', measure: 'EPISODES', amount: 1 },
    { kind: 'HABIT', measure: 'PAGES', amount: 5 },
];

/** The form's starting point: an existing goal, a proposal («اجعله وِردًا», the first-portion card), or nothing. */
function initialForm(goal, prefill) {
    const source = goal || prefill || {};
    const kind = source.kind || null;
    const form = {
        kind,
        targetId: source.targetId ?? null,
        title: source.targetTitleSnapshot || source.title || '',
        measure: source.measure || (kind === 'FINISH_BOOK' ? 'PAGES' : kind === 'FINISH_SERIES' ? 'EPISODES' : 'MINUTES'),
        period: source.period || 'DAY',
        amount: source.amount || 1,
        minimumAmount: source.minimumAmount || 1,
        daysPerWeek: source.daysPerWeek || 7,
        deadline: source.deadline || null,
        slot: source.slot || null,
        fallbackSlot: source.fallbackSlot || null,
        anchor: source.anchor || null,
        anchorText: source.anchorText || '',
        identityPreset: source.identityPreset || null,
        identityText: source.identityText || '',
        intentionText: source.intentionText || '',
    };
    form.measure = measureOf(form);
    return form;
}

/**
 * «اعقد العزم» — starting or editing a goal (PROGRESS-AND-GOALS.md §7.3, the `Wird` board).
 *
 * <p>Steps, each one screen: what (skipped when the goal came from a programme or book), how much
 * (with the minimum, the days a week and a deadline, and a live preview of where it leads), when
 * (a daily portion only), and why — then the whole commitment read back as one sentence. Each
 * step carries at most one text, at the moment it speaks to (§8.1): consistency beside the
 * minimum, capacity only when the amount is far above what the reader has been doing, the three
 * times of day on the time step, the intention on the last.
 *
 * <p>An unverified reader gets the verification notice instead of a form that fails on its last
 * step (§7.10); the backend's refusal is the one that counts.
 */
function GoalDialog({ open, onClose, goal = null, prefill = null, unverified = false }) {
    const editing = !!goal;
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editing ? t('journey.dialog.editTitle') : t('journey.dialog.title')}
            maxWidth="580px"
        >
            {unverified && !editing
                ? <EmailVerificationNotice message={t('journey.dialog.verifyFirst')} />
                : open && <GoalForm key={goal?.id ?? JSON.stringify(prefill)} goal={goal} prefill={prefill} onDone={onClose} />}
        </Modal>
    );
}

function GoalForm({ goal, prefill, onDone }) {
    const editing = !!goal;
    const [form, setForm] = useState(() => initialForm(goal, prefill));
    const set = (patch) => setForm((current) => ({ ...current, ...patch }));
    const steps = useMemo(() => [
        ...(!editing && !prefill?.kind ? ['target'] : []),
        'amount',
        ...(form.period === 'DAY' ? ['time'] : []),
        'intention',
    ], [editing, prefill, form.period]);
    const [stepIndex, setStepIndex] = useState(0);
    const step = steps[Math.min(stepIndex, steps.length - 1)];
    const last = stepIndex >= steps.length - 1;
    const [error, setError] = useState(null);

    const create = useCreateGoal();
    const update = useUpdateGoal();
    const { showToast } = useToast();
    const saving = create.isPending || update.isPending;

    const canContinue = step !== 'target' || !!form.kind;

    const submit = () => {
        setError(null);
        const shared = {
            amount: form.amount,
            minimumAmount: form.period === 'DAY' ? Math.min(form.minimumAmount, form.amount) : undefined,
            daysPerWeek: form.period === 'DAY' ? form.daysPerWeek : undefined,
            slot: form.period === 'DAY' ? form.slot || undefined : undefined,
            fallbackSlot: form.period === 'DAY' && form.slot ? form.fallbackSlot || undefined : undefined,
            anchor: form.slot ? form.anchor || undefined : undefined,
            anchorText: form.slot && form.anchor === 'CUSTOM' ? form.anchorText.trim() || undefined : undefined,
            identityPreset: form.identityPreset || undefined,
            identityText: form.identityText.trim() || undefined,
            intentionText: form.intentionText.trim() || undefined,
        };
        const onError = (err) => setError(describeError(err, t('journey.dialog.saveFailed')));
        if (editing) {
            update.mutate({
                id: goal.id,
                ...shared,
                deadline: form.deadline || undefined,
                clearDeadline: goal.deadline && !form.deadline ? true : undefined,
                clearFallbackSlot: goal.fallbackSlot && !shared.fallbackSlot ? true : undefined,
            }, {
                onSuccess: () => { showToast(t('journey.dialog.updated'), 'success'); onDone(); },
                onError,
            });
            return;
        }
        create.mutate({
            ...shared,
            kind: form.kind,
            targetId: form.kind === 'HABIT' ? undefined : form.targetId,
            measure: form.kind === 'HABIT' ? form.measure : undefined,
            period: form.period,
            deadline: form.deadline || undefined,
        }, {
            onSuccess: () => { showToast(t('journey.dialog.created'), 'success'); onDone(); },
            onError,
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <ol className="flex items-center gap-2" aria-label={t('journey.dialog.stepsLabel')}>
                {steps.map((name, index) => (
                    <li key={name} className="flex-1" aria-current={index === stepIndex ? 'step' : undefined}>
                        <span className={`block h-1 rounded-full ${index <= stepIndex ? 'bg-gold' : 'bg-border-light'}`} />
                        <span className={`block mt-1.5 text-xs ${index === stepIndex ? 'font-semibold text-text-primary' : 'text-text-muted'}`}>
                            {t(`journey.dialog.steps.${name}`)}
                        </span>
                    </li>
                ))}
            </ol>

            {step === 'target' && <TargetStep form={form} set={set} />}
            {step === 'amount' && <AmountStep form={form} set={set} editing={editing} />}
            {step === 'time' && <TimeStep form={form} set={set} editing={editing} originalSlot={goal?.slot} />}
            {step === 'intention' && <IntentionStep form={form} set={set} />}

            {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            {/* Kept in view on a long step: the way on must not be below the fold. */}
            <div className="sticky -bottom-6 -mx-6 -mb-6 px-6 py-4 flex items-center justify-between gap-3 border-t border-border-light bg-surface">
                {stepIndex > 0
                    ? <Button variant="ghost" onClick={() => setStepIndex(stepIndex - 1)}>{t('journey.dialog.back')}</Button>
                    : <span />}
                {last ? (
                    <Button onClick={submit} disabled={saving}>
                        {saving ? t('common.saving') : editing ? t('journey.dialog.save') : t('journey.dialog.commit')}
                    </Button>
                ) : (
                    <Button onClick={() => setStepIndex(stepIndex + 1)} disabled={!canContinue}>{t('journey.dialog.next')}</Button>
                )}
            </div>
        </div>
    );
}

/** What the goal is for: a programme or book the reader has started, or a habit of learning. */
function TargetStep({ form, set }) {
    const today = useToday();
    const started = [
        ...(today.data?.continueWatching || [])
            .filter((item) => item.next?.seriesId)
            .map((item) => ({ kind: 'FINISH_SERIES', targetId: item.next.seriesId, title: item.next.seriesTitle, amount: 1 })),
        ...(today.data?.continueReading || [])
            .filter((entry) => entry.book)
            .map((entry) => {
                const left = (entry.book.pages || 0) - (entry.currentPage || 0);
                return { kind: 'FINISH_BOOK', targetId: entry.bookId, title: entry.book.title, amount: Math.max(1, Math.ceil(left / 30)) };
            }),
    ];
    const pick = (option) => set({
        kind: option.kind,
        targetId: option.targetId ?? null,
        title: option.title || '',
        measure: option.measure || (option.kind === 'FINISH_BOOK' ? 'PAGES' : 'EPISODES'),
        amount: option.amount,
        minimumAmount: 1,
        period: 'DAY',
        deadline: null,
    });
    const selected = (option) => form.kind === option.kind
        && (option.kind === 'HABIT' ? form.measure === option.measure : form.targetId === option.targetId);
    const card = (option, label, hint) => (
        <button
            key={`${option.kind}-${option.targetId ?? option.measure}`}
            type="button"
            role="radio"
            aria-checked={selected(option)}
            onClick={() => pick(option)}
            className={`w-full text-start px-4 py-3 rounded-md border transition-colors ${
                selected(option) ? 'border-primary bg-primary-light' : 'border-border bg-surface hover:border-primary'
            }`}
        >
            <span dir="auto" className="block font-semibold text-text-primary truncate">{label}</span>
            <span className="block text-xs text-text-muted mt-0.5">{hint}</span>
        </button>
    );
    return (
        <div className="flex flex-col gap-5">
            {started.length > 0 && (
                <div>
                    <p className="text-sm font-semibold mb-2">{t('journey.dialog.startedTitle')}</p>
                    <div role="radiogroup" className="flex flex-col gap-2">
                        {started.map((option) => card(option, option.title,
                            t(option.kind === 'FINISH_SERIES' ? 'journey.dialog.finishProgramme' : 'journey.dialog.finishBook')))}
                    </div>
                </div>
            )}
            <div>
                <p className="text-sm font-semibold mb-2">{started.length ? t('journey.dialog.habitTitle') : t('journey.dialog.habitTitleAlone')}</p>
                <div role="radiogroup" className="flex flex-col gap-2">
                    {HABITS.map((option) => card(option, t(`journey.habit.${option.measure}`),
                        t('journey.dialog.habitHint', { amount: amountText(option.measure, option.amount) })))}
                </div>
            </div>
            <p className="text-xs text-text-muted">{t('journey.dialog.otherTarget')}</p>
        </div>
    );
}

/** How much, how often, and by when — with the preview answering where that leads. */
function AmountStep({ form, set, editing }) {
    const daily = form.period === 'DAY';
    const finishing = form.kind !== 'HABIT';
    const seasons = useMemo(() => (finishing ? hijriDeadlines() : []), [finishing]);
    const body = useDebouncedValue(useMemo(() => ({
        kind: form.kind,
        targetId: form.kind === 'HABIT' ? undefined : form.targetId,
        measure: form.kind === 'HABIT' ? form.measure : undefined,
        period: form.period,
        amount: form.amount,
        minimumAmount: daily ? Math.min(form.minimumAmount, form.amount) : undefined,
        daysPerWeek: daily ? form.daysPerWeek : undefined,
        deadline: form.deadline || undefined,
    }), [form.kind, form.targetId, form.measure, form.period, form.amount, form.minimumAmount, form.daysPerWeek, form.deadline, daily]), 400);
    const preview = useGoalPreview(body, !!body.kind);
    const advice = preview.data?.sizeAdvice;
    const unit = (count) => amountText(form.measure, count);

    return (
        <div className="flex flex-col gap-6">
            <p dir="auto" className="font-serif text-[1.35rem] font-semibold leading-snug">{goalTitle(form)}</p>
            {form.kind === 'HABIT' && !editing && (
                <Chips
                    label={t('journey.dialog.periodLabel')}
                    value={form.period}
                    onChange={(period) => set({ period })}
                    options={[
                        { value: 'DAY', label: t('journey.dialog.periodDay') },
                        { value: 'WEEK', label: t('journey.dialog.periodWeek') },
                    ]}
                />
            )}
            <Stepper
                label={daily ? t('journey.dialog.amountDay') : t('journey.dialog.amountWeek')}
                value={form.amount}
                onChange={(amount) => set({ amount, minimumAmount: Math.min(form.minimumAmount, amount) })}
                max={form.measure === 'MINUTES' ? 600 : 300}
                step={form.measure === 'MINUTES' ? 5 : 1}
                display={unit}
            />
            {daily && (
                <div>
                    <Stepper
                        label={t('journey.dialog.minimumLabel')}
                        value={Math.min(form.minimumAmount, form.amount)}
                        onChange={(minimumAmount) => set({ minimumAmount })}
                        max={form.amount}
                        display={unit}
                    />
                    <p className="text-xs text-text-muted mt-2">{t('journey.dialog.minimumHint')}</p>
                </div>
            )}
            {daily && (
                <Chips
                    label={t('journey.dialog.daysLabel')}
                    value={form.daysPerWeek}
                    onChange={(daysPerWeek) => set({ daysPerWeek })}
                    options={[7, 6, 5].map((days) => ({
                        value: days,
                        label: t(`journey.dialog.days${days}`),
                    }))}
                />
            )}
            {finishing && (
                <div>
                    <Chips
                        label={t('journey.dialog.deadlineLabel')}
                        value={form.deadline}
                        onChange={(deadline) => set({ deadline })}
                        options={[
                            { value: null, label: t('journey.dialog.noDeadline') },
                            ...seasons.map((season) => ({ value: season.date, label: t(`journey.seasons.${season.key}`) })),
                            ...(form.deadline && !seasons.some((season) => season.date === form.deadline)
                                ? [{ value: form.deadline, label: formatDay(form.deadline) }] : []),
                        ]}
                    />
                    <label className="flex items-center gap-2 mt-3 text-sm text-text-secondary">
                        {t('journey.dialog.pickDate')}
                        <input
                            type="date"
                            dir="ltr"
                            value={form.deadline || ''}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => set({ deadline: e.target.value || null })}
                            className="px-2 py-1.5 rounded-md border border-border bg-surface text-text-primary"
                        />
                    </label>
                </div>
            )}

            <Preview preview={preview} form={form} unit={unit} onAccept={(amount) => set({ amount, minimumAmount: Math.min(form.minimumAmount, amount) })} />
            {advice ? <SacredText moment="capacity" kind="HADITH" size="sm" /> : daily && <SacredText moment="consistency" kind="HADITH" size="sm" />}
        </div>
    );
}

function Preview({ preview, form, unit, onAccept }) {
    const data = preview.data;
    if (!data) return null;
    const pace = data.pace;
    const lines = [];
    if (pace?.remaining === 0) {
        lines.push(t('journey.preview.alreadyDone'));
    } else {
        if (pace?.finishDate) lines.push(t('journey.preview.finishOn', { date: formatDay(pace.finishDate) }));
        // With a deadline, say what it needs only when the chosen amount falls short of it —
        // "one a day is enough" beside a chosen two reads as a correction nobody asked for.
        if (form.deadline && pace?.perPortion > form.amount) {
            lines.push(t('journey.preview.perPortion', { amount: amountText(form.measure, pace.perPortion, true) }));
        } else if (form.deadline && pace?.finishDate && pace.finishDate <= form.deadline) {
            lines.push(t('journey.preview.beforeDeadline'));
        }
    }
    if (form.kind === 'HABIT' && data.yearlyTotal) {
        // Minutes by the thousand say nothing; a year of them is hours.
        lines.push(t('journey.preview.yearly', {
            amount: form.measure === 'MINUTES' && data.yearlyTotal >= 120
                ? countOf('journey.units.HOURS', Math.round(data.yearlyTotal / 60))
                : unit(data.yearlyTotal),
        }));
    }
    const advice = data.sizeAdvice;
    if (!lines.length && !advice) return null;
    return (
        <div className="rounded-md bg-gold-light/60 border border-gold/40 px-4 py-3 text-sm" aria-live="polite">
            {lines.map((line) => <p key={line}>{line}</p>)}
            {advice && (
                <div className="mt-2">
                    <p>{t('journey.preview.advice', { baseline: amountText(form.measure, Math.max(1, Math.round(advice.baseline)), true), suggested: amountText(form.measure, advice.suggested, true) })}</p>
                    <button type="button" onClick={() => onAccept(advice.suggested)} className="mt-1 text-sm font-semibold text-primary underline">
                        {t('journey.preview.acceptAdvice', { amount: amountText(form.measure, advice.suggested, true) })}
                    </button>
                </div>
            )}
        </div>
    );
}

function TimeStep({ form, set, editing, originalSlot }) {
    const slotOptions = [
        // A slot cannot be taken away in an edit (there is nothing to send that means "none").
        ...(editing && originalSlot ? [] : [{ value: null, label: t('journey.dialog.anyTime') }]),
        ...SLOTS.map((slot) => ({ value: slot, label: t(`journey.slots.${slot}`), hint: t(`journey.slotHours.${slot}`) })),
    ];
    return (
        <div className="flex flex-col gap-6">
            <Chips
                label={t('journey.dialog.slotLabel')}
                value={form.slot}
                onChange={(slot) => set({ slot, fallbackSlot: form.fallbackSlot === slot ? null : form.fallbackSlot })}
                options={slotOptions}
            />
            {form.slot && (
                <>
                    <Chips
                        label={t('journey.dialog.anchorLabel')}
                        value={form.anchor}
                        onChange={(anchor) => set({ anchor })}
                        options={[{ value: null, label: t('journey.dialog.noAnchor') },
                            ...ANCHORS.map((anchor) => ({ value: anchor, label: t(`journey.anchors.${anchor}`) }))]}
                    />
                    {form.anchor === 'CUSTOM' && (
                        <input
                            type="text"
                            dir={form.anchorText ? 'auto' : undefined}
                            maxLength={80}
                            value={form.anchorText}
                            onChange={(e) => set({ anchorText: e.target.value })}
                            placeholder={t('journey.dialog.anchorPlaceholder')}
                            aria-label={t('journey.dialog.anchorPlaceholder')}
                            className="w-full px-3 py-2 rounded-md border border-border bg-surface"
                        />
                    )}
                    <div>
                        <Chips
                            label={t('journey.dialog.fallbackLabel')}
                            value={form.fallbackSlot}
                            onChange={(fallbackSlot) => set({ fallbackSlot })}
                            options={[{ value: null, label: t('journey.dialog.noFallback') },
                                ...SLOTS.filter((slot) => slot !== form.slot).map((slot) => ({ value: slot, label: t(`journey.slots.${slot}`) }))]}
                        />
                        <p className="text-xs text-text-muted mt-2">{t('journey.dialog.fallbackHint')}</p>
                    </div>
                </>
            )}
            <SacredText moment="slots" kind="HADITH" size="sm" />
        </div>
    );
}

function IntentionStep({ form, set }) {
    return (
        <div className="flex flex-col gap-6">
            <Chips
                label={t('journey.dialog.identityLabel')}
                value={form.identityPreset}
                onChange={(identityPreset) => set({ identityPreset })}
                options={[{ value: null, label: t('journey.dialog.noIdentity') },
                    ...IDENTITIES.map((code) => ({ value: code, label: t(`journey.identity.${code}`) }))]}
            />
            <label className="block">
                <span className="block text-sm font-semibold mb-2">{t('journey.dialog.intentionLabel')}</span>
                <textarea
                    dir={form.intentionText ? 'auto' : undefined}
                    rows={3}
                    maxLength={500}
                    value={form.intentionText}
                    onChange={(e) => set({ intentionText: e.target.value })}
                    placeholder={t('journey.dialog.intentionPlaceholder')}
                    className="w-full px-3 py-2 rounded-md border border-border bg-surface font-reading"
                />
                <span className="block text-xs text-text-muted mt-1">{t('journey.dialog.intentionPrivate')}</span>
            </label>
            <SacredText moment="intention" kind="HADITH" size="sm" />
            <div className="rounded-md border border-gold/50 bg-gold-light/50 px-4 py-3">
                <p className="text-xs font-semibold text-gold-ink mb-1">{t('journey.dialog.commitmentTitle')}</p>
                <p dir="auto" className="font-serif text-[1.25rem] leading-snug">{commitmentSentence(form)}</p>
            </div>
        </div>
    );
}

export default GoalDialog;
