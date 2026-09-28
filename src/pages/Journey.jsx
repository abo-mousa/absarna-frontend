import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Target } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { PageHeader, QueryState, Cartouche, KhatamProgress, KhatamStar, EmptyState, Button } from '../components/ui';
import { DayLegend, DayStar, GoalRow, JourneyNav, PausedLine, ReviewSheet, SacredText, useJourney } from '../components/journey';
import { useProgressOverview, useWeeklyReview } from '../hooks/useProgress';
import { usePageMeta } from '../hooks/usePageMeta';
import { amountText, goalTitle, isolate } from '@/lib/goalText';
import { countOf } from '@/lib/plural';
import { formatDay, localDay, weekdayName } from '@/lib/dayFormat';
import { formatCount } from '@/lib/numbers';
import { KEPT, fullWeek } from '@/lib/journey';
import { t } from '@/i18n';

/**
 * «مسيرتي» — where the portion is planned and reflected on (PROGRESS-AND-GOALS.md §7.3, the `Main`
 * and `Phone` boards); Today is where it is done. The week's intention, one text chosen by the
 * reader's state, the goals, what is nearly finished, twelve weeks of steadiness, the Hijri month
 * so far, the finished shelf — and then it ends.
 *
 * <p>Every number is a mirror for the reader alone: nothing is ranked, compared or suggested from it.
 */
