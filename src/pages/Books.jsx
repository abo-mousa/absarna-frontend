import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, Input } from '../components/ui';
import { BookCard } from '../components/content';
import { useReadingProgressMap } from '../hooks/useVideos';
import { useBooks } from '../hooks/useBooks';
import { usePageMeta } from '../hooks/usePageMeta';

const PAGE_SIZE = 12;

const SORTS = [
    { id: 'newest', label: 'الأحدث' },
    { id: 'title', label: 'العنوان' },
];

function Books() {
    usePageMeta({ title: 'المكتبة', description: 'مكتبة الكتب الإسلامية على أَبْصَرْنا' });
    const { token } = useAuth();
    const readingProgress = useReadingProgressMap(!!token);
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useBooks(PAGE_SIZE);
    const books = useMemo(() => data?.pages.flatMap((page) => page.content) || [], [data]);

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const categories = useMemo(
        () => [...new Set(books.map((b) => b.category).filter(Boolean))],
        [books]
    );

    const filtered = useMemo(() => {
        let result = books;
        if (category) result = result.filter((b) => b.category === category);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter((b) => b.title?.toLowerCase().includes(q));
        }
        result = [...result].sort((a, b) => {
            if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '', 'ar');
            return (b.publishDate || '').localeCompare(a.publishDate || '');
        });
        return result;
    }, [books, category, search, sortBy]);

    return (
        <PageShell sidebar={false} contentClassName="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold mb-6">المكتبة</h1>

            {!isLoading && books.length > 0 && (
                <div className="flex gap-3 flex-wrap mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder="ابحث عن كتاب..."
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
                isEmpty={books.length === 0 || filtered.length === 0}
                emptyIcon={books.length === 0 ? '📚' : '🔍'}
                emptyTitle={books.length === 0 ? 'لا توجد كتب' : 'لا توجد نتائج'}
                emptyDescription={books.length === 0 ? 'سيتم إضافة الكتب قريباً' : 'جرّب كلمة بحث أو تصنيفاً آخر'}
            >
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-5">
                    {filtered.map((book) => (
                        <BookCard key={book.id} book={book} currentPage={readingProgress[book.id]} />
                    ))}
                </div>

                {hasNextPage && (
                    <div className="text-center mt-6">
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                        >
                            {isFetchingNextPage ? 'جاري التحميل...' : 'تحميل المزيد'}
                        </button>
                    </div>
                )}
            </QueryState>
        </PageShell>
    );
}

export default Books;
