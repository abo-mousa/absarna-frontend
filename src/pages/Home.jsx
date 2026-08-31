import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { Spinner, EmptyState } from '../components/ui';
import { VideoCard } from '../components/content';
import { useInfiniteContents, useCategories, useFeed, useWatchProgressMap } from '../hooks/useContents';

function Home() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { token } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [myChannels, setMyChannels] = useState([]);

    useEffect(() => {
        if (!token) {
            setMyChannels([]);
            return;
        }
        api.get('/channels/my-channels')
            .then((res) => setMyChannels(res.data || []))
            .catch((err) => console.error('Failed to fetch my channels:', err));
    }, [token]);

    const mySlugByChannelId = useMemo(
        () => Object.fromEntries(myChannels.map((c) => [c.id, c.slug])),
        [myChannels]
    );

    const watchProgress = useWatchProgressMap(!!token);

    const isDefaultView = selectedCategory === '';

    const { data: categories = [] } = useCategories();

    const feedQuery = useFeed(isDefaultView);
    const {
        data: infiniteData,
        isLoading: infiniteLoading,
        isFetching: infiniteFetching,
        isError: infiniteError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteContents('', selectedCategory, 12, !isDefaultView);

    const refreshFeed = () => {
        queryClient.invalidateQueries({ queryKey: ['contents'] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });
    };

    const handleToggleVisibility = async (video) => {
        const slug = mySlugByChannelId[video.channelId];
        if (!slug) return;
        try {
            await api.patch(`/channels/${slug}/content/videos/${video.id}/visibility`, {
                visible: video.visible === false,
            });
            refreshFeed();
        } catch (err) {
            alert('فشل في تحديث الظهور');
        }
    };

    const handleDelete = async (video) => {
        const slug = mySlugByChannelId[video.channelId];
        if (!slug) return;
        if (!window.confirm(`هل تريد حذف "${video.title}"؟`)) return;
        try {
            await api.delete(`/channels/${slug}/content/videos/${video.id}`);
            refreshFeed();
        } catch (err) {
            alert('فشل في الحذف');
        }
    };

    const videoCardProps = (video) => ({
        key: video.id,
        video,
        onClick: () => navigate(`/video/${video.id}`),
        isOwner: !!mySlugByChannelId[video.channelId],
        onToggleVisibility: handleToggleVisibility,
        onDelete: handleDelete,
        watchedSeconds: watchProgress[video.id],
    });

    const feedSections = [
        { key: 'subscribed', title: 'من القنوات التي تتابعها' },
        { key: 'discover', title: 'اقتراحات لك' },
        { key: 'featured', title: 'استكشف' },
    ];

    return (
        <PageShell contentClassName="p-4 sm:p-6">
            <div className="flex gap-2 flex-wrap mb-5">
                <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                        selectedCategory === ''
                            ? 'bg-primary text-white border-2 border-primary'
                            : 'bg-surface text-text-secondary border border-border'
                    }`}
                >
                    الكل
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                            selectedCategory === cat
                                ? 'bg-primary text-white border-2 border-primary'
                                : 'bg-surface text-text-secondary border border-border'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {isDefaultView ? (
                feedQuery.isLoading ? (
                    <Spinner />
                ) : feedQuery.isError ? (
                    <EmptyState icon="⚠️" title="فشل في تحميل المحتوى" />
                ) : feedSections.every((section) => !(feedQuery.data?.[section.key]?.length)) ? (
                    <EmptyState icon="📭" title="لا يوجد محتوى بعد" description="سيتم إضافة المحتوى قريباً" />
                ) : (
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
                )
            ) : (
                <div className={`content-transition ${infiniteFetching && !isFetchingNextPage ? 'fading' : ''}`}>
                    {infiniteLoading ? (
                        <Spinner />
                    ) : infiniteError ? (
                        <EmptyState icon="⚠️" title="فشل في تحميل المحتوى" />
                    ) : (infiniteData?.pages.flatMap((page) => page.content) || []).length === 0 ? (
                        <EmptyState icon="📭" title="لا يوجد محتوى بعد" description="سيتم إضافة المحتوى قريباً" />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {infiniteData.pages.flatMap((page) => page.content).map((video) => (
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
                                        {isFetchingNextPage ? 'جاري التحميل...' : 'تحميل المزيد'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </PageShell>
    );
}

export default Home;
