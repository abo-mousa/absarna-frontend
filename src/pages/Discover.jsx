import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, Modal, Cartouche, PageHeader } from '../components/ui';
import { VideoCard } from '../components/content';
import { useInfiniteVideos, useCategories, useFormats, useFeed, useWatchProgressMap } from '../hooks/useVideos';
import { formatChipLabel } from '@/lib/formats';
import { useMyChannels, useToggleVideoVisibilityByChannelId, useDeleteVideoByChannelId } from '../hooks/useChannels';
import { t } from '@/i18n';
import { useGridColumns } from '../hooks/useGridColumns';
import ChannelRail from '../components/layout/ChannelRail';
import { fitFeedToRows } from '@/lib/gridRows';

// The feed's three sections, in the order they render.
const FEED_SECTION_KEYS = ['subscribed', 'discover', 'featured'];

// One chip, three callers — the class string was already duplicated twice before a third arrived.
// Square-cornered (`rounded-md` is 3px now), not a pill: the rounded chip row above a grid was
// one of the plainest YouTube marks on the page.
const chipClass = (active) =>
    `px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
        active
            ? 'bg-primary text-white border-2 border-primary'
            : 'bg-surface text-text-secondary border border-border'
    }`;

/**
 * Discover: the feed and everything after it — the YouTube-shaped tab, on purpose.
 *
 * <p>This was the home page. It moves one tab over because the home page is becoming the Today
 * dashboard, which ends; this one keeps loading, and that is right here, because a reader who
 * opens Discover has chosen to browse. Until Today lands, `/` renders this page too.
 */
