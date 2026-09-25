import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Download } from 'lucide-react';
import BookCover from './BookCover';
import { formatPublishDate, displayDate } from '@/lib/datetime';
import { useBookReadUrl } from '@/hooks/useMediaUrl';
import { t } from '@/i18n';

function BookCard({ book, progress }) {
    const navigate = useNavigate();
    // The PDF is fetched through a presigned URL the backend mints after its visibility check —
    // so the URL is the access grant, and a caller who may not see this book simply never gets
    // one. No token, and no separate "is it hidden" branch: the object is private either way.
    //
    // Which is exactly why it is *not* requested on render. That URL is a bearer credential for
    // its whole TTL (hours, so it outlives a reading session), and this card is rendered a dozen
    // at a time on /books, again per infinite-scroll page, and on History/Bookmarks/ChannelPage —
    // so a listing used to mint, and hold in the query cache, a live download credential for
    // every book on screen, virtually none of which anyone downloads. It is requested on intent
    // instead: pointer-enter/focus/pointer-down all fire before the click, so the URL is
    // normally there by the time the anchor is followed.
    const [downloadIntent, setDownloadIntent] = useState(false);
    const { data: pdfUrl, isError: pdfUrlFailed } = useBookReadUrl(book?.id, downloadIntent && Boolean(book?.id));
    // A click that lands before the URL arrives can't open a tab later — a popup opened outside
    // the click gesture is blocked — so the gesture opens a blank tab and this points it at the
    // URL once it lands. `opener` is cleared first, the programmatic equivalent of the
    // `rel="noopener"` on the ordinary path.
    const pendingTabRef = useRef(null);
    useEffect(() => {
        const tab = pendingTabRef.current;
        if (!tab) return;
        if (pdfUrl) {
            pendingTabRef.current = null;
            tab.opener = null;
            tab.location.replace(pdfUrl);
        } else if (pdfUrlFailed) {
            pendingTabRef.current = null;
            tab.close();
        }
    }, [pdfUrl, pdfUrlFailed]);

    /**
     * Closes a tab still waiting for its URL when this card goes away.
     *
     * <p>The effect above is the only thing that ever points the blank tab somewhere or closes it,
     * and it fires on `pdfUrl`/`pdfUrlFailed`. Neither arrives if the card unmounts first — the
     * viewer navigates away, or the route change cancels the query — so the `about:blank` tab the
     * click gesture opened was left on screen with nothing in it and nothing coming.
     *
     * <p>Its own effect with an empty dependency list, deliberately: a cleanup on the effect above
     * would run on every `pdfUrl` change and close the tab a moment before it was pointed at the
     * file. This one's cleanup runs on unmount and nowhere else. Refs are not reactive, so the
     * empty list is exhaustive.
     */
    useEffect(() => () => {
        pendingTabRef.current?.close();
        pendingTabRef.current = null;
    }, []);

    const handleDownloadClick = (e) => {
        setDownloadIntent(true);
        if (pdfUrl) return; // the href is live; let the browser follow it
        e.preventDefault();
        // null when the browser blocks the popup — the next click has the href by then.
        pendingTabRef.current = window.open('', '_blank');
    };

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
                    <button
                        onClick={() => navigate(`/books/${book.id}`)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-md font-semibold text-sm hover:bg-primary-dark transition-colors"
                    >
                        <BookOpen size={15} /> {t('books.read')}
                    </button>

                    {/* Rendered optimistically: whether a book has a file at all is only knowable
                        by asking, and asking is the thing being deferred. A 404 (no file, or not
                        visible to this caller) takes the button away again. */}
                    {!pdfUrlFailed && (
                        <a
                            href={pdfUrl || `/books/${book.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onPointerEnter={() => setDownloadIntent(true)}
                            onFocus={() => setDownloadIntent(true)}
                            onPointerDown={() => setDownloadIntent(true)}
                            onClick={handleDownloadClick}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary-light text-primary rounded-md font-semibold text-sm hover:no-underline"
                        >
                            <Download size={15} /> {t('books.download')}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BookCard;
