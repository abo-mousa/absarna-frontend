import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Button, QueryState } from '@/components/ui';
import { useGoalProposals, useGoalTopics } from '@/hooks/useGoalChoice';
import { FIELDS, subjectLabel } from '@/lib/subjects';
import { MINUTE_CHOICES, asksForSubject, chosenByText, deadlineChoices, finishText, itemKey } from '@/lib/goalChoice';
import { amountText, learningTime } from '@/lib/goalText';
import { countOf } from '@/lib/plural';
import { Poster, ShortlistMark, WeekStrip } from './parts';
import { t } from '@/i18n';

/**
 * «ساعدني أختار»: what (a field, then — only when there is a choice — a subject), how much of the
 * day, by when; then three ready goals. Each answer moves on by itself, and the answers so far stay
 * at the top as chips that go back to their question. The steps live in the URL (`JourneyChoose`),
 * so the browser's Back walks back through them.
 */

const TINTS = ['bg-primary-light text-primary', 'bg-gold-light text-gold-ink', 'bg-surface-hover text-text-secondary'];
/** What a topic holds, as a reader weighs it: its programmes and its books, whichever it has. */
const holds = (topic) => [
    topic.programmes ? countOf('journey.units.PROGRAMMES', topic.programmes) : null,
    topic.books ? countOf('journey.units.BOOKS', topic.books) : null,
].filter(Boolean).join(' · ');
const daysUntil = (iso) => (iso ? Math.round((new Date(`${iso}T12:00:00`) - new Date()) / 86_400_000) : null);

function Answered({ params, go }) {
    const chips = [];
    if (params.field) {
        chips.push({ key: 'field', label: t(`journey.choose.intent.${params.field}`), step: 'field' });
    }
    if (params.subject && params.subject !== params.field) {
        chips.push({ key: 'subject', label: subjectLabel(params.subject), step: 'subject' });
    }
    if (params.step === 'proposals') {
        chips.push({ key: 'time', label: t('journey.choose.minutesADay', { minutes: learningTime(params.minutes) }), step: 'time' });
    }
    if (!chips.length) return null;
    return (
        <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    type="button"
                    onClick={() => go({ step: chip.step, page: 0 })}
                    className="h-8 px-3 rounded-full bg-primary-light text-primary-dark dark:text-primary text-sm font-semibold"
                >
                    {chip.label}
                </button>
            ))}
        </div>
    );
}

function Tile({ title, hint, icon: Icon = null, tint = TINTS[0], selected = false, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`min-h-[7rem] p-4 rounded-lg border bg-surface text-start flex flex-col gap-2 transition-colors ${
                selected ? 'border-primary ring-1 ring-primary bg-primary-light' : 'border-border hover:border-primary'
            }`}
        >
            {Icon && (
                <span className={`w-10 h-10 rounded-full flex items-center justify-center ${tint}`}>
                    <Icon size={20} aria-hidden="true" />
                </span>
            )}
            <span className="font-semibold leading-snug">{title}</span>
            {hint && <span className="text-xs text-text-secondary -mt-1">{hint}</span>}
        </button>
    );
}

function FieldStep({ topics, params, go }) {
    const byCode = new Map((topics.fields || []).map((field) => [field.field, field]));
    const choose = (code) => {
        const topic = byCode.get(code);
        go({ field: code, subject: '', step: asksForSubject(topic) ? 'subject' : 'time', page: 0 }, true);
    };
    return (
        <>
            <h1 className="font-serif text-3xl font-bold">{t('journey.choose.intentTitle')}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FIELDS.filter((field) => byCode.has(field.code)).map((field, index) => (
                    <Tile
                        key={field.code}
                        icon={field.icon}
                        tint={TINTS[index % TINTS.length]}
                        title={t(`journey.choose.intent.${field.code}`)}
                        hint={holds(byCode.get(field.code))}
                        selected={params.field === field.code}
                        onClick={() => choose(field.code)}
                    />
                ))}
                <Tile
                    icon={Sparkles}
                    tint={TINTS[2]}
                    title={t('journey.choose.intent.ANY')}
                    hint={holds(topics)}
                    selected={params.field === 'ANY'}
                    onClick={() => go({ field: 'ANY', subject: '', step: 'time', page: 0 }, true)}
                />
            </div>
        </>
    );
}

