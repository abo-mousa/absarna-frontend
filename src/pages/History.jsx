import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, Video, BookOpen } from 'lucide-react';
import api from '@/lib/api/client';
import PageShell from '../components/layout/PageShell';
import { Spinner, EmptyState } from '../components/ui';
import { VideoCard, BookCard } from '../components/content';
import { useWatchHistory, useReadingHistory } from '../hooks/useContents';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';

function History() {
    usePageMeta({ title: 'السجل' });
    const { showToast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('videos');

    const watchHistory = useWatchHistory();
    const readingHistory = useReadingHistory();

    const isVideos = activeTab === 'videos';
    const { data: history = [], isLoading, isError } = isVideos ? watchHistory : readingHistory;

    const tabs = [
        { id: 'videos', label: 'فيديوهات', icon: Video },
        { id: 'books', label: 'كتب', icon: BookOpen },
    ];

    const handleClear = async () => {
        const confirmMessage = isVideos
            ? 'هل تريد مسح سجل المشاهدة بالكامل؟'
            : 'هل تريد مسح سجل القراءة بالكامل؟';
        if (!window.confirm(confirmMessage)) return;
        try {
            await api.delete(isVideos ? '/user/history' : '/user/reading-history');
            queryClient.invalidateQueries({ queryKey: [isVideos ? 'watch-history' : 'reading-history'] });
        } catch (err) {
            showToast('فشل في مسح السجل', 'error');
        }
    };

    return (
        <PageShell contentClassName="p-4 sm:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <h1 className="text-xl font-bold">السجل</h1>
                {history.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1.5 px-4 py-2 bg-surface-hover text-text-secondary border border-border rounded-md font-semibold text-sm"
                    >
                        <Trash2 size={14} />
                        مسح السجل
                    </button>
                )}
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
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
                    </button>
                ))}
            </div>

            {isLoading ? (
                <Spinner />
            ) : isError ? (
                <p className="text-red-600 p-3 bg-red-100 rounded-md">فشل في تحميل السجل</p>
            ) : history.length === 0 ? (
                <EmptyState
                    icon="🕘"
                    title={isVideos ? 'لا يوجد سجل مشاهدة' : 'لا يوجد سجل قراءة'}
                    description={isVideos ? 'الفيديوهات التي تشاهدها ستظهر هنا' : 'الكتب التي تقرأها ستظهر هنا'}
                />
            ) : (
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {isVideos
                        ? history.map((entry) => (
                              <VideoCard
                                  key={entry.id}
                                  video={entry.content}
                                  onClick={() => navigate(`/video/${entry.contentId}`)}
                                  watchedSeconds={entry.progressSeconds}
                              />
                          ))
                        : history.map((entry) => (
                              <BookCard key={entry.id} book={entry.book} currentPage={entry.currentPage} />
                          ))}
                </div>
            )}
        </PageShell>
    );
}

export default History;
