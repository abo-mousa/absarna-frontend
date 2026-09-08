import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Video, BookOpen, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState } from '../components/ui';
import { VideoCard, BookCard, ArticleCard } from '../components/content';
import { useBookmarks, useClearBookmarks } from '../hooks/useBookmarks';
import { useWatchProgressMap, useReadingProgressMap } from '../hooks/useVideos';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';

const TABS = [
    { id: 'VIDEO', label: t('common.videos'), icon: Video },
    { id: 'BOOK', label: t('common.books'), icon: BookOpen },
    { id: 'ARTICLE', label: t('common.articles'), icon: FileText },
];

function Bookmarks() {
    usePageMeta({ title: t('bookmarks.title') });
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('VIDEO');

    const { data: bookmarks = [], isLoading, isError, error, refetch } = useBookmarks();
    const watchProgress = useWatchProgressMap(!!token);
    const readingProgress = useReadingProgressMap(!!token);
    const clearBookmarks = useClearBookmarks();

    const itemsForTab = bookmarks.filter((b) => b.itemType === activeTab);

    const handleClear = () => {
        if (!window.confirm(t('bookmarks.clearConfirm'))) return;
        clearBookmarks.mutate(undefined, {
            onError: () => showToast(t('bookmarks.clearFailed'), 'error'),
        });
    };

    return (
        <PageShell contentClassName="p-4 sm:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <h1 className="text-xl font-bold">{t('bookmarks.title')}</h1>
                {bookmarks.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1.5 px-4 py-2 bg-surface-hover text-text-secondary border border-border rounded-md font-semibold text-sm"
                    >
                        <Trash2 size={14} />
                        {t('bookmarks.clearAll')}
                    </button>
                )}
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
                {TABS.map((tab) => (
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
                        {' '}({bookmarks.filter((b) => b.itemType === tab.id).length})
                    </button>
                ))}
            </div>

            <QueryState
                isLoading={isLoading}
                isError={isError}
                error={error}
                onRetry={refetch}
                isEmpty={itemsForTab.length === 0}
                errorTitle={t('bookmarks.loadFailed')}
                emptyIcon="🔖"
                emptyTitle={t('bookmarks.empty')}
                emptyDescription={t('bookmarks.emptyDescription')}
            >
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {activeTab === 'VIDEO' &&
                        itemsForTab
                            .filter((b) => b.content)
                            .map((b) => (
                                <VideoCard
                                    key={b.id}
                                    video={b.content}
                                    onClick={() => navigate(`/video/${b.content.id}`)}
                                    watchedSeconds={watchProgress[b.content.id]}
                                />
                            ))}
                    {activeTab === 'BOOK' &&
                        itemsForTab
                            .filter((b) => b.book)
                            .map((b) => <BookCard key={b.id} book={b.book} currentPage={readingProgress[b.book.id]} />)}
                    {activeTab === 'ARTICLE' &&
                        itemsForTab.filter((b) => b.article).map((b) => <ArticleCard key={b.id} article={b.article} />)}
                </div>
            </QueryState>
        </PageShell>
    );
}

export default Bookmarks;