function Journey() {
    usePageMeta({ title: t('journey.title') });
    const overview = useProgressOverview();
    const review = useWeeklyReview();
    const { openGoal } = useJourney();
    const [params, setParams] = useSearchParams();
    const reviewRequested = params.get('review') === '1';
    const [reviewOpen, setReviewOpen] = useState(reviewRequested);
    const closeReview = () => {
        setReviewOpen(false);
        if (reviewRequested) setParams({}, { replace: true });
    };
    const data = overview.data;
    // «قاربتَ على الإتمام» must be true of what it lists: the backend orders by nearness, and
    // a programme one episode in is not nearly finished.
    const almostDone = (data?.almostDone || []).filter((item) => item.fraction >= 0.5);

    return (
        <PageShell tab>
            <PageHeader title={t('journey.title')} action={<JourneyNav />} tabs />
            <QueryState
                isLoading={overview.isLoading}
                isError={overview.isError}
                error={overview.error}
                onRetry={overview.refetch}
                errorTitle={t('journey.loadFailed')}
            >
                {data && (
                    <div className="flex flex-col gap-10">
                        <PausedLine where="journey" />
                        {review.data?.open && (
                            <section className="flex flex-wrap items-center gap-4 p-5 rounded-lg border border-gold/50 bg-gold-light/40">
                                <KhatamStar className="w-6 h-6 text-gold flex-shrink-0" />
                                <div className="flex-1 min-w-[14rem]">
                                    <h2 className="font-serif text-[1.5rem] font-semibold leading-tight">{t('journey.review.bannerTitle')}</h2>
                                    <p className="text-sm text-text-secondary mt-1">
                                        {review.data.savedAt ? t('journey.review.bannerSaved') : t('journey.review.bannerText')}
                                    </p>
                                </div>
                                <Button onClick={() => setReviewOpen(true)}>
                                    {review.data.savedAt ? t('journey.review.reopen') : t('journey.review.open')}
                                </Button>
                            </section>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-5">
                            <WeekIntention intention={data.weekIntention} goal={data.goals.find((goal) => goal.id === data.weekIntention?.goalId)} onStart={() => openGoal()} />
                            <div className="p-5 rounded-lg border border-border-light bg-surface flex flex-col justify-center">
                                <SacredText moment={stateMoment(data)} kind="AYAH" />
                            </div>
                        </div>

                        <section>
                            <Cartouche
                                title={t('journey.goalsTitle')}
                                action={data.goals.length > 0 && (
                                    <button type="button" onClick={() => openGoal()} className="text-primary font-semibold hover:underline">
                                        {t('journey.newGoal')}
                                    </button>
                                )}
                            />
                            {data.goals.length > 0 && <DayLegend className="mb-4" />}
                            {data.goals.length ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.goals.map((goal) => <GoalRow key={goal.id} goal={goal} />)}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Target}
                                    title={t('journey.noGoalsTitle')}
                                    description={t('journey.noGoalsText')}
                                    action={<Button onClick={() => openGoal()}>{t('journey.startFirst')}</Button>}
                                />
                            )}
                        </section>

                        {almostDone.length > 0 && (
                            <section>
                                <Cartouche title={t('journey.almostDoneTitle')} />
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {almostDone.map((item) => <AlmostDoneCard key={`${item.kind}-${item.id}`} item={item} />)}
                                </div>
                            </section>
                        )}

                        {/* Only once a week has learning in it, as the month below hides its zeros: twelve empty
                            stars over «٠ من آخر ١٢» greet a reader who has not started with a verdict. Not
                            tied to goals — it counts any learning, with or without one. */}
                        {data.weeks12.some((week) => week.active) && (
                            <section>
                                <Cartouche title={t('journey.steadyTitle')} />
                                <WeekFlags weeks={data.weeks12} />
                            </section>
                        )}

                        {data.month && <MonthNumbers month={data.month} />}

                        {data.recentCompletions.length > 0 && (
                            <section>
                                <Cartouche title={t('journey.shelfTitle')} />
                                <ul className="flex flex-wrap gap-3">
                                    {data.recentCompletions.map((completion) => (
                                        <li key={completion.id}>
                                            <Link
                                                to={completion.kind === 'BOOK' ? `/books/${completion.itemId}` : `/series/${completion.itemId}`}
                                                className="flex items-center gap-2 px-3.5 py-2 rounded-md border border-gold/40 bg-gold-light/30 text-sm font-semibold text-text-primary hover:no-underline hover:border-gold"
                                            >
                                                <KhatamStar className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                                <span dir="auto" className="truncate max-w-[16rem]">{completion.titleSnapshot}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <footer className="text-center pt-2 pb-2">
                            <div className="flex items-center justify-center gap-3 mb-3" aria-hidden="true">
                                <span className="h-px w-24 bg-border" />
                                <KhatamStar className="w-5 h-5 text-gold" />
                                <span className="h-px w-24 bg-border" />
                            </div>
                            <p className="text-sm text-text-muted">{t('journey.colophon')}</p>
                        </footer>
                    </div>
                )}
            </QueryState>
            <ReviewSheet open={reviewOpen && !!review.data} onClose={closeReview} review={review.data} goals={data?.goals || []} />
        </PageShell>
    );
}

/** Which text the overview shows, by the reader's state (§8.2 rule 5). */
function stateMoment(data) {
    const weekAgo = Date.now() - 7 * 86_400_000;
    if (data.recentCompletions.some((completion) => Date.parse(completion.completedAt) >= weekAgo)) return 'completion';
    const intention = data.weekIntention;
    if (intention && intention.amount && intention.done >= intention.amount) return 'weekDone';
    if (data.goals.some((goal) => goal.suggestLighten)) return 'lighten';
    if (data.goals.some((goal) => goal.paused)) return 'excuse';
    return 'dailyVerse';
}

/**
 * The primary goal's week. A daily portion is its seven days, Saturday to Friday, each a star, with
 * today marked and one sentence either side — what was intended, and how it stands (product owner,
 * 2026-09-28: the single large star read as decoration). A weekly amount keeps the large star.
 */
function WeekIntention({ intention, goal, onStart }) {
    if (!intention) {
        return (
            <div className="p-5 rounded-lg border border-border-light bg-surface flex flex-col items-start gap-3">
                <h2 className="font-serif text-[1.5rem] font-semibold">{t('journey.intention.title')}</h2>
                <p className="text-sm text-text-secondary">{t('journey.intention.none')}</p>
                <Button variant="outline" size="sm" onClick={onStart}>{t('journey.startFirst')}</Button>
            </div>
        );
    }
    const unit = (count, oblique = false) => (intention.days
        ? countOf('journey.units.DAYS', count, { oblique }) : amountText(intention.measure, count, oblique));
    const met = intention.done >= intention.amount;
    if (intention.days && goal?.week?.length) {
        // The learning day turns at 03:00 (LearningDay), so the small hours still belong to yesterday.
        const today = localDay(new Date(Date.now() - 3 * 3_600_000));
        const week = fullWeek(goal.week);
        const left = week.filter((day) => day.day >= today && !KEPT.has(day.state)).length;
        const needed = Math.max(0, intention.amount - intention.done);
        return (
            <Link to={`/journey/goals/${intention.goalId}`}
                  className="p-5 rounded-lg border border-border-light bg-surface flex flex-col gap-4 text-text-primary hover:no-underline hover:border-border">
                <h2 className="font-serif text-[1.5rem] font-semibold">{t('journey.intention.title')}</h2>
                <p className="text-sm text-text-secondary">
                    {t('journey.intention.days', {
                        what: isolate(goalTitle(goal)),
                        days: countOf('journey.units.DAYS', intention.amount, { oblique: true }),
                    })}
                </p>
                <ul className="grid grid-cols-7 gap-1" aria-hidden="true">
                    {week.map((day) => {
                        const isToday = day.day === today;
                        return (
                            <li key={day.day}
                                className={`flex flex-col items-center gap-1 py-1.5 rounded-md text-[0.7rem] ${isToday ? 'bg-primary-light text-primary font-bold' : 'text-text-muted'}`}>
                                <DayStar state={day.state} className="w-6 h-6" />
                                <span>{isToday ? t('journey.intention.today') : weekdayName(day.day)}</span>
                            </li>
                        );
                    })}
                </ul>
                <p className="text-sm">
                    {met ? t('journey.today.intentionMet') : (
                        <>
                            {intention.done > 0
                                ? t('journey.intention.kept', {
                                    done: countOf('journey.units.DAYS', intention.done, { oblique: true }),
                                    amount: formatCount(intention.amount),
                                })
                                : t('journey.intention.keptNone', { amount: formatCount(intention.amount) })}{' '}
                            {needed <= left
                                ? t('journey.intention.left', {
                                    left: countOf('journey.units.DAYS', left),
                                    needed: countOf('journey.units.DAYS', needed),
                                })
                                : t('journey.intention.leftShort', { left: countOf('journey.units.DAYS', left) })}
                        </>
                    )}
                </p>
                <span className="sr-only">
                    {week.map((day) => `${weekdayName(day.day, 'long')}: ${t(`journey.states.${day.state}`)}`).join('، ')}
                </span>
            </Link>
        );
    }
    return (
        <Link to={`/journey/goals/${intention.goalId}`}
              className="p-5 rounded-lg border border-border-light bg-surface flex items-center gap-5 text-text-primary hover:no-underline hover:border-border">
            <KhatamProgress
                value={intention.amount ? Math.min(1, intention.done / intention.amount) : 0}
                label={`${formatCount(intention.done)}/${formatCount(intention.amount)}`}
                title={t('journey.today.intentionAria', { done: intention.done, amount: unit(intention.amount, true) })}
                className="w-24 h-24 flex-shrink-0"
            />
            <div>
                <h2 className="font-serif text-[1.5rem] font-semibold">{t('journey.intention.title')}</h2>
                <p className="text-sm text-text-secondary mt-1">
                    {met ? t('journey.today.intentionMet')
                        : t('journey.today.intentionProgress', { done: intention.done, amount: unit(intention.amount, true) })}
                </p>
                {!met && intention.projectedDay && (
                    <p className="text-xs text-text-muted mt-1">{t('journey.intention.projected', { day: formatDay(intention.projectedDay, { weekday: 'long' }) })}</p>
                )}
            </div>
        </Link>
    );
}

function AlmostDoneCard({ item }) {
    const href = item.kind === 'BOOK' ? `/books/${item.id}` : item.nextVideoId ? `/video/${item.nextVideoId}` : `/series/${item.id}`;
    const measure = item.kind === 'BOOK' ? 'PAGES' : 'EPISODES';
    return (
        <Link to={href} className="flex items-center gap-4 p-3.5 bg-surface border border-border-light rounded-lg text-text-primary hover:no-underline hover:border-border">
            <KhatamProgress
                value={item.fraction}
                title={t('journey.pace.barAria', { current: item.done, total: amountText(measure, item.total, true) })}
                traceClassName={item.kind === 'BOOK' ? 'text-primary' : 'text-gold'}
                className="w-14 h-14 flex-shrink-0"
            />
            <div className="min-w-0">
                <p dir="auto" className="font-bold truncate">{item.title}</p>
                <p className="text-xs text-text-muted">{t('journey.almostDoneLeft', { amount: amountText(measure, item.total - item.done) })}</p>
            </div>
        </Link>
    );
}

/** Twelve weeks, oldest first, each a star filled if anything was learned in it — never a streak. */
function WeekFlags({ weeks }) {
    const active = weeks.filter((week) => week.active).length;
    // Fewer than twelve for a reader who joined lately: the backend starts at the week they joined.
    // One week, shown only when it has learning in it, is the reader's first.
    const text = weeks.length === 1 ? t('journey.steadyFirst')
        : t('journey.steadyText', { count: formatCount(active), weeks: countOf('journey.units.WEEKS', weeks.length, { oblique: true }) });
    return (
        <div>
            <ul className="flex flex-wrap gap-2 sm:gap-3" aria-label={t('journey.steadyAria', { count: active, total: weeks.length })}>
                {weeks.map((week) => (
                    <li key={week.weekStart} title={formatDay(week.weekStart)}>
                        <KhatamStar filled={week.active} strokeWidth={8} className={`w-6 h-6 ${week.active ? 'text-gold' : 'text-border'}`} />
                        <span className="sr-only">{formatDay(week.weekStart)}: {week.active ? t('journey.weekActive') : t('journey.weekQuiet')}</span>
                    </li>
                ))}
            </ul>
            <p className="text-sm text-text-secondary mt-3">{text}</p>
        </div>
    );
}

const MONTH_COLUMNS = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' };

function MonthNumbers({ month }) {
    const cells = [
        { value: month.episodes, label: t('journey.month.episodes') },
        { value: month.pages, label: t('journey.month.pages') },
        { value: Math.round(month.minutes / 60), label: t('journey.month.hours') },
        { value: month.completions, label: t('journey.month.completions') },
    ].filter((cell) => cell.value > 0);
    // Only what is not zero, as on Today's week: «٠ ختمات» beside a month of reading reads as a verdict.
    if (!cells.length) return null;
    return (
        <section>
            <Cartouche title={t('journey.month.title', { month: formatDay(month.start, { month: 'long' }, 'islamic-umalqura') })} />
            <div className={`grid grid-cols-2 ${MONTH_COLUMNS[cells.length]} gap-px bg-border-light border border-border-light rounded-lg overflow-hidden`}>
                {cells.map((cell, index) => (
                    <div key={cell.label} className={`bg-surface p-4 ${index === cells.length - 1 && cells.length % 2 ? 'col-span-2 md:col-span-1' : ''}`}>
                        <strong className="block font-serif text-[2rem] leading-none text-primary font-semibold">{formatCount(cell.value)}</strong>
                        <span className="text-xs text-text-secondary">{cell.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Journey;