function Discover() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showToast } = useToast();
    const [selectedCategory, setSelectedCategory] = useState('');
    // What kind of video (a format chip), independent of the topic (a category chip): the two
    // combine, «وثائقيات» and «تاريخ» at once.
    const [selectedFormat, setSelectedFormat] = useState('');
    /**
     * Which of the two home views is showing.
     *
     * <p>Previously implied by `selectedCategory === ''`, which made the curated feed and
     * "browse everything" the same state — so the paginated list was only reachable by picking a
     * category. That was fine while every video had one and became a dead end the moment a
     * YouTube import landed 1,926 videos with no category at all: the home page could show at
     * most eighteen of them and offered no route to the rest.
     *
     * <p>They are separate now because they are genuinely different questions — "what should I
     * watch" and "show me everything" — and only the first should be bounded. The feed stays a
     * capped, non-paginated snapshot on purpose (see FeedService); browsing is the honest way to
     * reach a catalogue, and neither has to pretend to be the other.
     */
    const [view, setView] = useState('feed');
    const [deletingVideo, setDeletingVideo] = useState(null);
    const { data: myChannels = [] } = useMyChannels(!!token);

    const mySlugByChannelId = useMemo(
        () => Object.fromEntries(myChannels.map((c) => [c.id, c.slug])),
        [myChannels]
    );

    const watchProgress = useWatchProgressMap(!!token);

    const isDefaultView = view === 'feed';

    const { data: categories = [] } = useCategories();
    const { data: formats = [] } = useFormats();

    const showBrowse = (category) => {
        setView('browse');
        setSelectedCategory(category);
    };

    // A second press on the active format chip lets go of it, and the topic stays: the two are
    // separate questions, so dropping one does not reset the other.
    const toggleFormat = (format) => {
        setView('browse');
        setSelectedFormat((current) => (current === format ? '' : format));
    };

    const feedQuery = useFeed(isDefaultView);

    const feedSections = [
        { key: 'subscribed', title: t('home.subscribed') },
        { key: 'discover', title: t('home.discover') },
        { key: 'featured', title: t('home.featured') },
    ];

    /*
     * The ids the sections show, sorted so the same set is the same query key. The tail waits for
     * the feed so it can send them: the server then leaves them out before paging, and every tail
     * page is twelve videos nobody has seen above it. A failed feed releases the tail unfiltered —
     * the tail is then the whole page, and waiting on a request that already failed would blank it.
     */
    const feedShownIdList = useMemo(() => FEED_SECTION_KEYS
        .flatMap((key) => feedQuery.data?.[key] || [])
        .map((video) => video.id)
        .sort((a, b) => a - b), [feedQuery.data]);

    const {
        data: infiniteData,
        isLoading: infiniteLoading,
        isFetching: infiniteFetching,
        isError: infiniteError,
        error: infiniteErrorObject,
        refetch: refetchInfinite,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        // Diversified in the feed view and not in browse, from one hook because the two views
        // share this query. The feed chip clears selectedCategory, so in that view this is always
        // the unnarrowed platform-wide listing — which is the only shape the backend diversifies.
        //
        // The tail is "everything the curated sections did not show", and newest-first alone made
        // that mostly one channel: a channel holding most of the catalogue publishes most of what
        // is new, so it earned most of every page honestly. The backend now caps how many videos
        // one channel contributes per round while keeping the order newest-first within a round.
        //
        // Browse keeps strict recency on purpose. "كل الفيديوهات" is the one place left to see
        // what was genuinely published most recently, and a reader who picked a category has
        // already said what they want.
    } = useInfiniteVideos('', isDefaultView ? '' : selectedCategory, 12, !isDefaultView || feedQuery.isSuccess || feedQuery.isError,
        isDefaultView, isDefaultView ? feedShownIdList : undefined, isDefaultView ? '' : selectedFormat);

    /**
     * The feed's tail: everything the curated sections did not show, paginated.
     *
     * <p>The three feed sections are capped at 12 by design and that stays — they answer "what
     * should I watch". But with no subscriptions and nothing featured they yield one section, and
     * the home page of a two-thousand-video platform would then end there with no way forward. This
     * is the way forward, and it is the same query the browse view uses rather than a second
     * source that could disagree with it.
     *
     * <p>The server leaves out what the sections above show (`exclude`), so this filter is a guard
     * rather than the mechanism: a backend from before that parameter ignores it, and during a
     * deploy the two can be out of step. Without the guard the same video would sit in discover
     * and directly below it.
     */
    const feedShownIds = new Set(
        feedSections.flatMap((section) => feedQuery.data?.[section.key] || []).map((v) => v.id),
    );
    const feedTail = (infiniteData?.pages.flatMap((page) => page.content) || [])
        .filter((video) => !feedShownIds.has(video.id));

    /*
     * Empty means the sections AND the tail. The empty state used to look at the sections alone,
     * and it replaces everything inside it — so a first-time visitor with no subscriptions, on a
     * platform with nothing featured, got "nothing here yet" over a catalogue that had videos.
     * While the sections are empty the tail is the whole page, so wait for it before deciding.
     */
    const sectionsEmpty = feedSections.every((section) => !(feedQuery.data?.[section.key]?.length));
    const feedEmpty = sectionsEmpty && feedTail.length === 0;

    // Complete grid rows only — see fitFeedToRows for what moves where and why nothing is lost.
    const columns = useGridColumns();
    const fitted = fitFeedToRows({
        sections: feedSections.map((section) => ({ key: section.key, items: feedQuery.data?.[section.key] || [] })),
        tail: feedTail,
        columns,
        tailComplete: !hasNextPage,
    });
    const fittedItems = Object.fromEntries(fitted.sections.map((section) => [section.key, section.items]));

    // A tail that fits in less than one row has nothing to show until the next page arrives, and a
    // heading over an empty grid with a "load more" under it reads as broken. Fetch it instead.
    useEffect(() => {
        if (isDefaultView && fitted.tail.length === 0 && fitted.heldBack > 0 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [isDefaultView, fitted.tail.length, fitted.heldBack, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const toggleVisibility = useToggleVideoVisibilityByChannelId();
    const deleteVideo = useDeleteVideoByChannelId();

    const handleToggleVisibility = (video) => {
        const slug = mySlugByChannelId[video.channelId];
        if (!slug) return;
        toggleVisibility.mutate(
            { slug, video },
            { onError: () => showToast(t('home.visibilityFailed'), 'error') }
        );
    };

    const confirmDelete = () => {
        const video = deletingVideo;
        setDeletingVideo(null);
        const slug = mySlugByChannelId[video.channelId];
        if (!slug) return;
        deleteVideo.mutate(
            { slug, video },
            { onError: () => showToast(t('home.deleteFailed'), 'error') }
        );
    };

    const videoCardProps = (video) => ({
        key: video.id,
        video,
        onClick: () => navigate(`/video/${video.id}`),
        isOwner: !!mySlugByChannelId[video.channelId],
        onToggleVisibility: handleToggleVisibility,
        onDelete: setDeletingVideo,
        watchedSeconds: watchProgress[video.id],
    });


    return (
        <PageShell tab>
            <PageHeader title={t('nav.tabs.discover')} />
            {/* The channel column (wide screens only) beside everything below the header — so the
                title and its rule stay exactly where every other tab has them. */}
            <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
            <ChannelRail />
            <div className="min-w-0">
            <div className="flex gap-2 flex-wrap mb-5">
                <button
                    onClick={() => { setView('feed'); setSelectedCategory(''); setSelectedFormat(''); }}
                    className={chipClass(isDefaultView)}
                >
                    {t('home.forYou')}
                </button>
                {/* The route to the whole catalogue, which used to exist only if a category
                    happened to be set. It lets go of both narrowings. */}
                <button
                    onClick={() => { showBrowse(''); setSelectedFormat(''); }}
                    className={chipClass(!isDefaultView && selectedCategory === '' && selectedFormat === '')}
                >
                    {t('home.browseAll')}
                </button>
                {/* Formats first — what kind of thing — then, after a rule, topics. Only formats
                    some video has (GET /api/formats), so no chip opens an empty page. */}
                {formats.filter((f) => f.inUse).map(({ name }) => (
                    <button
                        key={name}
                        onClick={() => toggleFormat(name)}
                        aria-pressed={!isDefaultView && selectedFormat === name}
                        className={chipClass(!isDefaultView && selectedFormat === name)}
                    >
                        {formatChipLabel(name)}
                    </button>
                ))}
                {formats.some((f) => f.inUse) && categories.length > 0 && (
                    <span aria-hidden="true" className="w-px self-stretch my-1 mx-1 bg-border" />
                )}
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => showBrowse(cat)}
                        className={chipClass(!isDefaultView && selectedCategory === cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {isDefaultView ? (
                <QueryState
                    isLoading={feedQuery.isLoading || (sectionsEmpty && infiniteLoading)}
                    isError={feedQuery.isError}
                    error={feedQuery.error}
                    onRetry={feedQuery.refetch}
                    isEmpty={feedEmpty}
                    errorTitle={t('home.loadFailed')}
                    emptyTitle={t('home.empty')}
                    emptyDescription={t('common.comingSoon')}
                >
                    <div className="flex flex-col gap-8">
                        {feedSections.map((section) => {
                            const items = fittedItems[section.key] || [];
                            if (items.length === 0) return null;
                            return (
                                <div key={section.key}>
                                    <Cartouche title={section.title} />
                                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8">
                                        {items.map((video) => (
                                            <VideoCard {...videoCardProps(video)} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {fitted.tail.length > 0 && (
                        <div className="mt-8">
                            <Cartouche title={t('home.more')} />
                            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8">
                                {fitted.tail.map((video) => (
                                    <VideoCard {...videoCardProps(video)} />
                                ))}
                            </div>

                            {hasNextPage && (
                                <div className="text-center mt-6">
                                    <button
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                                    >
                                        {isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </QueryState>
            ) : (
                <div className={`content-transition ${infiniteFetching && !isFetchingNextPage ? 'fading' : ''}`}>
                    <QueryState
                        isLoading={infiniteLoading}
                        isError={infiniteError}
                        error={infiniteErrorObject}
                        onRetry={refetchInfinite}
                        isEmpty={(infiniteData?.pages.flatMap((page) => page.content) || []).length === 0}
                        errorTitle={t('home.loadFailed')}
                        emptyTitle={t('home.empty')}
                        emptyDescription={t('common.comingSoon')}
                    >
                        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8">
                            {infiniteData?.pages.flatMap((page) => page.content).map((video) => (
                                <VideoCard {...videoCardProps(video)} />
                            ))}
                        </div>

                        {hasNextPage && (
                            <div className="text-center mt-6">
                                <button
                                    onClick={fetchNextPage}
                                    disabled={isFetchingNextPage}
                                    className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                                >
                                    {isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
                                </button>
                            </div>
                        )}
                    </QueryState>
                </div>
            )}

            </div>
            </div>

            <Modal open={!!deletingVideo} onClose={() => setDeletingVideo(null)} title={t('home.deleteVideoTitle')} maxWidth="400px">
                <p className="text-text-secondary mb-5">
                    {t('home.deleteVideoConfirm', { title: deletingVideo?.title })}
                </p>
                <div className="flex gap-2 justify-end">
                    <button onClick={() => setDeletingVideo(null)} className="px-4 py-2 text-text-secondary font-semibold">
                        {t('common.cancel')}
                    </button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold">
                        {t('common.delete')}
                    </button>
                </div>
            </Modal>
        </PageShell>
    );
}

export default Discover;