function SubjectStep({ topics, params, go }) {
    const field = (topics.fields || []).find((f) => f.field === params.field);
    if (!field) return null;
    return (
        <>
            <h1 className="font-serif text-3xl font-bold">{t('journey.choose.subjectTitle')}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {field.subjects.map((subject) => (
                    <Tile
                        key={subject.subject}
                        title={subjectLabel(subject.subject)}
                        hint={holds(subject)}
                        selected={params.subject === subject.subject}
                        onClick={() => go({ subject: subject.subject, step: 'time', page: 0 }, true)}
                    />
                ))}
                <Tile
                    title={t('journey.choose.wholeField')}
                    hint={holds(field)}
                    selected={params.subject === field.field}
                    onClick={() => go({ subject: field.field, step: 'time', page: 0 }, true)}
                />
            </div>
        </>
    );
}

function TimeStep({ params, go }) {
    const deadlines = useMemo(() => deadlineChoices(), []);
    return (
        <>
            <h1 className="font-serif text-3xl font-bold">{t('journey.choose.timeTitle')}</h1>
            <div className="grid grid-cols-2 gap-3">
                {MINUTE_CHOICES.map((minutes) => (
                    <Tile
                        key={minutes}
                        title={learningTime(minutes)}
                        hint={t(`journey.choose.minutesHint.m${minutes}`)}
                        selected={params.minutes === minutes}
                        onClick={() => go({ minutes })}
                    />
                ))}
            </div>
            <h2 className="font-serif text-2xl font-bold mt-2">{t('journey.choose.deadlineTitle')}</h2>
            <div className="flex flex-wrap gap-2">
                {deadlines.map((deadline) => (
                    <button
                        key={deadline.key}
                        type="button"
                        aria-pressed={params.deadline === deadline.key}
                        onClick={() => go({ deadline: deadline.key, step: 'proposals', page: 0 }, true)}
                        className={`h-10 px-4 rounded-full border text-sm font-semibold ${
                            deadline.key === 'ramadan' ? 'border-gold bg-gold-light text-gold-ink' : 'border-border bg-surface'
                        } ${params.deadline === deadline.key ? 'ring-2 ring-primary' : ''}`}
                    >
                        {t(`journey.choose.deadlines.${deadline.key}`)}
                    </button>
                ))}
            </div>
        </>
    );
}

function ProposalCard({ proposal, deadlineDays, onOpen, shortlist, onToggle }) {
    const { item, measure, amount } = proposal;
    const series = item.kind === 'FINISH_SERIES';
    const perEpisode = series && proposal.minutesPerDay && amount ? Math.round(proposal.minutesPerDay / amount) : null;
    return (
        <div className="w-[85%] sm:w-[22rem] flex-shrink-0 snap-center rounded-lg border border-border bg-surface overflow-hidden flex flex-col">
            <div className="relative">
                <button type="button" className="block w-full" onClick={() => onOpen(item, proposal)} aria-label={item.title}>
                    <Poster item={item} className="aspect-video w-full rounded-none" />
                </button>
                <ShortlistMark item={item} shortlist={shortlist} onToggle={onToggle} className="absolute top-2 start-2" />
            </div>
            <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex flex-col gap-0.5">
                    <span dir="auto" className="font-semibold text-lg leading-snug line-clamp-2">{item.title}</span>
                    {item.channelName && <span className="text-sm text-text-secondary">{item.channelName}</span>}
                    {proposal.widened && item.subject && (
                        <span className="text-xs text-text-muted">{t('journey.choose.widenedMark', { subject: subjectLabel(item.subject) })}</span>
                    )}
                </div>
                <span className="text-sm">
                    {[
                        amountText(series ? 'EPISODES' : 'PAGES', series ? item.episodes : item.pages),
                        perEpisode ? t('journey.choose.perEpisode', { minutes: learningTime(perEpisode) }) : null,
                    ].filter(Boolean).join(' · ')}
                </span>
                <div className="flex flex-col gap-2">
                    {/* Why this one fits — the backend already measured it (`fitsDay`, `minutesPerDay`). */}
                    {proposal.minutesPerDay ? (
                        <span className={`text-xs font-semibold ${proposal.fitsDay === false ? 'text-gold-ink' : 'text-text-secondary'}`}>
                            {proposal.fitsDay === false
                                ? t('journey.choose.whyLonger', { minutes: learningTime(proposal.minutesPerDay) })
                                : t('journey.choose.whyFits', { minutes: learningTime(proposal.minutesPerDay) })}
                        </span>
                    ) : null}
                    <span className="text-sm font-semibold">{t('journey.choose.paceDaily', { amount: amountText(measure, amount) })}</span>
                    <WeekStrip days={proposal.days} deadlineDays={deadlineDays} />
                    <span className={`text-sm font-semibold ${proposal.fitsDeadline ? 'text-primary-dark dark:text-primary' : 'text-gold-ink'}`}>
                        {proposal.fitsDeadline ? finishText(proposal.days) : t('journey.choose.missesDeadline')}
                    </span>
                </div>
                {item.chosenBy ? <span className="text-xs text-gold-ink">{chosenByText(item.chosenBy)}</span> : null}
                <Button className="mt-auto" onClick={() => onOpen(item, proposal)}>{t('journey.choose.look')}</Button>
            </div>
        </div>
    );
}

