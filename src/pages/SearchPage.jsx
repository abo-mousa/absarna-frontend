import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api/client';
import PageShell from '../components/layout/PageShell';
import { Spinner, EmptyState } from '../components/ui';
import { VideoCard } from '../components/content';

function SearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q') || '';

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (query) {
            fetchResults(0, false);
        }
    }, [query]);

    const fetchResults = async (pageNum, append) => {
        try {
            if (append) setLoadingMore(true);
            else setLoading(true);

            const res = await api.get(`/search?q=${encodeURIComponent(query)}&page=${pageNum}&size=12`);

            if (append) setResults((prev) => [...prev, ...res.data.content]);
            else setResults(res.data.content || []);

            setPage(res.data.currentPage || 0);
            setHasNext(res.data.hasNext || false);
            setTotalItems(res.data.totalItems || 0);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => fetchResults(page + 1, true);

    return (
        <PageShell contentClassName="p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-xl font-bold mb-1">نتائج البحث عن: "{query}"</h1>
                {!loading && <p className="text-text-muted text-sm">{totalItems} نتيجة</p>}
            </div>

            {loading ? (
                <Spinner />
            ) : results.length === 0 ? (
                <EmptyState icon="🔍" title="لا توجد نتائج" description={`لم يتم العثور على نتائج لـ "${query}"`} />
            ) : (
                <>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {results.map((video) => (
                            <VideoCard key={video.id} video={video} onClick={() => navigate(`/video/${video.id}`)} />
                        ))}
                    </div>

                    {hasNext && (
                        <div className="text-center mt-6">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                            >
                                {loadingMore ? 'جاري التحميل...' : 'تحميل المزيد'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </PageShell>
    );
}

export default SearchPage;
