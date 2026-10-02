import { useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Gem, HandHeart, Megaphone, Moon, Scale, ScrollText, Search, Sparkles } from 'lucide-react';
import { Button, CalendarPicker, QueryState } from '@/components/ui';
import { useGoalProposalPages, useGoalTopics } from '@/hooks/useGoalChoice';
import { FIELDS, fieldOf, isField, searchSubjects, subjectLabel } from '@/lib/subjects';
import { MINUTE_CHOICES, asksForSubject, chosenByText, deadlineChoices, deadlineDate, isCustomDeadline, isSeasonDeadline, itemKey, withPace } from '@/lib/goalChoice';
import { hijriDeadlines, seasonLabel, seasonLabelOf } from '@/lib/hijriSeasons';
import { formatReaderDay, otherCalendar } from '@/lib/readerCalendar';
import { amountText, learningTime } from '@/lib/goalText';
import { countOf } from '@/lib/plural';
import { formatDay } from '@/lib/dayFormat';
import { Poster, ShortlistMark } from './parts';
import PaceStepper from '../PaceStepper';
import PortionTrack from '../PortionTrack';
import MinutesDial from './MinutesDial';
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

/** How the deadline answer reads back: the row's choice, a Hijri season, or the reader's date. */
function deadlineLabel(value) {
    if (isSeasonDeadline(value)) return seasonLabelOf(value);
    if (isCustomDeadline(value)) return formatReaderDay(value);
    return t(`journey.choose.deadlines.${['month', 'quarter'].includes(value) ? value : 'none'}`);
}

function Answered({ params, go }) {
    const chips = [];
    // A subject picked on the first screen is one answer, not a field and then a subject.
    const direct = params.subject && params.via !== 'subject';
    if (params.field && !direct) {
        chips.push({ key: 'field', label: t(`journey.choose.intent.${params.field}`), step: 'field' });
    }
    if (params.subject && params.subject !== params.field) {
        chips.push({ key: 'subject', label: subjectLabel(params.subject), step: direct ? 'field' : 'subject' });
    }
    if (params.step === 'proposals') {
        chips.push({ key: 'time', label: t('journey.choose.minutesADay', { minutes: learningTime(params.minutes) }), step: 'time' });
        // The proposals are paced to it, so it is an answer as much as the minutes are.
        chips.push({ key: 'deadline', label: deadlineLabel(params.deadline), step: 'time' });
    }
    if (!chips.length) return null;
    return (
        <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    type="button"
                    // Pushed, not replaced: replacing left two identical entries behind, and the
                    // first Back from the question seemed to do nothing.
                    onClick={() => go({ step: chip.step, page: 0 }, true)}
                    className="h-8 px-3 rounded-full bg-primary-light text-primary-dark dark:text-primary text-sm font-semibold"
                >
                    {chip.label}
                </button>
            ))}
        </div>
    );
}

function Tile({ title, hint, icon: Icon = null, tint = TINTS[0], selected = false, onClick, preview = null }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`min-h-[6.5rem] p-4 rounded-lg border bg-surface text-start flex flex-col gap-2 transition-colors ${
                selected ? 'border-primary ring-1 ring-primary bg-primary-light' : 'border-border hover:border-primary'
            }`}
        >
            {Icon && (
                <span className={`w-10 h-10 rounded-full flex items-center justify-center ${tint}`}>
                    <Icon size={20} aria-hidden="true" />
                </span>
            )}
            <span className="font-semibold leading-snug">{title}</span>
            {preview && <span className="text-xs text-text-secondary leading-relaxed -mt-1">{preview}</span>}
            {hint && <span className="text-xs text-text-muted -mt-1">{hint}</span>}
        </button>
    );
}

/**
 * The Islamic sciences are most of this catalogue, so «أتعلّم ديني» as one tile was a question with
 * one answer: its main subjects are choices of their own here, beside the whole field. The other
 * fields stay whole, each naming the subjects it holds most of, so a reader sees what is inside
 * before choosing. Only what holds something this reader could still start is offered.
 */
const ISLAMIC_FIRST = ['QURAN', 'HADITH', 'AQEEDAH', 'FIQH', 'SEERAH', 'TAZKIYAH', 'DAWAH'];
const SUBJECT_ICONS = { QURAN: BookOpen, HADITH: ScrollText, AQEEDAH: Gem, FIQH: Scale, SEERAH: Moon, TAZKIYAH: HandHeart, DAWAH: Megaphone };

