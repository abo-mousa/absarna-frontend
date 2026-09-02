import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Download } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';
import { useMediaToken } from '@/hooks/useMediaToken';

// Percent read, for the small progress bar on the cover — same idea as VideoCard's
// watched-percent, hidden below 1% so a barely-opened book doesn't show a sliver.
function getReadPercent(book, currentPage) {
    if (!currentPage || !book.pages) return null;
    const percent = (currentPage / book.pages) * 100;
    return percent > 1 ? Math.min(100, percent) : null;
}

function BookCard({ book, currentPage }) {
    const navigate = useNavigate();
    // Token only needed for the owner's own hidden book — see resolveMediaUrl's comment. While
    // it's still loading, hold both URLs back rather than rendering a cover request that's
    // certain to 404 (same reasoning as VideoCard's thumbnail).
    const needsMediaToken = book.visible === false;
    const { mediaToken, isLoading: mediaTokenLoading } = useMediaToken(needsMediaToken);
    const authToken = needsMediaToken ? mediaToken : null;
    const previewUrl = mediaTokenLoading ? null : resolveMediaUrl(book.previewImageUrl, authToken);
    const pdfUrl = mediaTokenLoading ? null : resolveMediaUrl(book.pdfUrl, authToken);
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
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                        <div className="h-full bg-primary/40" style={{ width: `${readPercent}%` }} />
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
                    {book.publishDate && <span>{book.publishDate}</span>}
                </div>

                <div className="flex gap-2 mt-auto">
                    <button
                        onClick={() => navigate(`/books/${book.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary text-white rounded-md font-semibold text-sm hover:bg-primary-dark transition-colors"
                    >
                        <BookOpen size={15} /> قراءة
                    </button>

                    {pdfUrl && (
                        <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
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
