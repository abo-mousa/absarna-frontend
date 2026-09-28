import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cartouche, KhatamProgress, KhatamStar, Button } from '../ui';
import SacredText from './SacredText';
import { useJourney } from './journeyContext';
import { useCarry, useStartQada, useUpdateGoal } from '@/hooks/useGoals';
import { useToast } from '@/contexts/ToastContext';
import { orderPortions, shownSlot } from '@/lib/journey';
import { beforeNoon, slotOf } from '@/lib/slots';
import { amountText, anchorName, goalTitle, isolate, measureOf, resumeHref, slotName, tomorrowText } from '@/lib/goalText';
import { safeStorage } from '@/lib/safeStorage';
import { describeError } from '@/lib/describeError';
import { t } from '@/i18n';

const FIRST_HIDDEN_KEY = 'absarna.firstWirdHiddenAt';
const FIRST_HIDDEN_MS = 14 * 86_400_000;
const MILESTONES_SEEN_KEY = 'absarna.milestonesSeen';

/**
 * Yesterday's missed portion, before noon — first on Today, above the day's own portions
 * (PROGRESS-AND-GOALS.md §7.7). «تداركه» marks this tab's reports about the goal's programme or book
 * as yesterday's until noon, and takes the reader to where it resumes.
 */
export function QadaCards({ goals, now }) {
    const navigate = useNavigate();
    const qada = useStartQada();
    const { showToast } = useToast();
    const due = beforeNoon(now) ? goals.filter((goal) => goal.qadaCreditDay) : [];
    if (!due.length) return null;
    return (
        <section className="flex flex-col gap-3 p-5 rounded-lg border border-gold/50 bg-gold-light/40" aria-labelledby="qada-title">
            <h2 id="qada-title" className="font-serif text-[1.5rem] font-semibold leading-tight">{t('journey.today.qadaTitle')}</h2>
            {due.map((goal) => (
                <div key={goal.id} className="flex flex-wrap items-center gap-3">
                    <p className="flex-1 min-w-[14rem] text-sm text-text-secondary">
                        <span dir="auto" className="font-semibold text-text-primary">{goalTitle(goal)}</span>
                        {' — '}{t('journey.today.qadaText')}
                    </p>
                    <Button
                        size="sm"
                        disabled={qada.isPending}
                        onClick={() => qada.mutate(goal, {
                            onSuccess: () => navigate(resumeHref(goal)),
                            onError: (error) => showToast(describeError(error, t('journey.today.actionFailed')), 'error'),
                        })}
                    >
                        {t('journey.today.qadaAction')}
                    </Button>
                </div>
            ))}
            <SacredText moment="qada" kind="HADITH" size="sm" />
        </section>
    );
}

/**
 * «وِردك اليوم» — every portion of the day, every visit (§2, decision 6): the one whose time is now
 * first and emphasised, the later ones plainly and open to doing early, a passed one still there
 * and still open, a done one kept with where tomorrow starts. Nothing is hidden and nothing is red.
 * Under them: the weekly goals as one line each, yesterday's portion to add to today after noon,
 * the Friday review, a milestone just reached.
 *
 * <p>The clock decides current / later / passed here, not the server: Today is cached until the day
 * ends and the slot moves under it (`lib/journey.js`).
 */
function WirdToday({ wird, reviewOpen, recentMilestones, now, hasQada }) {
    const goals = wird?.goals || [];
    if (!goals.length) {
        return <FirstWird proposals={wird?.firstWird || []} />;
    }
    const portions = orderPortions(goals, now);
    const weekly = goals.filter((goal) => goal.period === 'WEEK');
    const carries = beforeNoon(now) ? [] : goals.filter((goal) => goal.carryAmount);
    const lighten = goals.find((goal) => goal.suggestLighten);
    // One text on the section, the action-bound before the ambient (§8.2): the make-up card above
    // carries its own, so the morning du'a waits for a morning with nothing to make up.
    const text = lighten ? { moment: 'lighten' }
        : carries.length ? { moment: 'returning' }
            : !hasQada && slotOf(now) === 'GHADWA' ? { moment: 'morning' } : null;

    return (
        <section>
            <Cartouche title={t('journey.today.title')} action={<Link to="/journey">{t('journey.today.toJourney')}</Link>} />
            <div className="flex flex-col gap-4">
                {portions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {portions.map(({ goal, view }) => <PortionCard key={goal.id} goal={goal} view={view} />)}
                    </div>
                )}
                {weekly.map((goal) => (
                    <p key={goal.id} className="text-sm text-text-secondary">
                        <Link to={`/journey/goals/${goal.id}`} dir="auto" className="font-semibold">{goalTitle(goal)}</Link>
                        {' — '}{t('journey.today.weekly', {
                            done: goal.today?.units || 0,
                            target: amountText(measureOf(goal), goal.today?.target || goal.amount, true),
                        })}
                    </p>
                ))}
                {carries.map((goal) => <CarryLine key={goal.id} goal={goal} />)}
                {lighten && <LightenLine goal={lighten} />}
                {text && <SacredText moment={text.moment} kind="HADITH" size="sm" />}
                {reviewOpen && (
                    <Link to="/journey?review=1" className="flex items-center gap-2 text-sm font-semibold hover:no-underline">
                        <KhatamStar className="w-3.5 h-3.5 text-gold" />
                        {t('journey.today.reviewOpen')}
                    </Link>
                )}
                <MilestoneLine codes={recentMilestones} />
            </div>
        </section>
    );
}

