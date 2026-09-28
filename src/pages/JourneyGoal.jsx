import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowBack } from '@/components/ui/DirectionalIcon';
import PageShell from '../components/layout/PageShell';
import { QueryState, Cartouche, KhatamProgress, Button, Modal } from '../components/ui';
import { CumulativeLine, DayLegend, DayStars, PaceBar, PausedLine, SacredText, useJourney } from '../components/journey';
import { useArchiveGoal, useGoal, usePauseGoal, useResumeGoal, useUpdateGoal } from '../hooks/useGoals';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { amountText, commitmentSentence, goalTitle, measureOf, resumeHref } from '@/lib/goalText';
import { formatDay } from '@/lib/dayFormat';
import { countOf } from '@/lib/plural';
import { describeError } from '@/lib/describeError';
import { t } from '@/i18n';

/**
 * One goal (PROGRESS-AND-GOALS.md §7.3): the reader's own intention first (§8.2 rule 2), the
 * commitment, where it stands, this week and last, the running total, and the excuse — then
 * editing, and archiving behind an offer to lighten it first (at-Taghabun 16).
 */
function JourneyGoal() {
    const { id } = useParams();
    const goal = useGoal(id);
    const data = goal.data;
    usePageMeta({ title: data ? goalTitle(data) : t('journey.nav.goals') });
    return (
        <PageShell tab>
            <Link to="/journey/goals" className="inline-flex items-center gap-1.5 text-sm font-semibold mb-5">
                <ArrowBack size={16} /> {t('journey.goal.back')}
            </Link>
            <QueryState
                isLoading={goal.isLoading}
                isError={goal.isError}
                error={goal.error}
                onRetry={goal.refetch}
                errorTitle={t('journey.goal.notFound')}
            >
                {data && <GoalBody goal={data} />}
            </QueryState>
        </PageShell>
    );
}

function GoalBody({ goal }) {
    const { editGoal } = useJourney();
    const active = goal.status === 'ACTIVE';
    const measure = measureOf(goal);
    return (
        <div className="flex flex-col gap-10">
            <PausedLine where="journey" />
            <header className="flex flex-col gap-3">
                <h1 dir="auto" className="font-serif text-[2rem] sm:text-[2.4rem] font-semibold leading-tight">{goalTitle(goal)}</h1>
                {goal.intentionText && (
                    <p dir="auto" className="font-reading text-text-secondary">
                        <span className="font-sans font-semibold text-gold-ink">{t('journey.goal.intention')} </span>{goal.intentionText}
                    </p>
                )}
                {goal.identityPreset && <p className="text-sm text-text-muted">{t(`journey.identity.${goal.identityPreset}`)}</p>}
                <p dir="auto" className="text-text-primary">{commitmentSentence(goal)}</p>
                {goal.deadline && <p className="text-sm text-text-secondary">{t('journey.goal.deadline', { date: formatDay(goal.deadline, { day: 'numeric', month: 'long', year: 'numeric' }) })}</p>}
                {!active && <p className="text-sm font-semibold text-gold-ink">{t(`journey.goal.status.${goal.status}`)}</p>}
                {active && (
                    <div className="flex flex-wrap gap-3 mt-1">
                        {!goal.paused && <Link to={resumeHref(goal)} className="px-5 py-2.5 bg-primary text-white rounded-md font-semibold hover:no-underline">
                            {t('journey.today.continue')}
                        </Link>}
                        <Button variant="outline" onClick={() => editGoal(goal)}>{t('journey.goal.edit')}</Button>
                    </div>
                )}
            </header>

            {goal.pace?.total != null && (
                <section className="flex items-center gap-5 p-5 rounded-lg border border-border-light bg-surface">
                    <KhatamProgress
                        value={goal.pace.total ? goal.pace.current / goal.pace.total : 0}
                        title={t('journey.pace.barAria', { current: goal.pace.current, total: amountText(measure, goal.pace.total, true) })}
                        className="w-20 h-20 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0"><PaceBar goal={goal} /></div>
                </section>
            )}

            <section>
                <Cartouche title={goal.period === 'WEEK' ? t('journey.goal.weeks') : t('journey.goal.thisWeek')} />
                <DayStars days={goal.week} weekly={goal.period === 'WEEK'} />
                {goal.lastWeek?.some((day) => day.state !== 'NOT_DUE') && (
                    <div className="mt-5">
                        <p className="text-sm font-semibold text-text-secondary mb-2">{t('journey.goal.lastWeek')}</p>
                        <DayStars days={goal.lastWeek} weekly={goal.period === 'WEEK'} size="sm" />
                    </div>
                )}
                <DayLegend className="mt-4" />
            </section>

            {goal.cumulative?.length > 1 && (
                <section>
                    <Cartouche title={t('journey.cumulative.title')} />
                    <CumulativeLine points={goal.cumulative} measure={measure} total={goal.pace?.total} finishDate={goal.pace?.finishDate} />
                </section>
            )}

            {active && <ExcuseCard goal={goal} />}
            {active && <ArchiveArea goal={goal} />}
        </div>
    );
}

