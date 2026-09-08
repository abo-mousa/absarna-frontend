import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState } from '../components/ui';
import { VideoCard } from '../components/content';
import { useInfiniteSearch, useWatchProgressMap } from '../hooks/useVideos';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';

function SearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q') || '';
    const { token } = useAuth();
    const watchProgress = useWatchProgressMap(!!token);
    usePageMeta({ title: query ? t('search.titleFor', { query }) : t('search.title') });

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteSearch(query, 12);

    const results = data?.pages.flatMap((page) => page.content) || [];
    const totalItems = data?.pages[0]?.totalItems || 0;

    return (
        <PageShell contentClassName="p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-xl font-bold mb-1">{t('search.heading', { query })}</h1>
                {!isLoading && <p className="text-text-muted text-sm">{t('search.resultCount', { count: totalItems })}</p>}
            </div>

            <QueryState
                isLoading={isLoading}
                isError={isError}
                isEmpty={results.length === 0}
                errorTitle={t('search.failed')}
                emptyIcon="🔍"
                emptyTitle={t('common.noResults')}
                emptyDescription={t('search.emptyDescription', { query })}
            >
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {results.map((video) => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            onClick={() => navigate(`/video/${video.id}`)}
                            watchedSeconds={watchProgress[video.id]}
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
        </PageShell>
    );
}

export default SearchPage;
