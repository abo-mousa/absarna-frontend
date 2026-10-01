import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, Cartouche, KhatamProgress, KhatamStar, Avatar, PageHeader, DatePair } from '../components/ui';
import { VideoCard, BookCard } from '../components/content';
import { useToday, useHideContinue } from '../hooks/useToday';
import { useToast } from '../contexts/ToastContext';
import { X } from 'lucide-react';
import { useChannelInvitations } from '../hooks/useChannelClaim';
import { useWatchProgressMap } from '../hooks/useVideos';
import { useGridColumns } from '../hooks/useGridColumns';
import { formatTimestamp } from '@/lib/spans';
import { formatCount } from '@/lib/numbers';
import { resolveMediaUrl } from '@/lib/media';
import { formatDigits, t } from '@/i18n';
import { describeError } from '@/lib/describeError';
import { WirdToday, QadaCards, MakeWird } from '../components/journey';
import { useGoals } from '../hooks/useGoals';
import { goalFor } from '@/lib/journey';
import { useNow } from '../hooks/useNow';
import { amountText } from '@/lib/goalText';
import { countOf } from '@/lib/plural';
import { beforeNoon } from '@/lib/slots';

const GRID = 'grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8';

/**
 * The home page: a dashboard that ends.
 *
 * <p>What the reader started and can finish, what they finished this week, the news, one row
 * from their channels or the feed's suggestions — and then a last
 * line that says they are done, with the way on to Discover for anyone who wants to browse. The
 * endless feed moved to «شاهد» (/watch) on purpose: here the first thing is accomplishing
 * something, not scrolling.
 *
 * <p>Everything personal comes from `GET /api/today` in one response; an anonymous reader gets the
 * news, one row of suggestions and an invitation to sign in. Sections with nothing honest to show
 * are left out rather than shown empty.
 *
 * <p>A first visit — anonymous, or signed in with nothing watched, read or followed — would leave
 * almost every section out, so the backend sends a `welcome` instead: programmes to start from
 * episode one, channels to follow and new books. Whether a reader is new is its decision; this
 * page only draws the welcome when it arrives.
 */
