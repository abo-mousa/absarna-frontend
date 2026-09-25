import { BookOpen, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, Input, Cartouche } from '../components/ui';
import { BookCard, BookCover } from '../components/content';
import { useReadingProgressMap, useReadingNow } from '../hooks/useVideos';
import { useBooks, useBookCategories, useBookShelves } from '../hooks/useBooks';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';

const PAGE_SIZE = 12;

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
    // catalogue keeps the grid below, which is how a particular book is FOUND. Which categories,
    // which books and what counts as "reading now" are all the backend's.
    const shelvesQuery = useBookShelves(sortBy, !filtering && categories.length > 1);
    const shelfList = shelvesQuery.data || [];
    const shelves = !filtering && categories.length > 1;
    const { data: readingNow = [] } = useReadingNow(!!token && shelves);



    return (
        <PageShell contentClassName="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
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
                            <BookCard key={entry.bookId} book={entry.book} progress={entry.progress} />
                        ))}
                    </div>
                </section>
            )}

            {shelves ? (
                // The shelves report failure through the page's own query, which still runs: each
                // Shelf renders nothing when it has no books, so without this an outage read as an
                // empty library rather than as an error with a retry.
                <QueryState
                    isLoading={shelvesQuery.isLoading}
                    isError={shelvesQuery.isError}
                    error={shelvesQuery.error}
                    onRetry={shelvesQuery.refetch}
                    errorTitle={t('books.loadFailed')}
                >
                    <div className="flex flex-col gap-10">
                        {shelfList.map((shelf) => (
                            <Shelf key={shelf.category} shelf={shelf} progress={readingProgress} onOpen={() => setCategory(shelf.category)} />
                        ))}
                    </div>
                </QueryState>
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
                emptyIcon={!filtering ? BookOpen : Search}
                emptyTitle={!filtering ? t('books.empty') : t('common.noResults')}
                emptyDescription={!filtering ? t('books.emptyDescription') : t('common.tryAnotherSearch')}
            >
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8">
                    {books.map((book) => (
                        <BookCard key={book.id} book={book} progress={readingProgress[book.id]} />
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
 * the way a shelf does. Its books come with the page's one shelves request. "See all" narrows the
 * page to the category, which is the grid view with its search and sort.
 */
function Shelf({ shelf, progress, onOpen }) {
    return (
        <section>
            <Cartouche
                title={shelf.category}
                action={<button type="button" onClick={onOpen} className="text-primary hover:underline">{t('books.shelfAll')}</button>}
            />
            <div className="flex gap-5 overflow-x-auto pb-3 border-b-4 border-border-light">
                {shelf.books.map((book) => (
                    <div key={book.id} className="w-28 flex-shrink-0">
                        <BookCover book={book} progress={progress[book.id]} className="w-28" />
                        <p dir="auto" className="mt-2 text-xs font-semibold leading-snug line-clamp-2">{book.title}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Books;
