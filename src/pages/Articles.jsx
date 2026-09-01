import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Type, Clock, Calendar } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { QueryState, Input } from '../components/ui';
import { useArticles } from '../hooks/useArticles';
import { usePageMeta } from '../hooks/usePageMeta';

const PAGE_SIZE = 15;

const SORTS = [
    { id: 'newest', label: 'الأحدث' },
    { id: 'title', label: 'العنوان' },
];

function Articles() {
    usePageMeta({ title: 'المقالات', description: 'مقالات إسلامية على منارة' });
    const { data: articles = [], isLoading } = useArticles();

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

    const visible = filtered.slice(0, visibleCount);

    return (
        <PageShell sidebar={false} contentClassName="max-w-reading mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold mb-6">المقالات</h1>

            {!isLoading && articles.length > 0 && (
                <div className="flex gap-3 flex-wrap mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder="ابحث عن مقال..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
                        />
                    </div>

                    {categories.length > 0 && (
                        <select
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); setVisibleCount(PAGE_SIZE); }}
                            className="px-3.5 py-2.5 rounded-md border border-border bg-surface text-sm"
                        >
                            <option value="">كل التصنيفات</option>
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3.5 py-2.5 rounded-md border border-border bg-surface text-sm"
                    >
                        {SORTS.map((s) => <option key={s.id} value={s.id}>ترتيب حسب: {s.label}</option>)}
                    </select>
                </div>
            )}

            <QueryState
                isLoading={isLoading}
                isEmpty={articles.length === 0 || filtered.length === 0}
                emptyIcon={articles.length === 0 ? '📝' : '🔍'}
                emptyTitle={articles.length === 0 ? 'لا توجد مقالات' : 'لا توجد نتائج'}
                emptyDescription={articles.length === 0 ? undefined : 'جرّب كلمة بحث أو تصنيفاً آخر'}
            >
                <div className="grid gap-4">
                    {visible.map((article) => (
                        <Link
                            key={article.id}
                            to={`/articles/${article.id}`}
                            className="block bg-surface p-5 rounded-lg border border-border-light shadow-sm hover:shadow-md transition-shadow text-text-primary no-underline"
                        >
                            <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                            <div className="flex gap-4 flex-wrap text-sm text-text-muted">
                                {article.wordCount > 0 && (
                                    <span className="flex items-center gap-1"><Type size={13} /> {article.wordCount} كلمة</span>
                                )}
                                {article.readingTimeMinutes > 0 && (
                                    <span className="flex items-center gap-1"><Clock size={13} /> {article.readingTimeMinutes} دقائق</span>
                                )}
                                {article.publishDate && (
                                    <span className="flex items-center gap-1"><Calendar size={13} /> {article.publishDate}</span>
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

                {visibleCount < filtered.length && (
                    <div className="text-center mt-6">
                        <button
                            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                            className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold"
                        >
                            تحميل المزيد
                        </button>
                    </div>
                )}
            </QueryState>
        </PageShell>
    );
}

export default Articles;
