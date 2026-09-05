import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Download } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';
import { formatPublishDate } from '@/lib/dayjsAr';
import { useBookReadUrl } from '@/hooks/useMediaUrl';

// Percent read, for the small progress bar on the cover — same idea as VideoCard's
// watched-percent, hidden below 1% so a barely-opened book doesn't show a sliver.
function getReadPercent(book, currentPage) {
    if (!currentPage || !book.pages) return null;
    const percent = (currentPage / book.pages) * 100;
    return percent > 1 ? Math.min(100, percent) : null;
}

function BookCard({ book, currentPage }) {
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

    const handleDownloadClick = (e) => {
        setDownloadIntent(true);
        if (pdfUrl) return; // the href is live; let the browser follow it
        e.preventDefault();
        // null when the browser blocks the popup — the next click has the href by then.
        pendingTabRef.current = window.open('', '_blank');
    };

    // Preview images are not presigned; resolveMediaUrl returns null for an object key and the
    // caller falls back to its placeholder.
    const previewUrl = resolveMediaUrl(book.previewImageUrl);
    const readPercent = getReadPercent(book, currentPage);

    return (
        <div className="flex flex-col h-full bg-surface rounded-lg overflow-hidden border border-border-light shadow-sm hover:shadow-md transition-shadow">
            <Link
                to={`/books/${book.id}`}
                className="relative h-[200px] bg-surface-hover overflow-hidden block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            >
                {previewUrl ? (
                    <img src={previewUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-dark to-primary text-5xl opacity-50">
                        📖
                    </div>
                )}

                {readPercent !== null && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/70">
                        {/* A fixed, muted turquoise, brighter in light mode — see VideoCard's
                            identical bar for the full reasoning. */}
                        <div className="h-full bg-[#45A296] dark:bg-[#337F77]" style={{ width: `${readPercent}%` }} />
                    </div>
                )}
            </Link>

            <div className="p-4 flex flex-col flex-1">
                {book.category && (
                    <span className="inline-block w-fit px-2.5 py-0.5 bg-primary-light text-primary rounded-full text-xs font-semibold mb-2">
                        {book.category}
                    </span>
                )}

                <h3 className="text-[0.95rem] font-semibold mb-2 leading-snug line-clamp-2">
                    <Link to={`/books/${book.id}`} className="hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
                        {book.title}
                    </Link>
                </h3>

                <div className="flex gap-3 text-xs text-text-muted mb-3">
                    {book.pages && <span>{book.pages} صفحة</span>}
                    {book.publishDate && <span>{formatPublishDate(book.publishDate)}</span>}
                </div>

                <div className="flex gap-2 mt-auto">
                    <button
                        onClick={() => navigate(`/books/${book.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary text-white rounded-md font-semibold text-sm hover:bg-primary-dark transition-colors"
                    >
                        <BookOpen size={15} /> قراءة
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
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-light text-primary rounded-md font-semibold text-sm"
                        >
                            <Download size={15} /> تحميل
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BookCard;
