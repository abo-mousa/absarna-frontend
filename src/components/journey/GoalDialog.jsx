import { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Modal, Button, CalendarPicker, KhatamStar } from '../ui';
import { EmailVerificationNotice } from '../auth';
import { Chips, Stepper } from './controls';
import SacredText from './SacredText';
import { useCreateGoal, useGoalPreview, useUpdateGoal } from '@/hooks/useGoals';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToast } from '@/contexts/ToastContext';
import { hijriDeadlines } from '@/lib/hijriSeasons';
import { amountText, commitmentSentence, goalTitle, measureOf } from '@/lib/goalText';
import { SLOTS, slotOfTime } from '@/lib/slots';
import { describeError } from '@/lib/describeError';
import { formatDay, localDay } from '@/lib/dayFormat';
import { countOf } from '@/lib/plural';
import { t } from '@/i18n';

const ANCHORS = ['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA', 'MORNING_ADHKAR', 'COMMUTE', 'CUSTOM'];
/**
 * The part of the day a prayer usually falls in — a starting choice, never a calculation: the
 * platform asks for no location (PROGRESS-AND-GOALS.md D2), so the reader may move it (a winter
 * Maghrib before six is the case). Whatever the reader picks, the goal stores ONE slot, and that
 * slot is all Today, the fallback and the review read; the anchor and the hour only describe it.
 */
const PRAYER_SLOT = { FAJR: 'GHADWA', MORNING_ADHKAR: 'GHADWA', DHUHR: 'RAWHA', ASR: 'RAWHA', MAGHRIB: 'DULJA', ISHA: 'DULJA' };
/** How the time step refines a part of the day: after a prayer or a habit, at an hour, or not at all. */
const whenOf = (form) => (form.atTime ? 'HOUR' : form.anchor || null);

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
        // "HH:MM" for the time input; the API answers "HH:MM:SS".
        atTime: source.atTime ? source.atTime.slice(0, 5) : '',
        anchor: source.anchor || null,
        anchorText: source.anchorText || '',
        identityPreset: source.identityPreset || null,
        identityText: source.identityText || '',
        intentionText: source.intentionText || '',
    };
    form.measure = measureOf(form);
    // Its own field: «في ساعة أحدّدها» chosen with no hour typed yet is still that choice.
    form.when = whenOf(form);
    return form;
}

/**
 * «اعقد العزم» — starting or editing a goal (PROGRESS-AND-GOALS.md §7.3, the `Wird` board).
 *
 * <p>What the goal pursues is chosen before the dialog opens — on `/journey/choose`, a programme
 * or book page's «اجعله وِردًا», or a proposal — and stays pinned at the top. Steps, each one
 * screen: how much
 * (with the minimum, the days a week and a deadline, and a live preview of where it leads), when
 * (a daily portion only), and why — then the whole commitment read back as one sentence. Each
 * step carries at most one text, at the moment it speaks to (§8.1): consistency beside the
 * minimum, capacity only when the amount is far above what the reader has been doing, the three
 * times of day on the time step, the intention on the last.
 *
 * <p>An unverified reader gets the verification notice instead of a form that fails on its last
 * step (§7.10); the backend's refusal is the one that counts.
 */
function GoalDialog({ open, onClose, goal = null, prefill = null, unverified = false, onCreated = null }) {
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
                : open && <GoalForm key={goal?.id ?? JSON.stringify(prefill)} goal={goal} prefill={prefill} onDone={onClose} onCreated={onCreated} />}
        </Modal>
    );
}