function Today() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const today = useToday();
    const { showToast } = useToast();
    const hideContinue = useHideContinue();
    // Hidden at once; the toast says it is not deleted and how it comes back.
    const hide = (target) => hideContinue.mutate(target, {
        onSuccess: () => showToast(t('today.hidden'), 'success'),
        onError: (error) => showToast(describeError(error, t('today.hideFailed')), 'error'),
    });
    const watchProgress = useWatchProgressMap(!!token);
    const data = today.data;
    // Re-read every minute: the day's portions change time of day under a page cached until it ends.
    const now = useNow();
    const wirdGoals = data?.wird?.goals || [];

    const openVideo = (video) => navigate(`/video/${video.id}`);
    // No `key` in here: React reads a key only when it is written on the element, never spread.
    const cardProps = (video) => ({
        video,
        onClick: openVideo,
        watch: watchProgress[video.id],
    });

    // One row from the feed, chosen by the backend (`fromFeed`): the reader's own channels when
    // they follow any, otherwise suggestions. Its kind picks the heading; nothing else is decided here.
    // Up to eight suggestions (four of the reader's channels); whole rows only at this width, so a
    // three-column grid shows six rather than a row with two cards and a gap.
    const columns = useGridColumns();
    const feedVideos = data?.fromFeed?.videos || [];
    const feedRow = feedVideos.length > columns ? feedVideos.slice(0, feedVideos.length - (feedVideos.length % columns)) : feedVideos;
    const feedRowTitle = data?.fromFeed?.kind === 'SUBSCRIBED' ? t('home.subscribed') : t('home.discover');

    const hasContinue = !!(data?.continueWatching?.length || data?.continueReading?.length);
    const welcome = data?.welcome;
    // A channel we built for this reader, waiting for them to take it over — first on the page,
    // since it is the one thing here addressed to them alone.
    const { data: invitations = [] } = useChannelInvitations(!!token);

    // «اجعله وِردًا» spelled out on ONE card of each row: the first whose programme or book no goal
    // pursues yet. Under every card the sentence read as a nudge; the others carry a small outlined
    // star that does the same thing without saying so, or «في وِردك» where it applies. Keys are
    // `s<seriesId>` / `b<bookId>`.
    const goals = useGoals(!!token);
    const firstOffer = (keys) => keys.find((key) => !goalFor(goals.data, key.startsWith('s')
        ? { seriesId: Number(key.slice(1)) } : { bookId: Number(key.slice(1)) })) ?? null;
    const continueOffer = firstOffer([
        ...(data?.continueWatching || []).filter((item) => item.next.seriesId).map((item) => `s${item.next.seriesId}`),
        ...(data?.continueReading || []).map((entry) => `b${entry.bookId}`),
    ]);
    const startOffer = firstOffer((data?.startProgrammes || []).filter((v) => v.seriesId).map((v) => `s${v.seriesId}`));
    const welcomeOffer = firstOffer((welcome?.programmes || []).filter((v) => v.seriesId).map((v) => `s${v.seriesId}`));

    // No guide opens by itself: a first visit is for the page, and the welcome block's «الدليل»
    // and the link at the page's end are there for whoever wants one.

    return (
        <PageShell tab guide="today">
            <PageHeader
                title={t('nav.tabs.today')}
                action={<DatePair />}
                rule={false}
            />
            <QueryState
                isLoading={today.isLoading}
                isError={today.isError}
                error={today.error}
                onRetry={today.refetch}
                errorTitle={t('today.loadFailed')}
            >
                <div className="flex flex-col gap-10">
                    {invitations.map((invitation) => <ChannelWaiting key={invitation.slug} invitation={invitation} />)}
                    {welcome && <WelcomeHero signedIn={!!token} />}

                    {/* The day's portions (PROGRESS-AND-GOALS.md §7.7): yesterday's to make up before
                        noon first, then every portion of today. A newcomer's welcome is enough on
                        its own, so the first-portion invitation waits for their second visit. */}
                    <QadaCards goals={wirdGoals} now={now} />
                    {data?.wird && (wirdGoals.length > 0 || !welcome) && (
                        <WirdToday
                            wird={data.wird}
                            reviewOpen={data.reviewOpen}
                            recentMilestones={data.recentMilestones}
                            now={now}
                            hasQada={beforeNoon(now) && wirdGoals.some((goal) => goal.qadaCreditDay)}
                        />
                    )}

                    {data?.week && <WeekStrip week={data.week} />}

                    {hasContinue && (
                        <section>
                            <Cartouche title={t('today.continueTitle')} />
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {data.continueWatching.map((item) => (
                                    <ContinueVideo key={item.next.id} item={item} onHide={() => hide({ type: 'SERIES', id: item.next.seriesId })} wird={!!token}
                                        offer={continueOffer === `s${item.next.seriesId}`} />
                                ))}
                                {data.continueReading.map((entry) => (
                                    <ContinueBook key={entry.bookId} entry={entry} onHide={() => hide({ type: 'BOOK', id: entry.bookId })} wird={!!token}
                                        offer={continueOffer === `b${entry.bookId}`} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* For a reader past the welcome: programmes they have not started, from
                        episode one, changing daily — what the Books tab's suggestions do for books
                        (backend TodayWelcome#programmesToStart). */}
                    {data?.startProgrammes?.length > 0 && (
                        <section>
                            <Cartouche title={t('today.startTitle')} />
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {data.startProgrammes.map((video) => (
                                    <ContinueVideo key={video.id} item={{ next: video, progress: 0 }} starting wird={!!token}
                                        offer={startOffer === `s${video.seriesId}`} />
                                ))}
                            </div>
                        </section>
                    )}

                    {welcome?.programmes?.length > 0 && (
                        <section>
                            <Cartouche title={t('today.welcome.programmesTitle')} />
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {welcome.programmes.map((video) => (
                                    <ContinueVideo key={video.id} item={{ next: video, progress: 0 }} starting wird={!!token}
                                        offer={welcomeOffer === `s${video.seriesId}`} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* The hero already invites a new visitor to sign in. */}
                    {!token && !welcome && (
                        <p className="text-sm text-text-secondary">
                            {t('today.signInPrompt')}{' '}
                            <Link to="/login" className="font-semibold">{t('nav.login')}</Link>
                        </p>
                    )}

                    {data?.news?.length > 0 && (
                        <section>
                            <Cartouche title={t('today.newsTitle')} />
                            <div className={GRID}>{data.news.map((video) => <VideoCard key={video.id} {...cardProps(video)} />)}</div>
                        </section>
                    )}


                    {welcome?.channels?.length > 0 && (
                        <section>
                            <Cartouche
                                title={t('today.welcome.channelsTitle')}
                                action={<Link to="/channels">{t('today.welcome.allChannels')}</Link>}
                            />
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                                {welcome.channels.map((channel) => (
                                    <Link
                                        key={channel.id}
                                        to={`/channel/${channel.slug}`}
                                        className="flex flex-col items-center gap-2 text-center text-sm font-semibold text-text-primary hover:text-primary hover:no-underline"
                                    >
                                        <Avatar src={resolveMediaUrl(channel.logoUrl)} name={channel.name} size="lg" />
                                        <span dir="auto" className="line-clamp-2">{channel.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {welcome?.books?.length > 0 && (
                        <section>
                            <Cartouche
                                title={t('today.welcome.booksTitle')}
                                action={<Link to="/books">{t('today.welcome.allBooks')}</Link>}
                            />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
                                {welcome.books.map((book) => <BookCard key={book.id} book={book} />)}
                            </div>
                        </section>
                    )}

                    {feedRow.length > 0 && (
                        <section>
                            <Cartouche
                                title={feedRowTitle}
                                action={<Link to="/watch">{t('today.toDiscover')}</Link>}
                            />
                            <div className={GRID}>{feedRow.map((video) => <VideoCard key={video.id} {...cardProps(video)} />)}</div>
                        </section>
                    )}

                    <Colophon newcomer={!!welcome} />
                </div>
            </QueryState>
        </PageShell>
    );
}

// Static class names for Tailwind: the strip has as many columns as it has cells, from `md`.
const WEEK_COLUMNS = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6', 7: 'md:grid-cols-7' };

/**
 * The week, counted. The backend sends no week at all when there is nothing to count, so a new
 * reader is not shown a row of zeros; this only draws what it is given — and only the counts that
 * are not zero, for the same reason: «٠ برامج أتممتها» beside five finished episodes reads as a
 * verdict. The grid has exactly as many columns as cells, and an odd last cell spans both phone
 * columns, because the hairlines are the grid's background showing through its gaps and an empty
 * slot showed as a grey block.
 */
function WeekStrip({ week }) {
    const counts = [
        { value: week.episodesFinished, label: t('today.episodesFinished') },
        { value: week.pagesRead, label: t('today.pagesRead') },
        { value: week.booksRead, label: t('today.booksRead') },
        { value: week.programmesCompleted, label: t('today.programmesCompleted') },
    ].filter((count) => Number(count.value) > 0);
    const intention = week.intention;
    const cells = 1 + (intention ? 1 : 0) + counts.length + (week.closest ? 1 : 0);
    const first = intention ? 2 : 1;
    const spanLast = (index) => (index === cells - 1 && cells % 2 === 1 ? 'col-span-2 md:col-span-1' : '');
    return (
        <section className={`grid grid-cols-2 ${WEEK_COLUMNS[cells]} gap-px bg-border-light border border-border-light rounded-lg overflow-hidden`}>
            <div className={`bg-surface p-4 ${spanLast(0)}`}>
                <h2 className="font-serif text-[1.6rem] font-semibold leading-none">{t('today.weekTitle')}</h2>
                <p className="text-xs text-text-muted mt-1">{t('today.weekSpan')}</p>
            </div>
            {intention && <IntentionCell intention={intention} className={spanLast(1)} />}
            {counts.map((count, index) => (
                <div key={count.label} className={`bg-surface p-4 ${spanLast(index + first)}`}>
                    <strong className="block font-serif text-[2rem] leading-none text-primary font-semibold">
                        {formatCount(count.value)}
                    </strong>
                    <span className="text-xs text-text-secondary">{count.label}</span>
                </div>
            ))}
            {week.closest && (
                <Link
                    to={`/series/${week.closest.seriesId}`}
                    className={`bg-gold-light p-4 text-text-primary hover:no-underline ${spanLast(cells - 1)}`}
                >
                    <strong className="block font-serif text-[2rem] leading-none text-gold-ink font-semibold">
                        {formatCount(week.closest.remaining)}
                    </strong>
                    <span dir="auto" className="text-xs text-text-secondary">
                        {t('today.closest', { remaining: week.closest.remaining, title: week.closest.seriesTitle })}
                    </span>
                </Link>
            )}
        </section>
    );
}

/**
 * The week's intention — the primary goal's week, beside what the week counted (§7.7): a daily
 * portion counts days kept against its days a week, a weekly goal its amount. The star fills as the
 * week does; nothing marks a shortfall.
 */
function IntentionCell({ intention, className }) {
    const unit = (count, oblique = false) => (intention.days
        ? countOf('journey.units.DAYS', count, { oblique }) : amountText(intention.measure, count, oblique));
    const done = Math.min(intention.done, intention.amount);
    return (
        <Link to="/journey" className={`bg-surface p-4 flex items-center gap-3 text-text-primary hover:no-underline ${className}`}>
            <KhatamProgress
                value={intention.amount ? done / intention.amount : 0}
                title={t('journey.today.intentionAria', { done: intention.done, amount: unit(intention.amount, true) })}
                className="w-11 h-11 flex-shrink-0"
            />
            <span className="min-w-0">
                <strong className="block text-sm font-semibold">{t('journey.today.intentionTitle')}</strong>
                <span className="text-xs text-text-secondary">
                    {intention.done >= intention.amount
                        ? t('journey.today.intentionMet')
                        : t('journey.today.intentionProgress', { done: intention.done, amount: unit(intention.amount, true) })}
                </span>
            </span>
        </Link>
    );
}

/**
 * «قناتك بانتظارك»: a channel page we assembled for this reader, invited at their address, that
 * they have not taken over yet. Gold, because it is the one thing on the page that is theirs to
 * act on; the channel page (which recognises the same address) carries the offer itself.
 */
function ChannelWaiting({ invitation }) {
    return (
        <section className="flex flex-wrap items-center gap-4 p-5 rounded-lg border border-gold/50 bg-gold-light/50">
            <KhatamStar className="w-6 h-6 flex-shrink-0 text-gold" />
            <div className="flex-1 min-w-[14rem]">
                <h2 className="font-serif text-[1.5rem] font-semibold leading-tight">
                    {t('today.channelWaiting.title', { name: invitation.name })}
                </h2>
                <p className="text-sm text-text-secondary mt-1">{t('today.channelWaiting.text')}</p>
            </div>
            <Link
                to={`/channel/${invitation.slug}`}
                className="px-5 py-2 bg-primary text-white rounded-md font-semibold hover:no-underline"
            >
                {t('today.channelWaiting.cta')}
            </Link>
        </section>
    );
}

/**
 * The first thing a new reader sees: what this place is for, and — signed out — the way in.
 * The three purposes are the platform's own: the news, something worth learning, and voices other
 * platforms took down.
 */
function WelcomeHero({ signedIn }) {
    return (
        <section className="relative overflow-hidden border border-border-light rounded-lg bg-surface px-5 py-8 sm:px-8 sm:py-10">
            {/* Clear of the text, and not drawn on a phone, where there is no margin for it to sit in —
                    behind a paragraph it read as a stain, not an ornament. A thin outline, not a
                    fill: any faint fill over the night surface turned grey, a block rather than gold. */}
            <KhatamStar filled={false} strokeWidth={1.2} className="hidden md:block absolute -bottom-28 -end-24 w-72 h-72 text-gold/40 dark:text-gold/25 pointer-events-none" />
            <div className="relative max-w-[640px]">
                <h2 className="font-serif text-[2rem] sm:text-[2.4rem] font-semibold leading-tight">{t('today.welcome.title')}</h2>
                <p className="font-reading text-text-secondary mt-3 leading-relaxed">{t('today.welcome.text')}</p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm font-semibold">
                    <li className="flex items-center gap-2"><KhatamStar className="w-3.5 h-3.5 text-gold" />{t('today.welcome.news')}</li>
                    <li className="flex items-center gap-2"><KhatamStar className="w-3.5 h-3.5 text-primary" />{t('today.welcome.learn')}</li>
                    <li className="flex items-center gap-2"><KhatamStar className="w-3.5 h-3.5 text-voice" />{t('today.welcome.voice')}</li>
                </ul>
                <p className="text-sm text-text-muted mt-5">
                    {signedIn ? t('today.welcome.howItFills') : t('today.welcome.signInWhy')}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                    {!signedIn && (
                        <>
                        <Link to="/register" className="px-5 py-2 bg-primary text-white rounded-md font-semibold hover:no-underline">
                            {t('nav.register')}
                        </Link>
                        <Link to="/login" className="px-5 py-2 border border-border rounded-md bg-bg font-semibold hover:no-underline hover:border-primary">
                            {t('nav.login')}
                        </Link>
                        </>
                    )}
                    <Link to="/guide" className="text-sm font-semibold">{t('today.welcome.guide')}</Link>
                </div>
            </div>
        </section>
    );
}

/**
 * A programme in progress: the star traced as far as the reader has come, and what is next.
 * `starting` is the welcome's case — a programme offered from its first episode, nothing traced.
 */
function ContinueVideo({ item, starting = false, onHide = null, wird = false, offer = true }) {
    const video = item.next;
    const position = video.seriesPosition;
    const total = video.seriesLength;
    const href = `/video/${video.id}${item.resumeSeconds ? `?t=${item.resumeSeconds}` : ''}`;
    return (
        <div className={CARD}>
        <Link
            to={href}
            className={`flex items-center gap-4 p-3.5 ${onHide ? 'pe-10' : ''} text-text-primary hover:no-underline`}
        >
            <KhatamProgress
                value={item.progress || 0}
                // A position, not a count: no thousands separator («١٢٣٤», not «١٬٢٣٤»).
                label={position ? formatDigits(String(position)) : null}
                title={position && total ? t('today.progressAria', { title: video.seriesTitle || video.title, position, total }) : video.title}
                className="w-16 h-16 flex-shrink-0"
            />
            <div className="min-w-0" dir="auto">
                <div className="font-bold truncate">{video.seriesTitle || video.title}</div>
                {video.seriesTitle && <div className="text-xs text-text-muted truncate">{video.title}</div>}
                <div className="text-xs font-bold text-gold-ink mt-1">
                    {item.resumeSeconds
                        ? t('today.resume', { time: formatTimestamp(item.resumeSeconds) })
                        : starting && total ? t('today.welcome.startProgramme', { total })
                            : position && total ? t('today.next', { position, total }) : null}
                </div>
            </div>
        </Link>
        {wird && video.seriesId && (
            <div className={CARD_ACTION}>
                <MakeWird seriesId={video.seriesId} title={video.seriesTitle || video.title} offer={offer} />
            </div>
        )}
        {onHide && <HideButton onHide={onHide} />}
        </div>
    );
}

// The card's frame is the wrapper, so the link and the «اجعله وِردًا» line under it — two controls,
// never one inside the other — read as one card.
const CARD = 'relative group/card flex flex-col bg-surface border border-border-light rounded-lg hover:border-border transition-colors';
// Lined up under the title: past the 4rem star and its gap.
const CARD_ACTION = 'ps-[5.875rem] pe-3.5 pb-3 -mt-2';

/** A book in progress, traced in teal to tell it from a programme at a glance. */
function ContinueBook({ entry, onHide = null, wird = false, offer = true }) {
    return (
        <div className={CARD}>
        <Link
            to={`/books/${entry.bookId}`}
            className={`flex items-center gap-4 p-3.5 ${onHide ? 'pe-10' : ''} text-text-primary hover:no-underline`}
        >
            <KhatamProgress
                value={entry.progress || 0}
                label={t('today.pageShort', { page: entry.currentPage })}
                title={t('today.readingAria', { title: entry.book?.title, page: entry.currentPage })}
                traceClassName="text-primary"
                className="w-16 h-16 flex-shrink-0"
            />
            <div className="min-w-0" dir="auto">
                <div className="font-bold truncate">{entry.book?.title}</div>
                <div className="text-xs font-bold text-primary mt-1">{t('today.readFrom', { page: entry.currentPage })}</div>
            </div>
        </Link>
        {wird && (
            <div className={CARD_ACTION}>
                <MakeWird bookId={entry.bookId} title={entry.book?.title} pages={entry.book?.pages} currentPage={entry.currentPage} offer={offer} />
            </div>
        )}
        {onHide && <HideButton onHide={onHide} />}
        </div>
    );
}

/**
 * «إخفاء»: takes a card off «تكملة ما بدأته» — a sibling of the card's link, never inside it (a
 * button in a link is two controls in one). Quiet until the card is hovered or focused on a
 * pointer screen; always there on touch, which has no hover to find it with.
 */
function HideButton({ onHide }) {
    return (
        <button
            type="button"
            onClick={onHide}
            aria-label={t('today.hide')}
            title={t('today.hide')}
            className="absolute top-2 end-2 flex items-center justify-center w-7 h-7 rounded-full text-text-muted
                hover:text-text-primary hover:bg-surface-hover focus-visible:text-text-primary
                [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/card:opacity-100
                [@media(hover:hover)]:focus-visible:opacity-100 transition-opacity"
        >
            <X size={15} aria-hidden="true" />
        </button>
    );
}

/** The page's last line: it ends here, and Discover is the way on. */
function Colophon({ newcomer }) {
    return (
        <footer className="text-center pt-4 pb-2">
            <div className="flex items-center justify-center gap-3 mb-4" aria-hidden="true">
                <span className="h-px w-24 bg-border" />
                <KhatamStar className="w-5 h-5 text-gold" />
                <span className="h-px w-24 bg-border" />
            </div>
            <h2 className="font-serif text-[1.6rem] font-semibold">
                {newcomer ? t('today.welcome.colophonTitle') : t('today.colophonTitle')}
            </h2>
            <p className="text-sm text-text-muted mt-1">{t('today.colophonText')}</p>
            <Link
                to="/watch"
                className="inline-block mt-4 px-5 py-2 border border-border rounded-md bg-surface font-semibold hover:no-underline hover:border-primary"
            >
                {t('today.toDiscover')}
            </Link>
        </footer>
    );
}

export default Today;
