import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Bookmark, Compass, LayoutGrid } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { Button } from '../components/ui';
import { ArrowBack } from '../components/ui/DirectionalIcon';
import { useJourney } from '../components/journey';
import GuidedChoice from '../components/journey/choose/GuidedChoice';
import BrowseChoice from '../components/journey/choose/BrowseChoice';
import PreviewSheet from '../components/journey/choose/PreviewSheet';
import CompareSheet from '../components/journey/choose/CompareSheet';
import { Poster } from '../components/journey/choose/parts';
import { useGoals } from '../hooks/useGoals';
import { useToday } from '../hooks/useToday';
import { usePageMeta } from '../hooks/usePageMeta';
import { goalFor } from '../lib/journey';
import { deadlineDate, prefillFor, toggleShortlist } from '../lib/goalChoice';
import { amountText } from '../lib/goalText';
import { formatCount } from '../lib/numbers';
import { safeSessionStorage } from '../lib/safeStorage';
import { t } from '@/i18n';

/**
 * «اختر وِردك» — choosing what a goal pursues, as a page of its own rather than the first step of
 * the goal dialog: search alone asked a reader who came to be shown what is here to already know,
 * and that is where goals were abandoned. Two ways in — «ساعدني أختار» (three questions, three
 * ready goals) and «أتصفّح بنفسي» (shelves, channels, search) — and one way out: every card opens
 * the preview, whose «اجعله وِردي» opens the goal dialog with the target chosen and its amount
 * proposed. The dialog then asks only how much, when and why.
 *
 * <p>Every step is in the URL (`way`, `step`, `field`, `subject`, `minutes`, `deadline`, `page`,
 * `tab`, `channel`), so Back walks back through the questions and out of a channel. The shortlist
 * is a scratch pad for one decision, not something kept on the account — held in the tab's
 * session so a look at a programme's own page and back does not empty it, and gone with the tab.
 */

const SHORTLIST_KEY = 'absarna.choose.shortlist';