function GoalForm({ goal, prefill, onDone, onCreated }) {
    const editing = !!goal;
    const [form, setForm] = useState(() => initialForm(goal, prefill));
    const set = (patch) => setForm((current) => ({ ...current, ...patch }));
    const steps = useMemo(() => [
        'amount',
        ...(form.period === 'DAY' ? ['time'] : []),
        'intention',
    ], [form.period]);
    const [stepIndex, setStepIndex] = useState(0);
    const step = steps[Math.min(stepIndex, steps.length - 1)];
    const last = stepIndex >= steps.length - 1;
    const [error, setError] = useState(null);

    const create = useCreateGoal();
    const update = useUpdateGoal();
    const { showToast } = useToast();
    const saving = create.isPending || update.isPending;

    // The preview belongs to the dialog, not to one step: fetched once per change of the numbers,
    // kept while the next answer loads, and not thrown away when the reader moves between steps —
    // which is what made it look slow and "refresh".
    const daily = form.period === 'DAY';
    const body = useDebouncedValue(useMemo(() => ({
        kind: form.kind,
        targetId: form.kind === 'HABIT' ? undefined : form.targetId,
        measure: form.kind === 'HABIT' ? form.measure : undefined,
        period: form.period,
        amount: form.amount,
        minimumAmount: daily ? Math.min(form.minimumAmount, form.amount) : undefined,
        daysPerWeek: daily ? form.daysPerWeek : undefined,
        deadline: form.deadline || undefined,
    }), [form.kind, form.targetId, form.measure, form.period, form.amount, form.minimumAmount, form.daysPerWeek, form.deadline, daily]), 300);
    const preview = useGoalPreview(body, !!body.kind);

    const canContinue = step !== 'time' || form.when !== 'HOUR' || !!form.atTime;

    const submit = () => {
        setError(null);
        const shared = {
            amount: form.amount,
            minimumAmount: form.period === 'DAY' ? Math.min(form.minimumAmount, form.amount) : undefined,
            daysPerWeek: form.period === 'DAY' ? form.daysPerWeek : undefined,
            slot: form.period === 'DAY' ? form.slot || undefined : undefined,
            fallbackSlot: form.period === 'DAY' && form.slot ? form.fallbackSlot || undefined : undefined,
            atTime: form.period === 'DAY' && form.atTime ? form.atTime : undefined,
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
                // "Any time" again: the backend drops the fallback, the hour and the anchor with it.
                clearSlot: goal.slot && !shared.slot ? true : undefined,
                clearFallbackSlot: goal.fallbackSlot && !shared.fallbackSlot ? true : undefined,
                clearAtTime: goal.atTime && !shared.atTime ? true : undefined,
                clearAnchor: goal.anchor && !shared.anchor ? true : undefined,
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
            onSuccess: () => { showToast(t('journey.dialog.created'), 'success'); onDone(); onCreated?.(); },
            onError,
        });
    };

    return (
        <div className="flex flex-col gap-6">
            {/* What is being committed to stays in view through every step: the reader chose it on
                the choosing page, and «كم» and «متى» mean nothing without it. */}
            {!editing && form.kind !== 'HABIT' && form.title && (
                <div className="flex items-center gap-3 rounded-lg bg-text-primary text-bg px-4 py-3">
                    <KhatamStar className="w-8 h-8 text-gold flex-shrink-0" strokeWidth={8} />
                    <div className="min-w-0">
                        <span className="block text-xs font-bold text-gold">{t('journey.dialog.yourWird')}</span>
                        <span dir="auto" className="block font-semibold truncate">{form.title}</span>
                    </div>
                </div>
            )}
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

            {step === 'amount' && <AmountStep form={form} set={set} editing={editing} preview={preview} />}
            {step === 'time' && <TimeStep form={form} set={set} />}
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

/** How much, how often, and by when — with the preview answering where that leads. */
function AmountStep({ form, set, editing, preview }) {
    // Our calendar, opened under the deadline chips — the platform's spoke Gregorian in the browser's language.
    const [picking, setPicking] = useState(false);
    const daily = form.period === 'DAY';
    const finishing = form.kind !== 'HABIT';
    const seasons = useMemo(() => (finishing ? hijriDeadlines() : []), [finishing]);
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
                    <button
                        type="button"
                        onClick={() => setPicking((open) => !open)}
                        aria-expanded={picking}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                    >
                        <CalendarDays size={16} aria-hidden="true" />
                        {t('journey.dialog.pickDate')}
                    </button>
                    {picking && (
                        <div className="mt-3 p-3 rounded-lg border border-border-light bg-surface">
                            <CalendarPicker
                                value={form.deadline}
                                onChange={(deadline) => { set({ deadline }); setPicking(false); }}
                                // Tomorrow, on the reader's clock: the backend refuses today, and the
                                // UTC date is yesterday's for an evening in Riyadh.
                                min={localDay(new Date(Date.now() + 86_400_000))}
                                marks={Object.fromEntries(seasons.map((season) => [season.date, t(`journey.seasons.${season.key}`)]))}
                            />
                        </div>
                    )}
                </div>
            )}

            <Preview preview={preview} form={form} unit={unit} onAccept={(amount) => set({ amount, minimumAmount: Math.min(form.minimumAmount, amount) })} />
            {advice ? <SacredText moment="capacity" kind="HADITH" size="sm" /> : daily && <SacredText moment="consistency" kind="HADITH" size="sm" />}
        </div>
    );
}

