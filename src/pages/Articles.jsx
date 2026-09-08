import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Type, Clock, Calendar } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { QueryState, Input } from '../components/ui';
import { useArticles } from '../hooks/useArticles';
import { usePageMeta } from '../hooks/usePageMeta';
import { formatPublishDate, displayDate } from '@/lib/dayjsAr';
import { t } from '@/i18n';

const PAGE_SIZE = 15;

const SORTS = [
    { id: 'newest', label: t('common.sortNewest') },
    { id: 'title', label: t('common.sortTitle') },
];

function Articles() {
    usePageMeta({ title: t('articles.title'), description: t('articles.metaDescription') });
    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useArticles(PAGE_SIZE);
    const articles = useMemo(() => data?.pages.flatMap((page) => page.content) || [], [data]);

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const categories = useMemo(
        () => [...new Set(articles.map((a) => a.category).filter(Boolean))],
        [articles]
    );

    const filtered = useMemo(() => {
        let result = articles;
        if (category) result = result.filter((a) => a.category === category);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter((a) => a.title?.toLowerCase().includes(q));
        }
        result = [...result].sort((a, b) => {
            if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '', 'ar');
            return (b.publishDate || '').localeCompare(a.publishDate || '');
        });
        return result;
    }, [articles, category, search, sortBy]);

    return (
        <PageShell sidebar={false} contentClassName="max-w-reading mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold mb-6">{t('articles.title')}</h1>

            {!isLoading && articles.length > 0 && (
                <div className="flex gap-3 flex-wrap mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder={t('articles.searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {categories.length > 0 && (
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="px-3.5 py-2.5 rounded-md border border-border bg-surface text-sm"
                        >
                            <option value="">{t('common.allCategories')}</option>
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3.5 py-2.5 rounded-md border border-border bg-surface text-sm"
                    >
                        {SORTS.map((s) => <option key={s.id} value={s.id}>{t('common.sortBy', { label: s.label })}</option>)}
                    </select>
                </div>
            )}

            {/* Same gap Books had: no isError, so a failed request read as "no articles". */}
            <QueryState
                isLoading={isLoading}
                isError={isError}
                error={error}
                onRetry={refetch}
                errorTitle={t('articles.loadFailed')}
                isEmpty={articles.length === 0 || filtered.length === 0}
                emptyIcon={articles.length === 0 ? '📝' : '🔍'}
                emptyTitle={articles.length === 0 ? t('articles.empty') : t('common.noResults')}
                emptyDescription={articles.length === 0 ? undefined : t('common.tryAnotherSearch')}
            >
                <div className="grid gap-4">
                    {filtered.map((article) => (
                        <Link
                            key={article.id}
                            to={`/articles/${article.id}`}
                            className="block bg-surface p-5 rounded-lg border border-border-light shadow-sm hover:shadow-md transition-shadow text-text-primary no-underline"
                        >
                            <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                            <div className="flex gap-4 flex-wrap text-sm text-text-muted">
                                {article.wordCount > 0 && (
                                    <span className="flex items-center gap-1"><Type size={13} /> {t('common.wordCount', { count: article.wordCount })}</span>
                                )}
                                {article.readingTimeMinutes > 0 && (
                                    <span className="flex items-center gap-1"><Clock size={13} /> {t('common.readingMinutes', { count: article.readingTimeMinutes })}</span>
                                )}
                                {article.publishDate && (
                                    <span className="flex items-center gap-1"><Calendar size={13} /> {formatPublishDate(displayDate(article))}</span>
                                )}
                            </div>
                            {article.content && (
                                <p className="mt-2 text-text-secondary text-sm leading-relaxed">
                                    {article.content.substring(0, 150)}...
                                </p>
                            )}
                        </Link>
                    ))}
                </div>

                {hasNextPage && (
                    <div className="text-center mt-6">
                        <button
                            onClick={() => fetchNextPage()}
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

export default Articles;
