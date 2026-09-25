import { useMemo, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { ArticleCard } from '../components/content';
import { QueryState, Input } from '../components/ui';
import { useArticles, useArticleCategories } from '../hooks/useArticles';
import { usePageMeta } from '../hooks/usePageMeta';
import { formatPublishDate, displayDate } from '@/lib/datetime';
import { t } from '@/i18n';

const PAGE_SIZE = 15;

// The backend's names (`ListingSort`); the order itself is the server's, never this page's.
const SORTS = [
    { id: 'NEWEST', label: t('common.sortNewest') },
    { id: 'TITLE', label: t('common.sortTitle') },
];

function Articles() {
    usePageMeta({ title: t('articles.title'), description: t('articles.metaDescription') });
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [sortBy, setSortBy] = useState('NEWEST');
    // Debounced so typing is one request per pause, not one per keystroke.
    const searchTerm = useDebouncedValue(search.trim(), 300);
    const filtering = !!(searchTerm || category);
    const {
        data,
        isLoading,
        isPlaceholderData,
        isError,
        error,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useArticles(PAGE_SIZE, { sort: sortBy, category, search: searchTerm });
    const { data: categories = [] } = useArticleCategories();
    const articles = useMemo(() => data?.pages.flatMap((page) => page.content) || [], [data]);



    return (
        <PageShell sidebar={false} contentClassName="max-w-reading mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold mb-6">{t('articles.title')}</h1>

            {/* Shown whenever there is anything to narrow OR a narrowing is active: a search
                that matches nothing must still leave the box on screen to change it. */}
            {/* isPlaceholderData too: while a new sort or a cleared search loads, the rows on
                screen are the previous query's, possibly an empty "no match" — and unmounting the
                bar then took the search box away from under the reader's cursor. */}
            {!isLoading && (articles.length > 0 || filtering || isPlaceholderData) && (
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
                // Not while the previous query's rows stand in for the new one: an empty "no match"
                // placeholder would flash the wrong empty message.
                isEmpty={articles.length === 0 && !isPlaceholderData}
                emptyIcon={!filtering ? '📝' : '🔍'}
                emptyTitle={!filtering ? t('articles.empty') : t('common.noResults')}
                emptyDescription={!filtering ? undefined : t('common.tryAnotherSearch')}
            >
                {/* A MAGAZINE PAGE, not a list of boxes. Unnarrowed, the newest article leads —
                    headline in Markazi, its opening in Naskh, the faces the article page itself
                    uses — and the rest follow as text in three columns. A search or a category is
                    a hunt for one article, so it gets the plain grid with no lead. */}
                {!filtering && articles[0] && <LeadArticle article={articles[0]} />}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-6">
                    {(filtering ? articles : articles.slice(1)).map((article) => (
                        <ArticleCard key={article.id} article={article} />
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

/** The newest article, set large: the one piece the page chooses to put first. */
function LeadArticle({ article }) {
    return (
        <Link
            to={`/articles/${article.id}`}
            className="group block pb-8 mb-8 border-b border-border text-text-primary no-underline hover:no-underline"
        >
            {article.category && (
                <span dir="auto" className="block text-xs font-bold text-gold-ink mb-2">{article.category}</span>
            )}
            <h2 dir="auto" className="font-serif text-[2.6rem] font-semibold leading-[1.05] mb-3 group-hover:text-primary transition-colors">
                {article.title}
            </h2>
            {article.content && (
                <p dir="auto" className="font-reading text-lg leading-loose text-text-secondary max-w-reading line-clamp-3">
                    {article.content.substring(0, 320)}…
                </p>
            )}
            <div className="flex gap-4 flex-wrap text-sm text-text-muted mt-3">
                {article.readingTimeMinutes > 0 && (
                    <span className="flex items-center gap-1"><Clock size={13} /> {t('common.readingMinutes', { count: article.readingTimeMinutes })}</span>
                )}
                {displayDate(article) && <span>{formatPublishDate(displayDate(article))}</span>}
            </div>
        </Link>
    );
}

export default Articles;
