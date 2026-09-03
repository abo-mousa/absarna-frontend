import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Download, X } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';
import { formatPublishDate } from '@/lib/dayjsAr';
import { useMediaToken } from '@/hooks/useMediaToken';
import { flushOnUnload } from '@/lib/api/beacon';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState } from '../components/ui';
import { CommentsSection, BookmarkButton, ShareButton } from '../components/content';
import { useBook, useBookReadProgress, useSaveReadProgress } from '../hooks/useBooks';
import { usePageMeta } from '../hooks/usePageMeta';

// Code-split: pdfjs is a large dependency that only visitors who actually open a book should pay for.
const PdfReader = lazy(() => import('../components/content/PdfReader'));

function BookDetail() {
    const { id } = useParams();
    // Session token: for the read-progress calls below, which axios sends as a header. It is
    // never what goes into a media URL — that's the media token further down. See useMediaToken.
    const { token } = useAuth();
    const [showPdf, setShowPdf] = useState(false);
    const { data: book, isLoading, isError } = useBook(id);
    const { mediaToken, isLoading: mediaTokenLoading } = useMediaToken(book?.visible === false);
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
                    errorTitle="الكتاب غير موجود"
                    errorAction={<Link to="/books" className="text-primary font-semibold">العودة للمكتبة</Link>}
                />
            </PageShell>
        );
    }

    // Token needed only for a book the caller isn't guaranteed public access to — a hidden one,
    // or one whose channel got suspended after this page loaded it as the owner (see
    // resolveMediaUrl's comment). This used to pass the session token unconditionally on the
    // grounds that a single item per page load isn't worth gating; now that the token is a
    // separate fetch (useMediaToken), gating it saves that request on every public book too.
    // Held back until the token arrives, so a hidden book's reader doesn't mount against a URL
    // that's certain to 404 and show a load error the user would have to retry out of.
    const authToken = book.visible === false ? mediaToken : null;
    const pdfUrl = mediaTokenLoading ? null : resolveMediaUrl(book.pdfUrl, authToken);
    const previewUrl = mediaTokenLoading ? null : resolveMediaUrl(book.previewImageUrl, authToken);

    return (
        <PageShell sidebar={false}>
            <div className="max-w-reading mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="bg-surface rounded-lg overflow-hidden border border-border-light shadow-sm mb-6">
                    {previewUrl && !showPdf && (
                        <div className="relative h-[280px] overflow-hidden cursor-pointer" onClick={() => setShowPdf(true)}>
                            <img src={previewUrl} alt={book.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex items-center gap-2 bg-black/70 text-white px-5 py-3 rounded-md font-semibold">
                                    <BookOpen size={18} /> اضغط للقراءة
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
                                <BookmarkButton type="book" id={book.id} />
                            </div>
                        </div>

                        <div className="flex gap-4 flex-wrap text-sm text-text-secondary mb-4">
                            {book.pages && <span>{book.pages} صفحة</span>}
                            {book.publishDate && <span>{formatPublishDate(book.publishDate)}</span>}
                            {book.originalPublishDate && book.originalPublishDate !== book.publishDate && (
                                <span>تاريخ النشر الأصلي: {book.originalPublishDate}</span>
                            )}
                            <span>{(book.viewCount ?? 0).toLocaleString('ar')} مشاهدات</span>
                        </div>

                        {book.description && (
                            <p className="text-text-secondary leading-loose mb-5">{book.description}</p>
                        )}

                        {pdfUrl && (
                            <>
                                {savedPage && !showPdf && (
                                    <p className="text-sm text-text-muted mb-3">
                                        توقفت عند صفحة {savedPage}
                                    </p>
                                )}
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => setShowPdf(!showPdf)}
                                        className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-md font-semibold"
                                    >
                                        <BookOpen size={18} />
                                        {showPdf ? 'إخفاء القراءة' : savedPage ? 'متابعة القراءة' : 'قراءة أونلاين'}
                                    </button>

                                    <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 bg-primary-light text-primary rounded-md font-semibold"
                                    >
                                        <Download size={18} /> تحميل PDF
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
                            <Suspense fallback={<div className="py-16 text-center text-text-muted">جاري التحميل...</div>}>
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
                        <ArrowRight size={16} /> العودة للمكتبة
                    </Link>
                </div>
            </div>
        </PageShell>
    );
}

export default BookDetail;
