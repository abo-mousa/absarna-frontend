import { Link, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import BookCover from './BookCover';
import { formatPublishDate, displayDate } from '@/lib/datetime';
import BookDownloadButton from './BookDownloadButton';
import { t } from '@/i18n';

function BookCard({ book, progress }) {
    const navigate = useNavigate();

    return (
        // A ROW, NOT A TILE: a small cover at the start and the book beside it, the way a library
        // lists books. The old card was a 200px landscape crop of a portrait page inside a boxed
        // tile, which made a book look like a video; a portrait cover at full column width would
        // have been ~450px tall on /books' three columns and taller on a phone. No box, as with
        // VideoCard — a hairline under the row is the only separator.
        <div className="flex gap-4 h-full pb-4 border-b border-border-light">
            <BookCover book={book} progress={progress} />

            <div className="flex flex-col flex-1 min-w-0">
                {book.category && (
                    <span dir="auto" className="block truncate text-xs font-bold text-gold-ink mb-1">
                        {book.category}
                    </span>
                )}

                {/* Markazi, the face the reading pages set a book's own title in. */}
                <h3 dir="auto" className="font-serif text-[1.3rem] font-semibold mb-1 leading-tight line-clamp-2">
                    <Link to={`/books/${book.id}`} className="text-text-primary hover:text-primary hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
                        {book.title}
                    </Link>
                </h3>

                <div className="flex flex-wrap gap-x-3 text-xs text-text-muted mb-3">
                    {book.pages && <span>{t('common.pageCount', { count: book.pages })}</span>}
                    {displayDate(book) && <span>{formatPublishDate(displayDate(book))}</span>}
                </div>

                <div className="flex gap-2 mt-auto">
                    {/* Straight into the reader, at the page this reader stopped on: `?read=1`
                        opens it on arrival. It used to land on the book's page with the reader
                        still closed behind a second «قراءة» button. */}
                    <button
                        type="button"
                        onClick={() => navigate(`/books/${book.id}?read=1`)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-md font-semibold text-sm hover:bg-primary-dark transition-colors"
                    >
                        <BookOpen size={15} /> {progress > 0 ? t('books.continueReading') : t('books.read')}
                    </button>

                    <BookDownloadButton bookId={book.id} className="px-3.5 py-2 bg-primary-light text-primary rounded-md text-sm">
                        {t('books.download')}
                    </BookDownloadButton>
                </div>
            </div>
        </div>
    );
}

export default BookCard;
