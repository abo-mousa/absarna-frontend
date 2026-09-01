import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Bell, Check, Video, BookOpen, FileText, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, Avatar } from '../components/ui';
import { VideoCard, BookCard, ArticleCard, PostCard } from '../components/content';
import { useWatchProgressMap } from '../hooks/useContents';
import { usePageMeta } from '../hooks/usePageMeta';
import { resolveMediaUrl } from '@/lib/media';
import { isChannelOwner } from '@/lib/user';
import {
    useChannel,
    useChannelContents,
    useChannelBooks,
    useChannelArticles,
    useChannelPosts,
    useSubscriptionStatus,
    useToggleSubscription,
} from '../hooks/useChannels';

function ChannelPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const [activeTab, setActiveTab] = useState('videos');
    const watchProgress = useWatchProgressMap(!!token);

    const { data: channel, isLoading: channelLoading } = useChannel(slug);
    const {
        data: videoPages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useChannelContents(slug, 24, !!channel);
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
    const { data: subscriptionStatus } = useSubscriptionStatus(channel?.id, !!token && !!channel);
    const toggleSubscription = useToggleSubscription(channel?.id);

    const subscribed = subscriptionStatus?.subscribed || false;
    const subscriberCount = subscriptionStatus?.subscriberCount || 0;

    usePageMeta({
        title: channel?.name,
        description: channel?.description?.slice(0, 200),
        image: resolveMediaUrl(channel?.bannerUrl || channel?.logoUrl),
    });

    const handleSubscribe = () => {
        if (!token) {
            navigate('/login');
            return;
        }
        toggleSubscription.mutate(subscribed);
    };

    const isOwner = isChannelOwner(user, channel);

    const tabs = [
        { id: 'videos', label: 'فيديوهات', icon: Video, count: videoCount },
        { id: 'books', label: 'كتب', icon: BookOpen, count: bookCount },
        { id: 'articles', label: 'مقالات', icon: FileText, count: articleCount },
        { id: 'posts', label: 'منشورات', icon: MessageSquare, count: postCount },
    ];

    if (channelLoading || !channel) {
        return (
            <PageShell>
                <QueryState
                    isLoading={channelLoading}
                    isEmpty={!channelLoading}
                    emptyTitle="القناة غير موجودة"
                />
            </PageShell>
        );
    }

    return (
        <PageShell currentChannel={slug} contentClassName="p-4 sm:p-6">
            <div className="rounded-lg overflow-hidden mb-5" style={{ background: channel.primaryColor || '#0D6B4D' }}>
                {channel.bannerUrl && (
                    <div className="h-[120px] sm:h-[160px] w-full overflow-hidden">
                        <img
                            src={resolveMediaUrl(channel.bannerUrl)}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="p-5 sm:p-6 text-white flex items-center gap-4 flex-wrap">
                    <Avatar src={resolveMediaUrl(channel.logoUrl)} name={channel.name} size="lg" className="!bg-white/20" />

                    <div className="flex-1 min-w-[150px]">
                        <h1 className="text-white m-0 text-xl sm:text-2xl font-bold">{channel.name}</h1>
                        {token && <p className="opacity-90 text-sm mt-1">{subscriberCount} مشترك</p>}
                        {channel.description && (
                            <p className="opacity-90 text-sm mt-2 max-w-[500px]">{channel.description}</p>
                        )}
                    </div>

                    {isOwner && (
                        <Link
                            to={`/channel/${slug}/manage`}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 text-white rounded-full font-semibold text-sm"
                        >
                            <Settings size={18} /> إدارة القناة
                        </Link>
                    )}

                    <button
                        onClick={handleSubscribe}
                        disabled={toggleSubscription.isPending}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm ${
                            subscribed ? 'bg-white/20 text-white' : 'bg-white text-primary'
                        }`}
                    >
                        {toggleSubscription.isPending ? '...' : subscribed ? <><Check size={18} /> مشترك</> : <><Bell size={18} /> اشترك</>}
                    </button>
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
                <QueryState isEmpty={videos.length === 0} emptyTitle="لا توجد فيديوهات بعد">
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
                                {isFetchingNextPage ? 'جاري التحميل...' : 'تحميل المزيد'}
                            </button>
                        </div>
                    )}
                </QueryState>
            )}

            {activeTab === 'books' && (
                <QueryState isEmpty={books.length === 0} emptyTitle="لا توجد كتب بعد">
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                        {books.map((book) => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </div>

                    {hasNextBooksPage && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => fetchNextBooksPage()}
                                disabled={isFetchingNextBooksPage}
                                className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                            >
                                {isFetchingNextBooksPage ? 'جاري التحميل...' : 'تحميل المزيد'}
                            </button>
                        </div>
                    )}
                </QueryState>
            )}

            {activeTab === 'articles' && (
                <QueryState isEmpty={articles.length === 0} emptyTitle="لا توجد مقالات بعد">
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
                                {isFetchingNextArticlesPage ? 'جاري التحميل...' : 'تحميل المزيد'}
                            </button>
                        </div>
                    )}
                </QueryState>
            )}

            {activeTab === 'posts' && (
                <QueryState isEmpty={posts.length === 0} emptyTitle="لا توجد منشورات بعد">
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
                                {isFetchingNextPostsPage ? 'جاري التحميل...' : 'تحميل المزيد'}
                            </button>
                        </div>
                    )}
                </QueryState>
            )}
        </PageShell>
    );
}

export default ChannelPage;
