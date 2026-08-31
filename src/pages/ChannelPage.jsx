import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Bell, Check, Video, BookOpen, FileText, MessageSquare, Settings } from 'lucide-react';
import api from '@/lib/api/client';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/layout/Navbar';
import SideBar from '../components/layout/SideBar';
import { Spinner, Avatar } from '../components/ui';
import { VideoCard, BookCard, ArticleCard, PostCard } from '../components/content';
import { useWatchProgressMap } from '../hooks/useContents';

function ChannelPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [books, setBooks] = useState([]);
    const [articles, setArticles] = useState([]);
    const [posts, setPosts] = useState([]);
    const [activeTab, setActiveTab] = useState('videos');
    const [loading, setLoading] = useState(true);
    const [subscribed, setSubscribed] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [subscribing, setSubscribing] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const watchProgress = useWatchProgressMap(!!token);

    useEffect(() => {
        fetchChannelData();
    }, [slug]);

    useEffect(() => {
        if (token && channel) checkSubscriptionStatus();
    }, [token, channel]);

    const fetchChannelData = async () => {
        try {
            setLoading(true);
            const channelRes = await api.get(`/channels/${slug}`);
            setChannel(channelRes.data);

            const [videosRes, booksRes, articlesRes, postsRes] = await Promise.all([
                api.get(`/channels/${slug}/contents?page=0&size=50`),
                api.get(`/channels/${slug}/books`),
                api.get(`/channels/${slug}/articles`),
                api.get(`/channels/${slug}/posts`),
            ]);

            setVideos(videosRes.data?.content || []);
            setBooks(booksRes.data?.content || booksRes.data || []);
            setArticles(articlesRes.data?.content || articlesRes.data || []);
            setPosts(postsRes.data?.content || postsRes.data || []);
        } catch (err) {
            console.error('Failed to fetch channel:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkSubscriptionStatus = async () => {
        if (!channel) return;
        try {
            const res = await api.get(`/channels/${channel.id}/subscription-status`);
            setSubscribed(res.data.subscribed);
            setSubscriberCount(res.data.subscriberCount);
        } catch (err) {
            console.error('Failed to check subscription:', err);
        }
    };

    const handleSubscribe = async () => {
        if (!token) {
            navigate('/login');
            return;
        }

        setSubscribing(true);
        try {
            if (subscribed) {
                await api.delete(`/channels/${channel.id}/subscribe`);
                setSubscribed(false);
                setSubscriberCount((prev) => Math.max(0, prev - 1));
            } else {
                await api.post(`/channels/${channel.id}/subscribe`);
                setSubscribed(true);
                setSubscriberCount((prev) => prev + 1);
            }
        } catch (err) {
            console.error('Subscription failed:', err);
        } finally {
            setSubscribing(false);
        }
    };

    const isOwner = user && channel && channel.ownerUserId === user.id;

    const tabs = [
        { id: 'videos', label: 'فيديوهات', icon: Video, count: videos.length },
        { id: 'books', label: 'كتب', icon: BookOpen, count: books.length },
        { id: 'articles', label: 'مقالات', icon: FileText, count: articles.length },
        { id: 'posts', label: 'منشورات', icon: MessageSquare, count: posts.length },
    ];

    if (loading) {
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
                            disabled={subscribing}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm ${
                                subscribed ? 'bg-white/20 text-white' : 'bg-white text-primary'
                            }`}
                        >
                            {subscribing ? '...' : subscribed ? <><Check size={18} /> مشترك</> : <><Bell size={18} /> اشترك</>}
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