function FieldStep({ topics, params, go }) {
    const [query, setQuery] = useState('');
    const fields = new Map((topics.fields || []).map((field) => [field.field, field]));
    const subjects = new Map((topics.fields || []).flatMap((field) => field.subjects.map((subject) => [subject.subject, subject])));
    const islamic = fields.get('ISLAMIC');
    const chooseField = (code) => go({ field: code, subject: '', via: '', step: asksForSubject(fields.get(code)) ? 'subject' : 'time', page: 0 }, true);
    const chooseSubject = (code) => go({ field: fieldOf(code)?.code || '', subject: code, via: '', step: 'time', page: 0 }, true);
    const choose = (code) => (isField(code) ? chooseField(code) : chooseSubject(code));
    /** «القرآن · الفقه · السيرة وغيرها» — the field's largest subjects, by what they hold. */
    const preview = (field) => {
        const top = [...field.subjects].sort((a, b) => (b.programmes + b.books) - (a.programmes + a.books)).slice(0, 3);
        if (!top.length) return null;
        const names = top.map((subject) => subjectLabel(subject.subject)).join(' · ');
        return field.subjects.length > top.length ? `${names} ${t('journey.choose.holdsMore')}` : names;
    };
    const matches = query.trim().length >= 2
        ? searchSubjects(query).filter((code) => fields.has(code) || subjects.has(code)).slice(0, 8)
        : [];

    return (
        <>
            <h1 className="font-serif text-3xl font-bold">{t('journey.choose.intentTitle')}</h1>

            <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-text-secondary">{t('journey.choose.typeIt')}</span>
                <span className="relative">
                    <Search size={16} aria-hidden="true" className="absolute top-1/2 -translate-y-1/2 start-3 text-text-muted" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('journey.choose.typeItPlaceholder')}
                        className="w-full h-11 ps-9 pe-3 rounded-md border border-border bg-surface text-sm focus:border-primary focus:outline-none"
                    />
                </span>
            </label>
            {query.trim().length >= 2 && (
                matches.length ? (
                    <div className="flex flex-wrap gap-2 -mt-2">
                        {matches.map((code) => (
                            <button
                                key={code}
                                type="button"
                                onClick={() => choose(code)}
                                className="h-9 px-4 rounded-full border border-primary bg-primary-light text-primary-dark dark:text-primary text-sm font-semibold"
                            >
                                {subjectLabel(code)}
                                {!isField(code) && fieldOf(code) && (
                                    <span className="font-normal text-text-secondary"> · {subjectLabel(fieldOf(code).code)}</span>
                                )}
                            </button>
                        ))}
                    </div>
                ) : <p className="text-sm text-text-muted -mt-2">{t('journey.choose.typeItNone')}</p>
            )}

            {islamic && (
                <section className="flex flex-col gap-3">
                    <h2 className="font-serif text-xl font-bold">{t('journey.choose.groupIslamic')}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {ISLAMIC_FIRST.filter((code) => subjects.has(code)).map((code, index) => (
                            <Tile
                                key={code}
                                icon={SUBJECT_ICONS[code]}
                                tint={TINTS[index % 2]}
                                title={t(`journey.choose.intent.${code}`)}
                                preview={subjectLabel(code)}
                                hint={holds(subjects.get(code))}
                                selected={params.subject === code}
                                onClick={() => chooseSubject(code)}
                            />
                        ))}
                        <Tile
                            icon={FIELDS[0].icon}
                            tint={TINTS[2]}
                            title={t('journey.choose.intent.ISLAMIC')}
                            preview={t('journey.choose.wholeField')}
                            hint={holds(islamic)}
                            selected={params.field === 'ISLAMIC' && !params.subject}
                            onClick={() => go({ field: 'ISLAMIC', subject: '', via: '', step: 'time', page: 0 }, true)}
                        />
                    </div>
                </section>
            )}

            <section className="flex flex-col gap-3">
                {islamic && <h2 className="font-serif text-xl font-bold">{t('journey.choose.groupOther')}</h2>}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {FIELDS.filter((field) => field.code !== 'ISLAMIC' && fields.has(field.code)).map((field, index) => (
                        <Tile
                            key={field.code}
                            icon={field.icon}
                            tint={TINTS[index % TINTS.length]}
                            title={t(`journey.choose.intent.${field.code}`)}
                            preview={preview(fields.get(field.code))}
                            hint={holds(fields.get(field.code))}
                            selected={params.field === field.code}
                            onClick={() => chooseField(field.code)}
                        />
                    ))}
                    <Tile
                        icon={Sparkles}
                        tint={TINTS[2]}
                        title={t('journey.choose.intent.ANY')}
                        hint={holds(topics)}
                        selected={params.field === 'ANY'}
                        onClick={() => go({ field: 'ANY', subject: '', via: '', step: 'time', page: 0 }, true)}
                    />
                </div>
            </section>
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
                        onClick={() => go({ subject: subject.subject, via: 'subject', step: 'time', page: 0 }, true)}
                    />
                ))}
                <Tile
                    title={t('journey.choose.wholeField')}
                    hint={holds(field)}
                    selected={params.subject === field.field}
                    onClick={() => go({ subject: field.field, via: 'subject', step: 'time', page: 0 }, true)}
                />
            </div>
        </>
    );
}

