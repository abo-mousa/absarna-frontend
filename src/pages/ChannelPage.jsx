import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Bell, Check, Video, BookOpen, FileText, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/layout/Navbar';
import SideBar from '../components/layout/SideBar';
import { Spinner, Avatar } from '../components/ui';
import { VideoCard, BookCard, ArticleCard, PostCard } from '../components/content';
import { useWatchProgressMap } from '../hooks/useContents';
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
    const [drawerOpen, setDrawerOpen] = useState(false);
    const watchProgress = useWatchProgressMap(!!token);

    const { data: channel, isLoading: channelLoading } = useChannel(slug);
    const { data: videos = [] } = useChannelContents(slug, !!channel);
    const { data: books = [] } = useChannelBooks(slug, !!channel);
    const { data: articles = [] } = useChannelArticles(slug, !!channel);
    const { data: posts = [] } = useChannelPosts(slug, !!channel);
    const { data: subscriptionStatus } = useSubscriptionStatus(channel?.id, !!token && !!channel);
    const toggleSubscription = useToggleSubscription(channel?.id);

    const subscribed = subscriptionStatus?.subscribed || false;
    const subscriberCount = subscriptionStatus?.subscriberCount || 0;

    const handleSubscribe = () => {
        if (!token) {
            navigate('/login');
            return;
        }
        toggleSubscription.mutate(subscribed);
    };

    const isOwner = user && channel && channel.ownerUserId === user.id;

    const tabs = [
        { id: 'videos', label: 'فيديوهات', icon: Video, count: videos.length },
        { id: 'books', label: 'كتب', icon: BookOpen, count: books.length },
        { id: 'articles', label: 'مقالات', icon: FileText, count: articles.length },
        { id: 'posts', label: 'منشورات', icon: MessageSquare, count: posts.length },
    ];

    if (channelLoading) {
        return (
            <div dir="rtl" className="min-h-screen bg-bg">
                <Navbar />
                <Spinner />
            </div>
        );
    }

    if (!channel) {
        return (
            <div dir="rtl" className="min-h-screen bg-bg">
                <Navbar />
                <p className="text-center py-16">القناة غير موجودة</p>
            </div>
        );
    }

    return (
        <div dir="rtl" className="min-h-screen bg-bg">
            <Navbar onMenuClick={() => setDrawerOpen(true)} />
            <div className="flex">
                <SideBar currentChannel={slug} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
                <main className="flex-1 min-w-0 p-4 sm:p-6">
                    <div
                        className="rounded-lg p-5 sm:p-6 text-white mb-5 flex items-center gap-4 flex-wrap"
                        style={{ background: channel.primaryColor || '#0D6B4D' }}
                    >
                        <Avatar name={channel.name} size="lg" className="!bg-white/20" />

                        <div className="flex-1 min-w-[150px]">
                            <h1 className="text-white m-0 text-xl sm:text-2xl font-bold">{channel.name}</h1>
                            <p className="opacity-90 text-sm mt-1">{subscriberCount} مشترك</p>
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
                        videos.length === 0 ? (
                            <p className="text-center text-text-muted py-10">لا توجد فيديوهات بعد</p>
                        ) : (
                            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                                {videos.map((video) => (
                                    <VideoCard
                                        key={video.id}
                                        video={video}
                                        onClick={() => navigate(`/video/${video.id}`)}
                                        watchedSeconds={watchProgress[video.id]}
                                    />
                                ))}
                            </div>
                        )
                    )}

                    {activeTab === 'books' && (
                        books.length === 0 ? (
                            <p className="text-center text-text-muted py-10">لا توجد كتب بعد</p>
                        ) : (
                            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                                {books.map((book) => (
                                    <BookCard key={book.id} book={book} />
                                ))}
                            </div>
                        )
                    )}

                    {activeTab === 'articles' && (
                        articles.length === 0 ? (
                            <p className="text-center text-text-muted py-10">لا توجد مقالات بعد</p>
                        ) : (
                            <div className="grid gap-3">
                                {articles.map((article) => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>
                        )
                    )}

                    {activeTab === 'posts' && (
                        posts.length === 0 ? (
                            <p className="text-center text-text-muted py-10">لا توجد منشورات بعد</p>
                        ) : (
                            <div className="grid gap-3">
                                {posts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        )
                    )}
                </main>
            </div>
        </div>
    );
}

export default ChannelPage;