/** «عذر» — travel, illness, anything; no reason is asked (Bukhari 2996). A paused day counts for nothing either way. */
function ExcuseCard({ goal }) {
    const pause = usePauseGoal();
    const resume = useResumeGoal();
    const { showToast } = useToast();
    const onError = (error) => showToast(describeError(error, t('journey.today.actionFailed')), 'error');
    const busy = pause.isPending || resume.isPending;
    return (
        <section className="p-5 rounded-lg border border-border-light bg-surface flex flex-col gap-4">
            <h2 className="font-serif text-[1.5rem] font-semibold">{t('journey.excuse.title')}</h2>
            {goal.paused ? (
                <>
                    <p className="text-sm text-text-secondary">
                        {goal.pausedUntil ? t('journey.excuse.until', { date: formatDay(goal.pausedUntil) }) : t('journey.excuse.untilReturn')}
                    </p>
                    <div>
                        <Button disabled={busy} onClick={() => resume.mutate(goal.id, {
                            onSuccess: () => showToast(t('journey.excuse.resumed'), 'success'), onError,
                        })}>{t('journey.excuse.resume')}</Button>
                    </div>
                </>
            ) : (
                <>
                    <p className="text-sm text-text-secondary">{t('journey.excuse.text')}</p>
                    <div className="flex flex-wrap gap-2">
                        {[1, 3, 7, 14].map((days) => (
                            <Button key={days} variant="outline" size="sm" disabled={busy}
                                    onClick={() => pause.mutate({ id: goal.id, days }, {
                                        onSuccess: () => showToast(t('journey.excuse.paused'), 'success'), onError,
                                    })}>
                                {countOf('journey.units.DAYS', days)}
                            </Button>
                        ))}
                        <Button variant="outline" size="sm" disabled={busy}
                                onClick={() => pause.mutate({ id: goal.id, untilReturn: true }, {
                                    onSuccess: () => showToast(t('journey.excuse.paused'), 'success'), onError,
                                })}>
                            {t('journey.excuse.untilReturnAction')}
                        </Button>
                    </div>
                </>
            )}
            <SacredText moment="excuse" kind="HADITH" size="sm" />
        </section>
    );
}

/** Ending a goal — with the offer to keep only its minimum shown first, when there is one to keep. */
function ArchiveArea({ goal }) {
    const [confirming, setConfirming] = useState(false);
    const archive = useArchiveGoal();
    const update = useUpdateGoal();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const measure = measureOf(goal);
    const canLighten = goal.period === 'DAY' && goal.minimumAmount < goal.amount;
    const onError = (error) => showToast(describeError(error, t('journey.today.actionFailed')), 'error');
    return (
        <section className="pt-6 border-t border-border-light">
            <button type="button" onClick={() => setConfirming(true)} className="text-sm text-text-muted hover:text-text-primary underline">
                {t('journey.archive.open')}
            </button>
            <Modal open={confirming} onClose={() => setConfirming(false)} title={t('journey.archive.title')} maxWidth="480px">
                <div className="flex flex-col gap-5">
                    {canLighten && (
                        <div className="rounded-md border border-gold/50 bg-gold-light/40 p-4 flex flex-col gap-3">
                            <p className="text-sm">{t('journey.archive.lightenFirst', { amount: amountText(measure, goal.minimumAmount, true) })}</p>
                            <SacredText moment="lighten" kind="AYAH" size="sm" />
                            <div>
                                <Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ id: goal.id, amount: goal.minimumAmount }, {
                                    onSuccess: () => { setConfirming(false); showToast(t('journey.today.lightened'), 'success'); },
                                    onError,
                                })}>{t('journey.archive.lighten', { amount: amountText(measure, goal.minimumAmount, true) })}</Button>
                            </div>
                        </div>
                    )}
                    <p className="text-sm text-text-secondary">{t('journey.archive.text')}</p>
                    <div className="flex flex-wrap justify-end gap-3">
                        <Button variant="ghost" onClick={() => setConfirming(false)}>{t('common.cancel')}</Button>
                        <Button variant="outline" disabled={archive.isPending} onClick={() => archive.mutate(goal.id, {
                            onSuccess: () => { showToast(t('journey.archive.done'), 'success'); navigate('/journey/goals'); },
                            onError,
                        })}>{t('journey.archive.confirm')}</Button>
                    </div>
                </div>
            </Modal>
        </section>
    );
}

export default JourneyGoal;