function ProposalsStep({ params, go, onOpen, shortlist, onToggle, onBrowse }) {
    // Memoised: the Ramadan choice walks up to 400 days of the Hijri calendar through Intl.
    const deadline = useMemo(() => deadlineChoices().find((d) => d.key === params.deadline)?.date || null, [params.deadline]);
    const subject = params.field === 'ANY' ? null : (params.subject || params.field);
    const proposals = useGoalProposals({ subject, minutes: params.minutes, deadline, page: params.page });
    const data = proposals.data;
    const deadlineDays = daysUntil(deadline);
    const thin = data?.widened
        ? t('journey.choose.widened', { subject: subjectLabel(subject), field: subjectLabel(params.field) })
        : null;
    return (
        <>
            <h1 className="font-serif text-3xl font-bold">{t('journey.choose.proposalsTitle')}</h1>
            {thin && <p className="text-sm text-text-secondary">{thin}</p>}
            <QueryState
                isLoading={proposals.isLoading}
                isError={proposals.isError}
                error={proposals.error}
                onRetry={proposals.refetch}
                errorTitle={t('journey.loadFailed')}
                isEmpty={!data?.proposals?.length}
                emptyTitle={t('journey.choose.proposalsNone')}
                emptyAction={<Button variant="ghost" onClick={onBrowse}>{t('journey.choose.ratherBrowse')}</Button>}
            >
                <div className={`flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 ${proposals.isFetching ? 'opacity-60' : ''}`}>
                    {(data?.proposals || []).map((proposal) => (
                        <ProposalCard
                            key={itemKey(proposal.item)}
                            proposal={proposal}
                            deadlineDays={deadlineDays}
                            onOpen={onOpen}
                            shortlist={shortlist}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                    <button
                        type="button"
                        onClick={() => go({ page: data?.hasMore ? params.page + 1 : 0 })}
                        className="text-sm font-semibold text-primary hover:underline"
                    >
                        {data?.hasMore ? t('journey.choose.more') : t('journey.choose.fromTheStart')}
                    </button>
                    <button type="button" onClick={onBrowse} className="text-sm font-semibold text-text-secondary hover:underline">
                        {t('journey.choose.ratherBrowse')}
                    </button>
                </div>
            </QueryState>
        </>
    );
}

function GuidedChoice({ params, go, onOpen, shortlist, onToggle, onBrowse }) {
    const topics = useGoalTopics();
    const step = params.step || 'field';
    return (
        <div className="flex flex-col gap-6">
            <Answered params={{ ...params, step }} go={go} />
            {step === 'proposals' ? (
                <ProposalsStep params={params} go={go} onOpen={onOpen} shortlist={shortlist} onToggle={onToggle} onBrowse={onBrowse} />
            ) : step === 'time' ? (
                <TimeStep params={params} go={go} />
            ) : (
                <QueryState
                    isLoading={topics.isLoading}
                    isError={topics.isError}
                    error={topics.error}
                    onRetry={topics.refetch}
                    errorTitle={t('journey.loadFailed')}
                >
                    {topics.data && (step === 'subject'
                        ? <SubjectStep topics={topics.data} params={params} go={go} />
                        : <FieldStep topics={topics.data} params={params} go={go} />)}
                </QueryState>
            )}
        </div>
    );
}

export default GuidedChoice;
