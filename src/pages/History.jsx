import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, Video, BookOpen, History as HistoryIcon, ListVideo } from 'lucide-react';
import api from '@/lib/api/client';
import PageShell, { LIST_COLUMN } from '../components/layout/PageShell';
import { QueryState } from '../components/ui';
import { VideoCard, BookCard } from '../components/content';
import { useGroupedWatchHistory, useReadingHistory } from '../hooks/useVideos';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';
import { formatCount } from '@/lib/numbers';
import { describeError } from '@/lib/describeError';

function History() {
    usePageMeta({ title: t('history.title') });
    const { showToast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('videos');

    const watchHistory = useGroupedWatchHistory();
    const readingHistory = useReadingHistory();

    const isVideos = activeTab === 'videos';
    const { data: history = [], isLoading, isError, error, refetch } = isVideos ? watchHistory : readingHistory;

    const tabs = [
        { id: 'videos', label: t('common.videos'), icon: Video },
        { id: 'books', label: t('common.books'), icon: BookOpen },
    ];

    const handleClear = async () => {
        const confirmMessage = isVideos
            ? t('history.clearWatchConfirm')
            : t('history.clearReadConfirm');
        if (!window.confirm(confirmMessage)) return;
        try {
            await api.delete(isVideos ? '/user/history' : '/user/reading-history');
            queryClient.invalidateQueries({ queryKey: [isVideos ? 'watch-history' : 'reading-history'] });
            queryClient.invalidateQueries({ queryKey: ['today'] });
        } catch (err) {
            showToast(describeError(err, t('history.clearFailed')), 'error');
        }
    };

    return (
        <PageShell contentClassName={LIST_COLUMN}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <h1 className="text-xl font-bold">{t('history.title')}</h1>
                {history.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1.5 px-4 py-2 bg-surface-hover text-text-secondary border border-border rounded-md font-semibold text-sm"
                    >
                        <Trash2 size={14} />
                        {t('history.clear')}
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

            <QueryState
                isLoading={isLoading}
                isError={isError}
                error={error}
                onRetry={refetch}
                isEmpty={history.length === 0}
                errorTitle={t('history.loadFailed')}
                emptyIcon={HistoryIcon}
                emptyTitle={isVideos ? t('history.emptyWatch') : t('history.emptyRead')}
                emptyDescription={isVideos ? t('history.emptyWatchDescription') : t('history.emptyReadDescription')}
            >
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 gap-x-5 gap-y-8">
                    {isVideos
                        ? history.map((entry) => (
                              // One entry per series, as the backend grouped it: the card is the
                              // episode watched last (it resumes that one), and the line under it
                              // opens the series, where every episode shows its own watched bar.
                              // `episodesWatched` is null outside a series. Keyed by videoId: a
                              // watch row has no id of its own.
                              <div key={entry.videoId} className="min-w-0">
                                  <VideoCard
                                      video={entry.video}
                                      onClick={() => navigate(`/video/${entry.videoId}`)}
                                      watch={{ progress: entry.progress, finished: entry.finished }}
                                  />
                                  {entry.episodesWatched != null && entry.video?.seriesId && (
                                      <button
                                          onClick={() => navigate(`/series/${entry.video.seriesId}`)}
                                          className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-gold-ink hover:underline"
                                      >
                                          <ListVideo size={14} className="flex-shrink-0" />
                                          {t('history.episodesWatched', { count: formatCount(entry.episodesWatched) })}
                                      </button>
                                  )}
                              </div>
                          ))
                        : history.map((entry) => (
                              <BookCard key={entry.id} book={entry.book} progress={entry.progress} />
                          ))}
                </div>
            </QueryState>
        </PageShell>
    );
}

export default History;
