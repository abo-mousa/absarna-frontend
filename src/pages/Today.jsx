import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, Cartouche, KhatamProgress, KhatamStar } from '../components/ui';
import { VideoCard } from '../components/content';
import { useToday } from '../hooks/useToday';
import { useWatchProgressMap } from '../hooks/useVideos';
import { formatTimestamp } from '@/lib/spans';
import { formatCount } from '@/lib/numbers';
import { t } from '@/i18n';

const GRID = 'grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8';

/**
 * The home page: a dashboard that ends.
 *
 * <p>What the reader started and can finish, what they finished this week, the news, one row
 * suggested because of something they finished, one row from their channels — and then a last
 * line that says they are done, with the way on to Discover for anyone who wants to browse. The
 * endless feed moved to Discover (/discover) on purpose: here the first thing is accomplishing
 * something, not scrolling.
 *
 * <p>Everything personal comes from `GET /api/today` in one response; an anonymous reader gets the
 * news, one row of suggestions and an invitation to sign in. Sections with nothing honest to show
 * are left out rather than shown empty.
 */
function Today() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const today = useToday();
    const watchProgress = useWatchProgressMap(!!token);
    const data = today.data;

    const openVideo = (video) => navigate(`/video/${video.id}`);
    const cardProps = (video) => ({
        key: video.id,
        video,
        onClick: openVideo,
        watchedSeconds: watchProgress[video.id],
    });

    // One row from the feed, chosen by the backend (`fromFeed`): the reader's own channels when
    // they follow any, otherwise suggestions. Its kind picks the heading; nothing else is decided here.
    const feedRow = data?.fromFeed?.videos || [];
    const feedRowTitle = data?.fromFeed?.kind === 'SUBSCRIBED' ? t('home.subscribed') : t('home.discover');

    const hasContinue = !!(data?.continueWatching?.length || data?.continueReading?.length);

    return (
        <PageShell contentClassName="p-4 sm:p-6">
            <QueryState
                isLoading={today.isLoading}
                isError={today.isError}
                error={today.error}
                onRetry={today.refetch}
                errorTitle={t('today.loadFailed')}
            >
                <div className="flex flex-col gap-10">
                    {data?.week && <WeekStrip week={data.week} />}

                    {hasContinue && (
                        <section>
                            <Cartouche title={t('today.continueTitle')} />
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {data.continueWatching.map((item) => (
                                    <ContinueVideo key={item.next.id} item={item} />
                                ))}
                                {data.continueReading.map((entry) => (
                                    <ContinueBook key={entry.bookId} entry={entry} />
                                ))}
                            </div>
                        </section>
                    )}

                    {!token && (
                        <p className="text-sm text-text-secondary">
                            {t('today.signInPrompt')}{' '}
                            <Link to="/login" className="font-semibold">{t('nav.login')}</Link>
                        </p>
                    )}

                    {data?.news?.length > 0 && (
                        <section>
                            <Cartouche title={t('today.newsTitle')} />
                            <div className={GRID}>{data.news.slice(0, 4).map((video) => <VideoCard {...cardProps(video)} />)}</div>
                        </section>
                    )}

                    {data?.because && (
                        <section>
                            <Cartouche title={t('today.because', { title: data.because.basedOn.title })} />
                            <div className={GRID}>{data.because.videos.map((video) => <VideoCard {...cardProps(video)} />)}</div>
                        </section>
                    )}

                    {feedRow.length > 0 && (
                        <section>
                            <Cartouche
                                title={feedRowTitle}
                                action={<Link to="/discover">{t('today.toDiscover')}</Link>}
                            />
                            <div className={GRID}>{feedRow.map((video) => <VideoCard {...cardProps(video)} />)}</div>
                        </section>
                    )}

                    <Colophon />
                </div>
            </QueryState>
        </PageShell>
    );
}

/**
 * The week, counted. The backend sends no week at all when there is nothing to count, so a new
 * reader is not shown a row of zeros; this only draws what it is given.
 */
function WeekStrip({ week }) {
    const counts = [
        { value: week.episodesFinished, label: t('today.episodesFinished') },
        { value: week.pagesRead, label: t('today.pagesRead') },
        { value: week.programmesCompleted, label: t('today.programmesCompleted') },
    ];
    return (
        <section className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border-light border border-border-light rounded-lg overflow-hidden">
            <div className="bg-surface p-4">
                <h2 className="font-serif text-[1.6rem] font-semibold leading-none">{t('today.weekTitle')}</h2>
                <p className="text-xs text-text-muted mt-1">{t('today.weekSpan')}</p>
            </div>
            {counts.map((count) => (
                <div key={count.label} className="bg-surface p-4">
                    <strong className="block font-serif text-[2rem] leading-none text-primary font-semibold">
                        {formatCount(count.value)}
                    </strong>
                    <span className="text-xs text-text-secondary">{count.label}</span>
                </div>
            ))}
            {week.closest && (
                <Link
                    to={`/series/${week.closest.seriesId}`}
                    className="bg-gold-light p-4 text-text-primary hover:no-underline col-span-2 md:col-span-1"
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

/** A programme in progress: the star traced as far as the reader has come, and what is next. */
function ContinueVideo({ item }) {
    const video = item.next;
    const position = video.seriesPosition;
    const total = video.seriesLength;
    const href = `/video/${video.id}${item.resumeSeconds ? `?t=${item.resumeSeconds}` : ''}`;
    return (
        <Link
            to={href}
            className="flex items-center gap-4 p-3.5 bg-surface border border-border-light rounded-lg text-text-primary hover:no-underline hover:border-border transition-colors"
        >
            <KhatamProgress
                value={item.progress || 0}
                label={position ? formatCount(position) : null}
                title={position && total ? t('today.progressAria', { title: video.seriesTitle || video.title, position, total }) : video.title}
                className="w-16 h-16 flex-shrink-0"
            />
            <div className="min-w-0" dir="auto">
                <div className="font-bold truncate">{video.seriesTitle || video.title}</div>
                {video.seriesTitle && <div className="text-xs text-text-muted truncate">{video.title}</div>}
                <div className="text-xs font-bold text-gold-ink mt-1">
                    {item.resumeSeconds
                        ? t('today.resume', { time: formatTimestamp(item.resumeSeconds) })
                        : position && total ? t('today.next', { position, total }) : null}
                </div>
            </div>
        </Link>
    );
}

/** A book in progress, traced in teal to tell it from a programme at a glance. */
function ContinueBook({ entry }) {
    return (
        <Link
            to={`/books/${entry.bookId}`}
            className="flex items-center gap-4 p-3.5 bg-surface border border-border-light rounded-lg text-text-primary hover:no-underline hover:border-border transition-colors"
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
    );
}

/** The page's last line: it ends here, and Discover is the way on. */
function Colophon() {
    return (
        <footer className="text-center pt-4 pb-2">
            <div className="flex items-center justify-center gap-3 mb-4" aria-hidden="true">
                <span className="h-px w-24 bg-border" />
                <KhatamStar className="w-5 h-5 text-gold" />
                <span className="h-px w-24 bg-border" />
            </div>
            <h2 className="font-serif text-[1.6rem] font-semibold">{t('today.colophonTitle')}</h2>
            <p className="text-sm text-text-muted mt-1">{t('today.colophonText')}</p>
            <Link
                to="/discover"
                className="inline-block mt-4 px-5 py-2 border border-border rounded-md bg-surface font-semibold hover:no-underline hover:border-primary"
            >
                {t('today.toDiscover')}
            </Link>
        </footer>
    );
}

export default Today;
