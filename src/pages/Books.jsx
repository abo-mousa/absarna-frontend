import { useMemo, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, Input, Cartouche } from '../components/ui';
import { BookCard, BookCover } from '../components/content';
import { useReadingProgressMap, useReadingHistory } from '../hooks/useVideos';
import { useBooks, useBookCategories } from '../hooks/useBooks';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';

const PAGE_SIZE = 12;
/** Covers per shelf: enough to fill a wide row, and the shelf's own link opens the rest. */
const SHELF_SIZE = 10;

// The backend's names (`ListingSort`); the order itself is the server's, never this page's.
const SORTS = [
    { id: 'NEWEST', label: t('common.sortNewest') },
    { id: 'TITLE', label: t('common.sortTitle') },
];

function Books() {
    usePageMeta({ title: t('books.title'), description: t('books.metaDescription') });
    const { token } = useAuth();
    const readingProgress = useReadingProgressMap(!!token);
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
    } = useBooks(PAGE_SIZE, { sort: sortBy, category, search: searchTerm });
    const { data: categories = [] } = useBookCategories();
    const books = useMemo(() => data?.pages.flatMap((page) => page.content) || [], [data]);
    // SHELVES when nothing is narrowed and there is more than one kind of book: what the reader
    // has open, then one shelf of covers per category — a library walked along, where the same
    // books in one sorted grid read as a list. A search, a chosen category or a single-category
    // catalogue keeps the grid below, which is how a particular book is FOUND.
    const shelves = !filtering && categories.length > 1;
    const { data: readingHistory = [] } = useReadingHistory(!!token && shelves);
    const readingNow = readingHistory
        .filter((entry) => entry.book && entry.currentPage > 1 && (!entry.book.pages || entry.currentPage < entry.book.pages))
        .slice(0, 3);



    return (
        <PageShell sidebar={false} contentClassName="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold mb-6">{t('books.title')}</h1>

            {/* Shown whenever there is anything to narrow OR a narrowing is active: a search
                that matches nothing must still leave the box on screen to change it. */}
            {/* isPlaceholderData too: while a new sort or a cleared search loads, the rows on
                screen are the previous query's, possibly an empty "no match" — and unmounting the
                bar then took the search box away from under the reader's cursor. */}
            {!isLoading && (books.length > 0 || filtering || isPlaceholderData) && (
                <div className="flex gap-3 flex-wrap mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder={t('books.searchPlaceholder')}
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

            {/* isError was not passed at all before 2026-09-08, so a failed request rendered
                the empty state — telling a visitor there are no books when the request simply
                did not arrive. */}
            {shelves && readingNow.length > 0 && (
                <section className="mb-10">
                    <Cartouche title={t('books.readingNow')} />
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8">
                        {readingNow.map((entry) => (
                            <BookCard key={entry.bookId} book={entry.book} currentPage={entry.currentPage} />
                        ))}
                    </div>
                </section>
            )}

            {shelves ? (
                <div className="flex flex-col gap-10">
                    {categories.map((c) => (
                        <Shelf key={c} category={c} sort={sortBy} progress={readingProgress} onOpen={() => setCategory(c)} />
                    ))}
                </div>
            ) : (
            <QueryState
                isLoading={isLoading}
                isError={isError}
                error={error}
                onRetry={refetch}
                errorTitle={t('books.loadFailed')}
                // Not while the previous query's rows stand in for the new one: an empty "no match"
                // placeholder would flash the wrong empty message.
                isEmpty={books.length === 0 && !isPlaceholderData}
                emptyIcon={!filtering ? '📚' : '🔍'}
                emptyTitle={!filtering ? t('books.empty') : t('common.noResults')}
                emptyDescription={!filtering ? t('books.emptyDescription') : t('common.tryAnotherSearch')}
            >
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8">
                    {books.map((book) => (
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
                            {isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
                        </button>
                    </div>
                )}
            </QueryState>
            )}
        </PageShell>
    );
}

/**
 * One category as a shelf of covers, scrolling sideways on a narrow screen rather than wrapping,
 * the way a shelf does. Each shelf is its own request, which is fine for a handful of categories;
 * a grouped endpoint would save the round trips if they grow. "See all" narrows the page to the
 * category, which is the grid view with its search and sort.
 */
function Shelf({ category, sort, progress, onOpen }) {
    const { data, isLoading } = useBooks(SHELF_SIZE, { sort, category, search: '' });
    const books = data?.pages[0]?.content || [];
    if (!isLoading && books.length === 0) return null;
    return (
        <section>
            <Cartouche
                title={category}
                action={<button type="button" onClick={onOpen} className="text-primary hover:underline">{t('books.shelfAll')}</button>}
            />
            <div className="flex gap-5 overflow-x-auto pb-3 border-b-4 border-border-light">
                {books.map((book) => (
                    <div key={book.id} className="w-28 flex-shrink-0">
                        <BookCover book={book} currentPage={progress[book.id]} className="w-28" />
                        <p dir="auto" className="mt-2 text-xs font-semibold leading-snug line-clamp-2">{book.title}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Books;