const isoAfter = (days) => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days, 12)).toISOString().slice(0, 10);
};

/** «موعد آخر»: the deadline row's fourth choice — a Hijri season or a date of the reader's own. */
function CustomDeadlineChip({ params, open, setOpen }) {
    const custom = isCustomDeadline(params.deadline);
    return (
        <button
            type="button"
            aria-pressed={custom && !open}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className={`h-10 px-4 rounded-full border text-sm font-semibold inline-flex items-center gap-2 ${
                open || custom ? 'border-primary bg-primary-light text-primary-dark dark:text-primary' : 'border-dashed border-border bg-surface'
            } ${custom && !open ? 'ring-2 ring-primary' : ''}`}
        >
            <CalendarDays size={16} aria-hidden="true" />
            {!custom ? t('journey.choose.deadlineCustom')
                : isSeasonDeadline(params.deadline) ? seasonLabelOf(params.deadline)
                    : formatReaderDay(params.deadline)}
        </button>
    );
}

/**
 * A finish of the reader's own. The Hijri seasons first — before Ramadan, before the ten days of
 * Dhu al-Hijjah, the end of the Hijri month and year, each the last day before it begins — since
 * those are the dates a goal on this platform is most often set against; then our calendar
 * (`ui/CalendarPicker`, Hijri or Gregorian) for any day from tomorrow to two years out. Whatever is chosen is
 * read back large, in both calendars, with how far off it is.
 */