function PortionCard({ goal, view }) {
    const measure = measureOf(goal);
    const units = goal.today?.units || 0;
    const target = goal.today?.target || goal.amount;
    const slot = shownSlot(goal, view);
    const anchor = anchorName(goal);
    const when = slot ? [slotName(slot), anchor].filter(Boolean).join(' · ') : t('journey.today.anyTime');
    const done = view.status === 'done';
    const current = view.status === 'current';
    const tomorrow = done ? tomorrowText(goal) : null;
    const status = {
        done: t('journey.today.done'),
        kept: t('journey.today.kept'),
        excused: t('journey.today.excused'),
        current: view.moved ? t('journey.today.moved') : null,
        later: t('journey.today.later'),
        passed: t('journey.today.passed'),
    }[view.status];

    return (
        <article className={`flex flex-col gap-3 p-4 rounded-lg border bg-surface ${
            current ? 'border-gold shadow-sm' : 'border-border-light'
        } ${view.status === 'excused' ? 'opacity-70' : ''}`}>
            <div className="flex items-start gap-3">
                <KhatamProgress
                    value={Math.min(1, target ? units / target : 0)}
                    title={t('journey.today.progressAria', { done: units, target: amountText(measure, target, true) })}
                    traceClassName={done ? 'text-gold' : 'text-primary'}
                    className="w-12 h-12 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold ${current ? 'text-gold-ink' : 'text-text-muted'}`}>{when}</p>
                    <Link to={`/journey/goals/${goal.id}`} dir="auto"
                          className="block font-bold text-text-primary truncate hover:no-underline hover:text-primary">
                        {goalTitle(goal)}
                    </Link>
                    <p className="text-sm text-text-secondary">
                        {done
                            ? amountText(measure, units)
                            : t('journey.today.progress', { done: units, target: amountText(measure, target, true) })}
                    </p>
                </div>
            </div>
            {status && (
                <p className={`flex items-center gap-1.5 text-sm ${done || view.status === 'kept' ? 'font-semibold text-gold-ink' : 'text-text-secondary'}`}>
                    {done && <KhatamStar className="w-3.5 h-3.5 text-gold" />}
                    {view.status === 'kept' && <KhatamStar className="w-3.5 h-3.5 text-primary" />}
                    {status}
                </p>
            )}
            {tomorrow && <p className="text-xs text-text-muted">{tomorrow}</p>}
            {!done && view.status !== 'excused' && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link
                        to={resumeHref(goal)}
                        className={`px-4 py-2 rounded-md text-sm font-semibold hover:no-underline ${
                            current ? 'bg-primary text-white' : 'border border-border text-text-primary hover:border-primary'
                        }`}
                    >
                        {units > 0 ? t('journey.today.continue') : current ? t('journey.today.start') : t('journey.today.startEarly')}
                    </Link>
                    {current && goal.minimumAmount < target && (
                        <span className="text-xs text-text-muted">
                            {t('journey.today.minimumEnough', { minimum: amountText(measure, goal.minimumAmount) })}
                        </span>
                    )}
                </div>
            )}
        </article>
    );
}

function CarryLine({ goal }) {
    const carry = useCarry();
    const { showToast } = useToast();
    const measure = measureOf(goal);
    return (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-md border border-dashed border-border text-sm text-text-secondary">
            <p className="flex-1 min-w-[14rem]">
                {t('journey.today.carryText', { title: isolate(goalTitle(goal)), amount: amountText(measure, goal.carryAmount, true) })}
            </p>
            <button
                type="button"
                disabled={carry.isPending}
                onClick={() => carry.mutate(goal.id, {
                    onSuccess: () => showToast(t('journey.today.carried'), 'success'),
                    onError: (error) => showToast(describeError(error, t('journey.today.actionFailed')), 'error'),
                })}
                className="font-semibold text-primary hover:underline disabled:opacity-50"
            >
                {t('journey.today.carryAction')}
            </button>
        </div>
    );
}

