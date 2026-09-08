import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Video, BookOpen, FileText, MessageSquare, Settings, Tv } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, Avatar } from '../components/ui';
import { VideoCard, BookCard, ArticleCard, PostCard, SubscribeButton } from '../components/content';
import { useWatchProgressMap, useReadingProgressMap } from '../hooks/useVideos';
import { usePageMeta } from '../hooks/usePageMeta';
import { resolveMediaUrl } from '@/lib/media';
import { isChannelOwner } from '@/lib/user';
import {
    useChannel,
    useChannelVideos,
    useChannelBooks,
    useChannelArticles,
    useChannelPosts,
    useSubscriptionStatus,
} from '../hooks/useChannels';
import { useChannelSeries } from '../hooks/useSeries';
import { t } from '@/i18n';

function ChannelPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const [activeTab, setActiveTab] = useState('videos');
    const [bannerFailed, setBannerFailed] = useState(false);
    const watchProgress = useWatchProgressMap(!!token);
    const readingProgress = useReadingProgressMap(!!token);

    const { data: channel, isLoading: channelLoading, isError: channelError, error: channelErrorObject, refetch: refetchChannel } = useChannel(slug);
    const {
        data: videoPages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useChannelVideos(slug, 24, !!channel);
    const videos = videoPages?.pages.flatMap((page) => page.content) || [];
    const videoCount = videoPages?.pages[0]?.totalItems ?? videos.length;

    const {
        data: bookPages,
        fetchNextPage: fetchNextBooksPage,
        hasNextPage: hasNextBooksPage,
        isFetchingNextPage: isFetchingNextBooksPage,
    } = useChannelBooks(slug, 24, !!channel);
    const books = bookPages?.pages.flatMap((page) => page.content) || [];
    const bookCount = bookPages?.pages[0]?.totalItems ?? books.length;

    const {
        data: articlePages,
        fetchNextPage: fetchNextArticlesPage,
        hasNextPage: hasNextArticlesPage,
        isFetchingNextPage: isFetchingNextArticlesPage,
    } = useChannelArticles(slug, 24, !!channel);
    const articles = articlePages?.pages.flatMap((page) => page.content) || [];
    const articleCount = articlePages?.pages[0]?.totalItems ?? articles.length;

    const {
        data: postPages,
        fetchNextPage: fetchNextPostsPage,
        hasNextPage: hasNextPostsPage,
        isFetchingNextPage: isFetchingNextPostsPage,
    } = useChannelPosts(slug, 24, !!channel);
    const posts = postPages?.pages.flatMap((page) => page.content) || [];
    const postCount = postPages?.pages[0]?.totalItems ?? posts.length;
    // Still read here for the subscriber count in the header; the toggle itself moved into
    // SubscribeButton, which runs this same cached query.
    const { data: subscriptionStatus } = useSubscriptionStatus(channel?.id, !!token && !!channel);
    const { data: series = [] } = useChannelSeries(slug, !!channel);

    const subscriberCount = subscriptionStatus?.subscriberCount || 0;

    usePageMeta({
        title: channel?.name,
        description: channel?.description?.slice(0, 200),
        image: resolveMediaUrl(channel?.bannerUrl || channel?.logoUrl),
    });

    const isOwner = isChannelOwner(user, channel);

    const tabs = [
        { id: 'videos', label: t('common.videos'), icon: Video, count: videoCount },
        { id: 'books', label: t('common.books'), icon: BookOpen, count: bookCount },
        { id: 'articles', label: t('common.articles'), icon: FileText, count: articleCount },
        { id: 'posts', label: t('common.posts'), icon: MessageSquare, count: postCount },
        { id: 'series', label: t('common.series'), icon: Tv, count: series.length },
    ];

    if (channelLoading || !channel) {
        return (
            <PageShell>
                {/* A failed request used to land in the empty branch — "this channel does not
                    exist" for what may be a dropped connection. isError separates the two. */}
                <QueryState
                    isLoading={channelLoading}
                    isError={channelError}
                    error={channelErrorObject}
                    onRetry={refetchChannel}
                    errorTitle={t('channel.loadFailed')}
                    isEmpty={!channelLoading && !channelError}
                    emptyTitle={t('channel.notFound')}
                />
            </PageShell>
        );
    }

    return (
        <PageShell currentChannel={slug} contentClassName="p-4 sm:p-6">
            <div className="rounded-lg overflow-hidden mb-5" style={{ background: channel.primaryColor || '#0D6B4D' }}>
                {/* Owner-supplied and external. On failure the banner is dropped entirely and
                    the header falls back to the channel's own primaryColor behind it — which is
                    what a channel with no banner already looks like. */}
                {channel.bannerUrl && !bannerFailed && (
                    <div className="h-[120px] sm:h-[160px] w-full overflow-hidden">
                        <img
                            src={resolveMediaUrl(channel.bannerUrl)}
                            alt=""
                            onError={() => setBannerFailed(true)}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="p-5 sm:p-6 text-white flex items-center gap-4 flex-wrap">
                    <Avatar src={resolveMediaUrl(channel.logoUrl)} name={channel.name} size="lg" className="!bg-white/20" />

                    <div className="flex-1 min-w-[150px]">
                        <h1 className="text-white m-0 text-xl sm:text-2xl font-bold">{channel.name}</h1>
                        {token && <p className="opacity-90 text-sm mt-1">{t('channel.subscriberCount', { count: subscriberCount })}</p>}
                        {channel.description && (
                            <p className="opacity-90 text-sm mt-2 max-w-[500px]">{channel.description}</p>
                        )}
                    </div>

                    {isOwner && (
                        <Link
                            to={`/channel/${slug}/manage`}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 text-white rounded-full font-semibold text-sm"
                        >
                            <Settings size={18} /> {t('channel.manage')}
                        </Link>
                    )}

                    <SubscribeButton channelId={channel.id} variant="banner" />
                </div>
            </div>

            <div className="flex gap-2 mb-5 flex-wrap">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                            activeTab === tab.id
                                ? 'bg-primary text-white border-2 border-primary'
                                : 'bg-surface text-text-secondary border border-border'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-surface-hover'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {activeTab === 'videos' && (
                <QueryState isEmpty={videos.length === 0} emptyTitle={t('channel.noVideos')}>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                        {videos.map((video) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                onClick={() => navigate(`/video/${video.id}`)}
                                watchedSeconds={watchProgress[video.id]}
                                showChannel={false}
                            />
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
            )}

            {activeTab === 'books' && (
                <QueryState isEmpty={books.length === 0} emptyTitle={t('books.emptyOnChannel')}>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                        {books.map((book) => (
                            <BookCard key={book.id} book={book} currentPage={readingProgress[book.id]} />
                        ))}
                    </div>

                    {hasNextBooksPage && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => fetchNextBooksPage()}
                                disabled={isFetchingNextBooksPage}
                                className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                            >
                                {isFetchingNextBooksPage ? t('common.loading') : t('common.loadMore')}
                            </button>
                        </div>
                    )}
                </QueryState>
            )}

            {activeTab === 'articles' && (
                <QueryState isEmpty={articles.length === 0} emptyTitle={t('articles.emptyOnChannel')}>
                    <div className="grid gap-3">
                        {articles.map((article) => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>

                    {hasNextArticlesPage && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => fetchNextArticlesPage()}
                                disabled={isFetchingNextArticlesPage}
                                className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                            >
                                {isFetchingNextArticlesPage ? t('common.loading') : t('common.loadMore')}
                            </button>
                        </div>
                    )}
                </QueryState>
            )}

            {activeTab === 'posts' && (
                <QueryState isEmpty={posts.length === 0} emptyTitle={t('channel.noPosts')}>
                    <div className="grid gap-3">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    {hasNextPostsPage && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => fetchNextPostsPage()}
                                disabled={isFetchingNextPostsPage}
                                className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                            >
                                {isFetchingNextPostsPage ? t('common.loading') : t('common.loadMore')}
                            </button>
                        </div>
                    )}
                </QueryState>
            )}

            {activeTab === 'series' && (
                <QueryState isEmpty={series.length === 0} emptyTitle={t('series.emptyOnChannel')}>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                        {series.map((s) => (
                            <Link
                                key={s.id}
                                to={`/series/${s.id}`}
                                className="block bg-surface rounded-lg p-5 border border-border-light shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-2">
                                    <Tv size={14} /> {t('series.badge')}
                                </div>
                                <h3 className="text-base font-semibold mb-2 leading-snug line-clamp-2">{s.title}</h3>
                                {s.description && (
                                    <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 mb-2">{s.description}</p>
                                )}
                                <span className="text-xs text-text-muted">{t('common.videoCount', { count: s.contentCount ?? 0 })}</span>
                            </Link>
                        ))}
                    </div>
                </QueryState>
            )}
        </PageShell>
    );
}

export default ChannelPage;