function CustomDeadlinePanel({ params, go, onClose }) {
    const min = isoAfter(1);
    const max = isoAfter(730);
    const seasons = useMemo(() => hijriDeadlines(), []);
    // Nothing chosen until the reader chooses: the calendar opens on this month, not on a season
    // months away that the reader never asked for.
    const [choice, setChoice] = useState(isCustomDeadline(params.deadline) ? params.deadline : null);
    // From the seasons already computed: deadlineDate would walk the Hijri calendar again per render.
    const date = isSeasonDeadline(choice) ? seasons.find((season) => season.key === choice)?.date || null : deadlineDate(choice);
    const valid = !!date && date >= min && date <= max;
    const days = valid ? Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${isoAfter(0)}T12:00:00Z`)) / 86_400_000) : 0;
    const away = days >= 14 ? countOf('journey.units.WEEKS', Math.round(days / 7)) : countOf('journey.units.DAYS', days);
    return (
        <div className="p-4 rounded-lg border border-primary ring-1 ring-primary bg-surface flex flex-col gap-3">
            {/* What is chosen, in one block: the day large, then both calendars and how far off. */}
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-secondary">
                    {isSeasonDeadline(choice) ? seasonLabelOf(choice) : t('journey.choose.deadlineCustomTitle')}
                </span>
                <span className={`font-serif leading-snug ${valid ? 'text-xl font-bold text-primary-dark dark:text-primary' : 'text-base font-semibold text-text-muted'}`} aria-live="polite">
                    {valid ? formatReaderDay(date, { weekday: 'long', day: 'numeric', month: 'long' }) : t('journey.choose.deadlinePickPrompt')}
                </span>
                {valid && (
                    <span className="text-xs text-text-secondary">
                        {formatDay(date, { day: 'numeric', month: 'long', year: 'numeric' }, otherCalendar())}
                        {' · '}{t('journey.choose.deadlineAway', { duration: away })}
                    </span>
                )}
            </div>

            {seasons.length > 0 && (
                <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" aria-label={t('journey.choose.deadlineSeasons')} role="group">
                    {seasons.map((season) => (
                        <button
                            key={season.key}
                            type="button"
                            aria-pressed={choice === season.key}
                            onClick={() => setChoice(season.key)}
                            className={`flex-shrink-0 h-9 px-3 rounded-full border text-sm font-semibold inline-flex items-center gap-1.5 transition-colors ${
                                choice === season.key ? 'border-gold bg-gold-light text-gold-ink' : 'border-border bg-bg text-text-primary hover:border-gold'
                            }`}
                        >
                            {seasonLabel(season)}
                            <span className="text-xs font-normal text-text-secondary">{formatReaderDay(season.date, { day: 'numeric', month: 'short' })}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-1.5 border-t border-border-light pt-3">
                <CalendarPicker
                    value={isSeasonDeadline(choice) ? date : choice}
                    onChange={setChoice}
                    min={min}
                    max={max}
                    marks={Object.fromEntries(seasons.map((season) => [season.date, seasonLabel(season)]))}
                    // The read-back above already says how far off it is.
                    showAhead={false}
                />
            </div>

            <div className="flex items-center gap-3">
                <Button className="flex-1 h-11" disabled={!valid} onClick={() => { onClose(); go({ deadline: choice, step: 'proposals', page: 0 }, true); }}>
                    {t('journey.choose.deadlineCustomUse')}
                </Button>
                <button type="button" onClick={onClose} className="text-sm font-semibold text-text-secondary hover:underline px-2">
                    {t('common.cancel')}
                </button>
            </div>
        </div>
    );
}

function TimeStep({ params, go }) {
    const deadlines = useMemo(() => deadlineChoices(), []);
    const [deadlineOpen, setDeadlineOpen] = useState(false);
    // Already held to the dial's five minutes to two hours where the address is read (readParams).
    const { minutes } = params;
    return (
        <>
            <h1 className="font-serif text-3xl font-bold">{t('journey.choose.timeTitle')}</h1>
            <MinutesDial value={minutes} onChange={(next) => go({ minutes: next })} />
            <p className="-mt-2 text-center text-sm text-text-secondary">
                {t('journey.dial.hint')}
                {/* Only where there is a mouse to turn: a phone has no wheel to mention. */}
                <span className="hidden [@media(hover:hover)_and_(pointer:fine)]:inline">{' · '}{t('journey.dial.wheelHint')}</span>
            </p>
            {/* The usual lengths, one tap each — the gold beads on the dial, in words. Two by two
                on a phone, so four never wrap three-and-one. */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-[400px] w-full mx-auto">
                {MINUTE_CHOICES.map((choice) => (
                    <button
                        key={choice}
                        type="button"
                        aria-pressed={minutes === choice}
                        onClick={() => go({ minutes: choice })}
                        className={`h-10 px-3 rounded-full border text-sm font-semibold transition-colors ${
                            minutes === choice ? 'border-primary bg-primary-light text-primary-dark dark:text-primary ring-1 ring-primary' : 'border-border bg-surface hover:border-primary'
                        }`}
                    >
                        {learningTime(choice)}
                    </button>
                ))}
            </div>
            <h2 className="font-serif text-2xl font-bold mt-2">{t('journey.choose.deadlineTitle')}</h2>
            <div className="flex flex-wrap gap-2">
                {deadlines.map((deadline) => (
                    <button
                        key={deadline.key}
                        type="button"
                        aria-pressed={!deadlineOpen && params.deadline === deadline.key}
                        onClick={() => { setDeadlineOpen(false); go({ deadline: deadline.key, step: 'proposals', page: 0 }, true); }}
                        className={`h-10 px-4 rounded-full border border-border bg-surface text-sm font-semibold ${
                            !deadlineOpen && params.deadline === deadline.key ? 'ring-2 ring-primary' : ''
                        }`}
                    >
                        {t(`journey.choose.deadlines.${deadline.key}`)}
                    </button>
                ))}
                <CustomDeadlineChip params={params} go={go} open={deadlineOpen} setOpen={setDeadlineOpen} />
            </div>
            {deadlineOpen && <CustomDeadlinePanel params={params} go={go} onClose={() => setDeadlineOpen(false)} />}
        </>
    );
}

function ProposalCard({ proposal, deadline, onOpen, shortlist, onToggle }) {
    const { item, measure } = proposal;
    const series = item.kind === 'FINISH_SERIES';
    // The pace is the reader's to change: it starts at what fits the minutes they gave, and the
    // track re-cuts as they move it. What one unit takes is the backend's measure, scaled.
    const [amount, setAmount] = useState(proposal.amount);
    const perUnit = proposal.minutesPerDay && proposal.amount ? proposal.minutesPerDay / proposal.amount : null;
    const minutes = perUnit ? Math.round(perUnit * amount) : null;
    const total = series ? item.episodes : item.pages;
    const chosen = { ...proposal, amount, minutesPerDay: minutes };
    return (
        <div className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col">
            <div className="relative">
                <button type="button" className="block w-full" onClick={() => onOpen(item, chosen)} aria-label={item.title}>
                    <Poster item={item} className="aspect-video w-full rounded-none" />
                </button>
                <ShortlistMark item={withPace(item, amount, deadline)} shortlist={shortlist} onToggle={onToggle} className="absolute top-2 start-2" />
            </div>
            <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex flex-col gap-0.5">
                    <span dir="auto" className="font-semibold text-lg leading-snug line-clamp-2">{item.title}</span>
                    {item.channelName && <span className="text-sm text-text-secondary">{item.channelName}</span>}
                    {proposal.widened && item.subject && (
                        <span className="text-xs text-text-muted">{t('journey.choose.widenedMark', { subject: subjectLabel(item.subject) })}</span>
                    )}
                </div>
                <span className="text-sm text-text-secondary">
                    {[
                        amountText(measure, total),
                        series && perUnit ? t('journey.choose.perEpisode', { minutes: learningTime(Math.round(perUnit)) }) : null,
                    ].filter(Boolean).join(' · ')}
                </span>
                {/* The pace as one panel: the reader's own amount, what it takes a day, and the
                    days it comes to — one segment each. */}
                <div className="flex flex-col gap-3 rounded-md bg-bg p-3">
                    <PaceStepper measure={measure} amount={amount} onChange={setAmount} max={Math.max(1, total || 50)} />
                    {minutes ? (
                        <span className={`text-xs text-center -mt-1 ${proposal.fitsDay === false && amount === proposal.amount ? 'text-gold-ink font-semibold' : 'text-text-secondary'}`}>
                            {proposal.fitsDay === false && amount === proposal.amount
                                ? t('journey.choose.whyLonger', { minutes: learningTime(minutes) })
                                : t('journey.choose.aboutMinutesADay', { minutes: learningTime(minutes) })}
                        </span>
                    ) : null}
                    <PortionTrack total={total} amount={amount} measure={measure} deadline={deadline} />
                </div>
                {item.chosenBy ? <span className="text-xs text-gold-ink">{chosenByText(item.chosenBy)}</span> : null}
                <Button className="mt-auto" onClick={() => onOpen(item, chosen)}>{t('journey.choose.look')}</Button>
            </div>
        </div>
    );
}

function ProposalsStep({ params, go, onOpen, shortlist, onToggle, onBrowse }) {
    // Memoised: the Ramadan choice walks up to 400 days of the Hijri calendar through Intl.
    const deadline = useMemo(() => deadlineDate(params.deadline), [params.deadline]);
    const subject = params.field === 'ANY' ? null : (params.subject || params.field);
    // Every page so far, in order: «أرني ثلاثة غيرها» adds three below, never swaps the first ones out.
    const proposals = useGoalProposalPages({ subject, minutes: params.minutes, deadline, pages: params.page });
    const thin = proposals.widened && subject && !isField(subject)
        ? t('journey.choose.widened', { subject: subjectLabel(subject), field: subjectLabel(params.field) })
        : null;
    return (
        <>
            <h1 className="font-serif text-3xl font-bold">{t('journey.choose.proposalsTitle')}</h1>
            {thin && <p className="text-sm text-text-secondary">{thin}</p>}
            <QueryState
                isLoading={proposals.isLoading}
                isError={proposals.isError && !proposals.proposals.length}
                error={proposals.error}
                onRetry={proposals.refetch}
                errorTitle={t('journey.loadFailed')}
                isEmpty={!proposals.proposals.length}
                emptyTitle={t('journey.choose.proposalsNone')}
                emptyAction={<Button variant="ghost" onClick={onBrowse}>{t('journey.choose.ratherBrowse')}</Button>}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {proposals.proposals.map((proposal) => (
                        <ProposalCard
                            key={itemKey(proposal.item)}
                            proposal={proposal}
                            deadline={deadline}
                            onOpen={onOpen}
                            shortlist={shortlist}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                    {proposals.hasMore && (
                        <Button
                            variant="ghost"
                            onClick={() => go({ page: params.page + 1 })}
                            disabled={proposals.isLoadingMore}
                        >
                            {t('journey.choose.more')}
                        </Button>
                    )}
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
