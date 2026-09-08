import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, Modal } from '../components/ui';
import { VideoCard } from '../components/content';
import { useInfiniteVideos, useCategories, useFeed, useWatchProgressMap } from '../hooks/useVideos';
import { useMyChannels, useToggleVideoVisibilityByChannelId, useDeleteVideoByChannelId } from '../hooks/useChannels';
import { t } from '@/i18n';

// One chip, three callers — the class string was already duplicated twice before a third arrived.
const chipClass = (active) =>
    `px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
        active
            ? 'bg-primary text-white border-2 border-primary'
            : 'bg-surface text-text-secondary border border-border'
    }`;

function Home() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showToast } = useToast();
    const [selectedCategory, setSelectedCategory] = useState('');
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

    const showBrowse = (category) => {
        setView('browse');
        setSelectedCategory(category);
    };

    const feedQuery = useFeed(isDefaultView);
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
    } = useInfiniteVideos('', selectedCategory, 12);

    const feedSections = [
        { key: 'subscribed', title: t('home.subscribed') },
        { key: 'discover', title: t('home.discover') },
        { key: 'featured', title: t('home.featured') },
    ];

    /**
     * The feed's tail: everything the curated sections did not show, paginated.
     *
     * <p>The three feed sections are capped at 8/6/4 by design and that stays — they answer "what
     * should I watch". But with no subscriptions and nothing featured they yield six videos, and
     * the home page of a two-thousand-video platform then ended at six with no way forward. This
     * is the way forward, and it is the same query the browse view uses rather than a second
     * source that could disagree with it.
     *
     * <p>De-duplicated against the sections above, because the tail is "all recent videos" and
     * will naturally include whatever discover just picked.
     */
    const feedShownIds = new Set(
        feedSections.flatMap((section) => feedQuery.data?.[section.key] || []).map((v) => v.id),
    );
    const feedTail = (infiniteData?.pages.flatMap((page) => page.content) || [])
        .filter((video) => !feedShownIds.has(video.id));

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
        <PageShell contentClassName="p-4 sm:p-6">
            <div className="flex gap-2 flex-wrap mb-5">
                <button
                    onClick={() => { setView('feed'); setSelectedCategory(''); }}
                    className={chipClass(isDefaultView)}
                >
                    {t('home.forYou')}
                </button>
                {/* The route to the whole catalogue, which used to exist only if a category
                    happened to be set. */}
                <button
                    onClick={() => showBrowse('')}
                    className={chipClass(!isDefaultView && selectedCategory === '')}
                >
                    {t('home.browseAll')}
                </button>
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
                    isLoading={feedQuery.isLoading}
                    isError={feedQuery.isError}
                    error={feedQuery.error}
                    onRetry={feedQuery.refetch}
                    isEmpty={feedSections.every((section) => !(feedQuery.data?.[section.key]?.length))}
                    errorTitle={t('home.loadFailed')}
                    emptyTitle={t('home.empty')}
                    emptyDescription={t('common.comingSoon')}
                >
                    <div className="flex flex-col gap-8">
                        {feedSections.map((section) => {
                            const items = feedQuery.data?.[section.key] || [];
                            if (items.length === 0) return null;
                            return (
                                <div key={section.key}>
                                    <h2 className="text-lg font-bold mb-3">{section.title}</h2>
                                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {items.map((video) => (
                                            <VideoCard {...videoCardProps(video)} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {feedTail.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-lg font-bold mb-3">{t('home.more')}</h2>
                            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {feedTail.map((video) => (
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
                        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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

export default Home;