/** After two missed days: offer the minimum as the portion, never a reproach (§8.1 `lighten`). */
function LightenLine({ goal }) {
    const update = useUpdateGoal();
    const { showToast } = useToast();
    const measure = measureOf(goal);
    if (goal.minimumAmount >= goal.amount) return null;
    return (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-md bg-surface border border-border-light text-sm text-text-secondary">
            <p className="flex-1 min-w-[14rem]">
                {t('journey.today.lightenText', { title: isolate(goalTitle(goal)), amount: amountText(measure, goal.minimumAmount, true) })}
            </p>
            <button
                type="button"
                disabled={update.isPending}
                onClick={() => update.mutate({ id: goal.id, amount: goal.minimumAmount }, {
                    onSuccess: () => showToast(t('journey.today.lightened'), 'success'),
                    onError: (error) => showToast(describeError(error, t('journey.today.actionFailed')), 'error'),
                })}
                className="font-semibold text-primary hover:underline disabled:opacity-50"
            >
                {t('journey.today.lightenAction')}
            </button>
        </div>
    );
}

/** A milestone reached this week, said once — the milestones page keeps it after that. */
function MilestoneLine({ codes }) {
    const [code] = useState(() => {
        const seen = readJson(MILESTONES_SEEN_KEY, []);
        return (codes || []).find((candidate) => !seen.includes(candidate)) || null;
    });
    useEffect(() => {
        if (!code) return;
        const seen = readJson(MILESTONES_SEEN_KEY, []);
        safeStorage.setItem(MILESTONES_SEEN_KEY, JSON.stringify([...new Set([...seen, code])]));
    }, [code]);
    if (!code) return null;
    return (
        <Link to="/journey/milestones" className="flex items-center gap-2 text-sm font-semibold text-gold-ink hover:no-underline">
            <KhatamStar className="w-4 h-4 text-gold" />
            {t('journey.today.milestone', { name: t(`journey.milestones.names.${code}`) })}
        </Link>
    );
}

function readJson(key, fallback) {
    try {
        return JSON.parse(safeStorage.getItem(key) || 'null') ?? fallback;
    } catch {
        return fallback;
    }
}

/**
 * For a reader with no portion yet: «اجعل لك وِردًا صغيرًا», with up to three one-tap proposals
 * built from what they already started. «ليس الآن» puts it away for two weeks in this browser — an
 * invitation that cannot be declined turns into a nag.
 */
function FirstWird({ proposals }) {
    const { openGoal } = useJourney();
    const [hidden, setHidden] = useState(() =>
        Date.now() - (Number(safeStorage.getItem(FIRST_HIDDEN_KEY)) || 0) < FIRST_HIDDEN_MS);
    if (!proposals.length || hidden) return null;
    const hide = () => {
        safeStorage.setItem(FIRST_HIDDEN_KEY, String(Date.now()));
        setHidden(true);
    };
    return (
        <section className="flex flex-col gap-4 p-5 rounded-lg border border-border-light bg-surface">
            <div className="flex items-start gap-3">
                <KhatamStar filled={false} strokeWidth={8} className="w-7 h-7 flex-shrink-0 text-gold mt-1" />
                <div>
                    <h2 className="font-serif text-[1.5rem] font-semibold leading-tight">{t('journey.first.title')}</h2>
                    <p className="text-sm text-text-secondary mt-1">{t('journey.first.text')}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {proposals.map((proposal) => (
                    <button
                        key={`${proposal.kind}-${proposal.targetId ?? proposal.measure}`}
                        type="button"
                        onClick={() => openGoal(proposal)}
                        className="text-start px-4 py-2.5 rounded-md border border-border bg-bg hover:border-primary max-w-full"
                    >
                        <span dir="auto" className="block text-sm font-semibold text-text-primary truncate">
                            {proposal.kind === 'HABIT' ? t(`journey.habit.${proposal.measure}`) : proposal.title}
                        </span>
                        <span className="block text-xs text-text-muted">
                            {t('journey.first.perDay', { amount: amountText(proposal.measure, proposal.amount) })}
                        </span>
                    </button>
                ))}
            </div>
            <SacredText moment="consistency" kind="HADITH" size="sm" />
            <div className="flex flex-wrap items-center gap-4 text-sm">
                <button type="button" onClick={() => openGoal()} className="font-semibold text-primary hover:underline">
                    {t('journey.first.choose')}
                </button>
                <button type="button" onClick={hide} className="text-text-muted hover:text-text-primary">
                    {t('journey.first.notNow')}
                </button>
            </div>
        </section>
    );
}

export default WirdToday;