function readShortlist() {
    try {
        const stored = JSON.parse(safeSessionStorage.getItem(SHORTLIST_KEY) || '[]');
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

const HABITS = [
    { kind: 'HABIT', measure: 'MINUTES', amount: 15 },
    { kind: 'HABIT', measure: 'EPISODES', amount: 1 },
    { kind: 'HABIT', measure: 'PAGES', amount: 5 },
];

function readParams(search) {
    // Held to the dial's range here, once, so the dial and the proposals read the same length — an
    // older link can carry up to 240 from the number box the dial replaced.
    const parsed = Number.parseInt(search.get('minutes') || '', 10);
    const minutes = Number.isFinite(parsed) ? Math.min(120, Math.max(5, parsed)) : Number.NaN;
    const page = Number.parseInt(search.get('page') || '', 10);
    return {
        way: search.get('way') || '',
        step: search.get('step') || '',
        field: search.get('field') || '',
        subject: search.get('subject') || '',
        minutes: Number.isFinite(minutes) ? minutes : 20,
        deadline: search.get('deadline') || 'none',
        page: Number.isFinite(page) && page > 0 ? page : 0,
        tab: search.get('tab') || '',
        channel: search.get('channel') || '',
        // 'subject' when the subject came from the second question rather than the first screen.
        via: search.get('via') || '',
    };
}

function Start({ go, onCommit, onOpen, openGoal }) {
    const today = useToday();
    const goals = useGoals();
    const [habits, setHabits] = useState(false);
    // The one warm suggestion: a programme the reader started and does not pursue yet.
    const next = (today.data?.continueWatching || [])
        .map((entry) => entry.next)
        .find((video) => video?.seriesId && !goalFor(goals.data, { seriesId: video.seriesId }));
    const started = next ? {
        kind: 'FINISH_SERIES', targetId: next.seriesId, title: next.seriesTitle || next.title,
        channelName: next.channelName, firstEpisode: next,
    } : null;

    return (
        <div data-guide="choose-start" className="flex flex-col gap-7 max-w-2xl">
            <div className="flex flex-col gap-1">
                <h1 className="font-serif text-4xl font-bold">{t('journey.choose.startTitle')}</h1>
                <p className="text-text-secondary">{t('journey.choose.startText')}</p>
            </div>

            {started && (
                <div className="rounded-lg border border-border bg-surface overflow-hidden">
                    <button type="button" className="block w-full" onClick={() => onOpen(started)} aria-label={started.title}>
                        <Poster item={started} className="aspect-[2/1] w-full rounded-none" />
                    </button>
                    <div className="p-4 flex flex-col gap-3">
                        <div>
                            <span className="text-xs font-bold text-gold-ink">{t('journey.choose.continueLabel')}</span>
                            <span dir="auto" className="block font-semibold text-lg leading-snug">{started.title}</span>
                            {started.channelName && <span className="block text-sm text-text-secondary">{started.channelName}</span>}
                        </div>
                        <Button onClick={() => onCommit(prefillFor(started))}>{t('journey.choose.makeIt')}</Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                {[
                    { way: 'guided', icon: Compass, tint: 'bg-primary-light text-primary', title: t('journey.choose.guided'), hint: t('journey.choose.guidedHint') },
                    { way: 'browse', icon: LayoutGrid, tint: 'bg-gold-light text-gold-ink', title: t('journey.choose.browse'), hint: t('journey.choose.browseHint') },
                ].map((door) => (
                    <button
                        key={door.way}
                        type="button"
                        onClick={() => go({ way: door.way }, true)}
                        className="min-h-[9rem] p-4 rounded-lg border border-border bg-surface hover:border-primary text-start flex flex-col gap-2"
                    >
                        <span className={`w-11 h-11 rounded-full flex items-center justify-center ${door.tint}`}>
                            <door.icon size={22} aria-hidden="true" />
                        </span>
                        <span className="font-semibold text-lg">{door.title}</span>
                        <span className="text-sm text-text-secondary">{door.hint}</span>
                    </button>
                ))}
            </div>

            <div className="flex flex-col items-center gap-3">
                <button type="button" data-guide="choose-habits" onClick={() => setHabits((open) => !open)} aria-expanded={habits} className="text-sm font-semibold text-text-secondary hover:underline">
                    {t('journey.choose.habits')}
                </button>
                {habits && (
                    <div className="flex flex-wrap justify-center gap-2">
                        {HABITS.map((habit) => (
                            <button
                                key={habit.measure}
                                type="button"
                                data-guide={`habit-${habit.measure}`}
                                onClick={() => openGoal(habit)}
                                className="h-10 px-4 rounded-full border border-border bg-surface text-sm font-semibold hover:border-primary"
                            >
                                {t('journey.choose.habitDaily', { amount: amountText(habit.measure, habit.amount) })}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function JourneyChoose() {
    usePageMeta({ title: t('journey.choose.title') });
    const navigate = useNavigate();
    const location = useLocation();
    const { openGoal } = useJourney();
    const [search, setSearch] = useSearchParams();
    const params = useMemo(() => readParams(search), [search]);
    const [shortlist, setShortlist] = useState(readShortlist);
    useEffect(() => {
        safeSessionStorage.setItem(SHORTLIST_KEY, JSON.stringify(shortlist));
    }, [shortlist]);
    // Back walks back through the questions — but a reader who arrived on a deep link has nothing
    // behind them here, and -1 would take them off the site: they go to the page's start instead.
    const back = () => (location.key === 'default' ? navigate('/journey/choose', { replace: true }) : navigate(-1));
    const [preview, setPreview] = useState(null);
    const [comparing, setComparing] = useState(false);

    /** Merges `patch` into the URL; `push` for a step the reader should be able to go Back from. */
    const go = useCallback((patch, push = false) => {
        const next = new URLSearchParams(search);
        Object.entries(patch).forEach(([key, value]) => {
            if (value === '' || value == null || (key === 'page' && value === 0)) next.delete(key);
            else next.set(key, String(value));
        });
        setSearch(next, { replace: !push });
    }, [search, setSearch]);

    const onToggle = useCallback((item) => setShortlist((list) => toggleShortlist(list, item)), []);
    const onOpen = useCallback((item, proposal = null) => setPreview({ item, proposal }), []);
    const onCommit = useCallback((prefill) => {
        setPreview(null);
        setComparing(false);
        openGoal(prefill, { onCreated: () => { setShortlist([]); navigate('/journey'); } });
    }, [openGoal, navigate]);

    // The guided flow's deadline, so a preview opened from a proposal draws it on its week strip.
    const deadline = useMemo(() => (params.way === 'guided'
        ? deadlineDate(params.deadline)
        : null), [params.way, params.deadline]);

    return (
        <PageShell tab>
            <div className="flex flex-col gap-6">
                {params.way && (
                    <button type="button" onClick={back} className="self-start flex items-center gap-1 text-sm font-semibold text-primary">
                        <ArrowBack size={16} />{t('journey.choose.back')}
                    </button>
                )}
                {!params.way && <Start go={go} onCommit={onCommit} onOpen={onOpen} openGoal={openGoal} />}
                {params.way === 'guided' && (
                    <GuidedChoice
                        params={params}
                        go={go}
                        onOpen={onOpen}
                        shortlist={shortlist}
                        onToggle={onToggle}
                        onBrowse={() => go({ way: 'browse', step: '', page: 0 }, true)}
                    />
                )}
                {params.way === 'browse' && (
                    <BrowseChoice params={params} go={go} onOpen={onOpen} shortlist={shortlist} onToggle={onToggle} />
                )}
            </div>

            {shortlist.length > 0 && (
                <button
                    type="button"
                    onClick={() => setComparing(true)}
                    className="fixed z-40 left-1/2 -translate-x-1/2 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 h-11 px-5 rounded-full bg-text-primary text-bg font-semibold shadow-lg flex items-center gap-2"
                >
                    <Bookmark size={16} fill="currentColor" aria-hidden="true" />
                    {t('journey.choose.shortlist', { count: formatCount(shortlist.length) })}
                </button>
            )}

            {preview && (
                <PreviewSheet
                    item={preview.item}
                    proposal={preview.proposal}
                    deadline={preview.proposal ? deadline : null}
                    shortlist={shortlist}
                    onToggle={onToggle}
                    onCommit={onCommit}
                    onClose={() => setPreview(null)}
                />
            )}
            {comparing && (
                <CompareSheet shortlist={shortlist} onToggle={onToggle} onCommit={onCommit} onClose={() => setComparing(false)} />
            )}
        </PageShell>
    );
}

export default JourneyChoose;
