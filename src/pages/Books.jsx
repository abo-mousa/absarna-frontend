import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { Spinner, EmptyState } from '../components/ui';
import { BookCard } from '../components/content';
import { useReadingProgressMap } from '../hooks/useContents';
import { useBooks } from '../hooks/useBooks';

function Books() {
    const { token } = useAuth();
    const readingProgress = useReadingProgressMap(!!token);
    const { data: books = [], isLoading } = useBooks();

    return (
        <PageShell sidebar={false} contentClassName="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold mb-6">المكتبة</h1>

            {isLoading ? (
                <Spinner />
            ) : books.length === 0 ? (
                <EmptyState icon="📚" title="لا توجد كتب" description="سيتم إضافة الكتب قريباً" />
            ) : (
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-5">
                    {books.map((book) => (
                        <BookCard key={book.id} book={book} currentPage={readingProgress[book.id]} />
                    ))}
                </div>
            )}
        </PageShell>
    );
}

export default Books;
