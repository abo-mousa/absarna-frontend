import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Download, X } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';
import { formatPublishDate, displayDate } from '@/lib/dayjsAr';
import { useBookReadUrl } from '@/hooks/useMediaUrl';
import { flushOnUnload } from '@/lib/api/beacon';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, ExpandableText } from '../components/ui';
import { CommentsSection, BookmarkButton, LikeButton, ShareButton } from '../components/content';
import { useBook, useBookReadProgress, useSaveReadProgress } from '../hooks/useBooks';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';
import { formatCount } from '@/lib/numbers';

// Code-split: pdfjs is a large dependency that only visitors who actually open a book should pay for.
const PdfReader = lazy(() => import('../components/content/PdfReader'));

function BookDetail() {
    const { id } = useParams();
    // Session token: for the read-progress calls below, which axios sends as a header. It is
    // never what goes into a media URL — the reader's PDF URL arrives already signed from the
    // backend. See useBookReadUrl.
    const { token } = useAuth();
    const [showPdf, setShowPdf] = useState(false);
    const [previewFailed, setPreviewFailed] = useState(false);
    const { data: book, isLoading, isError, error } = useBook(id);
    const { data: pdfUrl } = useBookReadUrl(book?.id, Boolean(book?.id));
    const { data: savedPage } = useBookReadProgress(id, !!token);
    const saveReadProgress = useSaveReadProgress(id);
    const lastPageRef = useRef(null);
    usePageMeta({
        title: book?.title,
        description: book?.description?.slice(0, 200),
        image: resolveMediaUrl(book?.previewImageUrl),
    });

    const handlePageChange = (page) => {
        if (!token) return;
        saveReadProgress.mutate(page);
    };

    // Zero-cost local tracking (no request) so the pagehide flush below always has the true
    // latest page, even one turned less than a second ago (still sitting in PdfReader's debounce).
    const handlePageChangeImmediate = (page) => {
        lastPageRef.current = page;
    };

    // Hard refresh/tab-close/hard navigation never reaches PdfReader's own unmount cleanup (the
    // whole JS context is torn down first) — `pagehide` fires in those cases, but by then a
    // normal axios call would get cancelled mid-flight, hence the keepalive-based flush.
    useEffect(() => {
        const handlePageHide = () => {
            if (!token || !lastPageRef.current) return;
            flushOnUnload(`/books/${id}/read`, { currentPage: lastPageRef.current });
        };
        window.addEventListener('pagehide', handlePageHide);
        return () => window.removeEventListener('pagehide', handlePageHide);
    }, [id, token]);

    if (isLoading || isError || !book) {
        return (
            <PageShell sidebar={false}>
                <QueryState
                    isLoading={isLoading}
                    isError={isError || !book}
                    error={error}
                    errorTitle={t('books.notFound')}
                    errorAction={<Link to="/books" className="text-primary font-semibold">{t('books.backToLibrary')}</Link>}
                />
            </PageShell>
        );
    }

    // Preview images are not presigned; resolveMediaUrl returns null for an object key and the
    // caller falls back to its placeholder.
    // Owner-supplied and external, so it can fail for reasons the page cannot see — a dead link,
    // a hotlink block, or the SPA's own img-src allowlist. Falling back to no image is correct;
    // a broken-image glyph over a "tap to read" overlay is not.
    const previewUrl = !previewFailed ? resolveMediaUrl(book.previewImageUrl) : null;

    return (
        <PageShell sidebar={false}>
            <div className="max-w-reading mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="bg-surface rounded-lg overflow-hidden border border-border-light shadow-sm mb-6">
                    {previewUrl && !showPdf && (
                        <div className="relative h-[280px] overflow-hidden cursor-pointer" onClick={() => setShowPdf(true)}>
                            <img
                                src={previewUrl}
                                alt={book.title}
                                onError={() => setPreviewFailed(true)}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex items-center gap-2 bg-black/70 text-white px-5 py-3 rounded-md font-semibold">
                                    <BookOpen size={18} /> {t('books.tapToRead')}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-5 sm:p-6">
                        {book.category && (
                            <span className="inline-block px-3 py-1 bg-primary-light text-primary rounded-full text-sm font-semibold mb-3">
                                {book.category}
                            </span>
                        )}

                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h1 className="text-xl sm:text-2xl font-bold">{book.title}</h1>
                            <div className="flex items-center gap-3 flex-shrink-0 mt-1">
                                <ShareButton title={book.title} path={`/books/${book.id}`} />
                                <LikeButton type="book" id={book.id} />
                                <BookmarkButton type="book" id={book.id} />
                            </div>
                        </div>

                        <div className="flex gap-4 flex-wrap text-sm text-text-secondary mb-4">
                            {book.pages && <span>{t('common.pageCount', { count: book.pages })}</span>}
                            {displayDate(book) && <span>{formatPublishDate(displayDate(book))}</span>}
                            {book.originalPublishDate && book.originalPublishDate !== book.publishDate && (
                                <span>{t('common.originalPublishDate', { date: book.originalPublishDate })}</span>
                            )}
                            <span>{t('common.views', { count: formatCount(book.viewCount ?? 0) })}</span>
                        </div>

                        {/* Collapsed to four lines, the same as a video's. A book's blurb is the
                            one thing on this page that has no length anyone agreed to, and whole
                            it pushed the read/download buttons — the reason the page exists —
                            below the fold. The toggle only appears when it opens something; see
                            ExpandableText. `mb-5` moves to the wrapper so the gap sits under the
                            control rather than between the prose and its own toggle. */}
                        {book.description && (
                            <ExpandableText className="mb-5">
                                <p className="text-text-secondary leading-loose">{book.description}</p>
                            </ExpandableText>
                        )}

                        {pdfUrl && (
                            <>
                                {savedPage && !showPdf && (
                                    <p className="text-sm text-text-muted mb-3">
                                        {t('books.stoppedAtPage', { page: savedPage })}
                                    </p>
                                )}
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => setShowPdf(!showPdf)}
                                        className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-md font-semibold"
                                    >
                                        <BookOpen size={18} />
                                        {showPdf ? t('books.hideReader') : savedPage ? t('books.continueReading') : t('books.readOnline')}
                                    </button>

                                    <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 bg-primary-light text-primary rounded-md font-semibold"
                                    >
                                        <Download size={18} /> {t('books.downloadPdf')}
                                    </a>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {showPdf && pdfUrl && (
                    <div className="bg-surface rounded-lg overflow-hidden border border-border-light shadow-sm flex flex-col mb-6">
                        <div className="flex justify-between items-center px-5 py-3 border-b border-border-light">
                            <h3 className="m-0 flex items-center gap-2"><BookOpen size={18} /> {book.title}</h3>
                            <button onClick={() => setShowPdf(false)} className="text-text-muted hover:text-text-primary">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <Suspense fallback={<div className="py-16 text-center text-text-muted">{t('common.loading')}</div>}>
                                <PdfReader
                                    fileUrl={pdfUrl}
                                    initialPage={savedPage || 1}
                                    onPageChange={handlePageChange}
                                    onPageChangeImmediate={handlePageChangeImmediate}
                                />
                            </Suspense>
                        </div>
                    </div>
                )}

                <CommentsSection type="book" id={book.id} />

                <div className="mt-6">
                    <Link to="/books" className="flex items-center gap-1.5 text-primary font-semibold w-fit">
                        <ArrowRight size={16} /> {t('books.backToLibrary')}
                    </Link>
                </div>
            </div>
        </PageShell>
    );
}

export default BookDetail;
