import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import PageShell from '../components/layout/PageShell';
import { Spinner, EmptyState, Modal } from '../components/ui';
import { VideoCard } from '../components/content';
import { useInfiniteContents, useCategories, useFeed, useWatchProgressMap } from '../hooks/useContents';
import { useMyChannels } from '../hooks/useChannels';

function Home() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { token } = useAuth();
    const { showToast } = useToast();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [deletingVideo, setDeletingVideo] = useState(null);
    const { data: myChannels = [] } = useMyChannels(!!token);

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

    // Also invalidates that channel's own cached lists (public channel page + owner's manage
    // view) since a video mutated here belongs to a specific channel, not just the home feed.
    const refreshFeed = (slug) => {
        queryClient.invalidateQueries({ queryKey: ['contents'] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        if (slug) {
            queryClient.invalidateQueries({ queryKey: ['channel-contents', slug] });
            queryClient.invalidateQueries({ queryKey: ['channel-manage', slug, 'videos'] });
        }
    };

    const handleToggleVisibility = async (video) => {
        const slug = mySlugByChannelId[video.channelId];
        if (!slug) return;
        try {
            await api.patch(`/channels/${slug}/content/videos/${video.id}/visibility`, {
                visible: video.visible === false,
            });
            refreshFeed(slug);
        } catch (err) {
            showToast('فشل في تحديث الظهور', 'error');
        }
    };

    const confirmDelete = async () => {
        const video = deletingVideo;
        setDeletingVideo(null);
        const slug = mySlugByChannelId[video.channelId];
        if (!slug) return;
        try {
            await api.delete(`/channels/${slug}/content/videos/${video.id}`);
            refreshFeed(slug);
        } catch (err) {
            showToast('فشل في الحذف', 'error');
        }
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

            <Modal open={!!deletingVideo} onClose={() => setDeletingVideo(null)} title="حذف الفيديو" maxWidth="400px">
                <p className="text-text-secondary mb-5">
                    هل تريد حذف "{deletingVideo?.title}"؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
                <div className="flex gap-2 justify-end">
                    <button onClick={() => setDeletingVideo(null)} className="px-4 py-2 text-text-secondary font-semibold">
                        إلغاء
                    </button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold">
                        حذف
                    </button>
                </div>
            </Modal>
        </PageShell>
    );
}

export default Home;