function Preview({ preview, form, unit, onAccept }) {
    const data = preview.data || {};
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
    if (form.kind === 'HABIT') lines.push(yearlyLine(form, unit));
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

/**
 * «١٥ دقيقة كل يوم تصير في سنة ٩١ ساعة» — what a small portion adds up to, which is the reason to
 * keep a small one. Worked out here rather than asked for: it is arithmetic (the amount, the days a
 * week, fifty-two weeks) and it should change the moment the stepper does.
 */
function yearlyLine(form, unit) {
    const daily = form.period === 'DAY';
    const days = daily ? form.daysPerWeek || 7 : 1;
    const total = form.amount * days * 52;
    const cadence = !daily ? t('journey.preview.everyWeek')
        : days === 7 ? t('journey.preview.everyDay') : t('journey.preview.daysAWeek', { days });
    // Minutes by the thousand say nothing; a year of them is hours.
    const inAYear = form.measure === 'MINUTES' && total >= 120
        ? countOf('journey.units.HOURS', Math.round(total / 60))
        : unit(total);
    return t('journey.preview.yearly', { amount: unit(form.amount), cadence, total: inAYear });
}

/**
 * When: first the part of the day — or none — with its hours beside it, then, once one is chosen,
 * how the reader would describe it: after a prayer or a habit, or at an hour. Two short rows
 * rather than one wall of eleven chips (product owner's review, 2026-09-29). A prayer moves the
 * part of the day to its usual one (PRAYER_SLOT), which the reader may move back; an hour decides
 * it outright, as the backend does.
 */
function TimeStep({ form, set }) {
    const { when } = form;
    const chooseSlot = (slot) => {
        if (slot === null) set({ when: null, slot: null, fallbackSlot: null, anchor: null, atTime: '', anchorText: '' });
        else set({ slot, fallbackSlot: form.fallbackSlot === slot ? null : form.fallbackSlot, ...(form.atTime ? { when: null, atTime: '' } : {}) });
    };
    const refine = (value) => {
        if (value === null) set({ when: null, anchor: null, atTime: '', anchorText: '' });
        else if (value === 'HOUR') set({ when: value, anchor: null, anchorText: '' });
        else {
            const slot = PRAYER_SLOT[value] || form.slot;
            set({ when: value, anchor: value, atTime: '', slot, fallbackSlot: form.fallbackSlot === slot ? null : form.fallbackSlot });
        }
    };
    const slotOptions = [
        { value: null, label: t('journey.dialog.anyTime') },
        ...SLOTS.map((slot) => ({ value: slot, label: t(`journey.slots.${slot}`), hint: t(`journey.slotHours.${slot}`) })),
    ];
    const refineOptions = [
        { value: null, label: t('journey.dialog.refineNone') },
        ...ANCHORS.map((anchor) => ({ value: anchor, label: t(`journey.anchors.${anchor}`) })),
        { value: 'HOUR', label: t('journey.dialog.atHour') },
    ];
    return (
        <div className="flex flex-col gap-6">
            <div>
                <Chips label={t('journey.dialog.whenLabel')} value={form.slot} onChange={chooseSlot} options={slotOptions} />
                <p className="text-xs text-text-muted mt-2">{t('journey.dialog.slotsExplain')}</p>
            </div>
            {form.slot && (
                <div>
                    <Chips label={t('journey.dialog.refineLabel')} value={when} onChange={refine} options={refineOptions} />
                    {PRAYER_SLOT[when] && <p className="text-xs text-text-muted mt-2">{t('journey.dialog.prayerSlotHint')}</p>}
                </div>
            )}
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
            {when === 'HOUR' && (
                <label className="block">
                    <span className="block text-sm font-semibold mb-2">{t('journey.dialog.hourLabel')}</span>
                    <input
                        type="time"
                        value={form.atTime}
                        onChange={(e) => {
                            const atTime = e.target.value;
                            const slot = atTime ? slotOfTime(atTime) : form.slot;
                            set({ atTime, slot, fallbackSlot: form.fallbackSlot === slot ? null : form.fallbackSlot });
                        }}
                        className="px-3 py-2 rounded-md border border-border bg-surface tabular-nums"
                    />
                    {form.atTime && (
                        <span className="block text-xs text-text-muted mt-2">
                            {t('journey.dialog.hourSlot', { slot: t(`journey.slots.${form.slot}`) })}
                        </span>
                    )}
                </label>
            )}
            {form.slot && (
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
            )}
            <SacredText moment="slots" kind="HADITH" size="sm" />
        </div>
    );
}

/**
 * Why: the reader's own words, and nothing to pick from. The three ready-made sentences
 * («أنا ممّن يُتمّ ما بدأه»…) stood here and were dropped (product owner's review, 2026-09-29):
 * a canned identity is the one habit-book mechanic on the page, and a reader's intention says
 * more than a label they chose. A goal that already carries one keeps it; nothing new is offered.
 */
function IntentionStep({ form, set }) {
    return (
        <div className="flex flex-col gap-6">
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
