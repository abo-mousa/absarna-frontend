import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { BookOpen, X } from 'lucide-react';
import { ArrowBack } from '@/components/ui/DirectionalIcon';
import { resolveMediaUrl } from '@/lib/media';
import { formatPublishDate, displayDate } from '@/lib/datetime';
import { useBookReadUrl } from '@/hooks/useMediaUrl';
import { flushOnUnload } from '@/lib/api/beacon';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, ExpandableText, KhatamStar } from '../components/ui';
import { CommentsSection, BookmarkButton, LikeButton, ReportButton, ShareButton, BookDownloadButton, BookCover } from '../components/content';
import { useBook, useBookReadProgress, useSaveReadProgress } from '../hooks/useBooks';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';
import { formatCompactCount } from '@/lib/numbers';

// Code-split: pdfjs is a large dependency that only visitors who actually open a book should pay for.
const PdfReader = lazy(() => import('../components/content/PdfReader'));

function BookDetail() {
    const { id } = useParams();
    // Session token: for the read-progress calls below, which axios sends as a header. It is
    // never what goes into a media URL — the reader's PDF URL arrives already signed from the
    // backend. See useBookReadUrl.
    const { token } = useAuth();
    // `?read=1` — a card's «قراءة» — opens the reader on arrival instead of behind a second press.
    // Closing it drops the parameter, so a refresh does not reopen a reader the reader closed.
    const [searchParams, setSearchParams] = useSearchParams();
    const openedFromLink = useRef(searchParams.get('read') === '1');
    const [showPdf, setShowPdfState] = useState(openedFromLink.current);
    const setShowPdf = (open) => {
        setShowPdfState(open);
        if (!open && searchParams.has('read')) {
            setSearchParams((params) => {
                params.delete('read');
                return params;
            }, { replace: true });
        }
    };
    const readerRef = useRef(null);
    const { data: book, isLoading, isError, error } = useBook(id);
    const { data: pdfUrl } = useBookReadUrl(book?.id, Boolean(book?.id));
    const { data: savedPage, isPending: savedPagePending } = useBookReadProgress(id, !!token);
    // The reader takes its first page once, at mount — so it waits for the saved page, or a
    // reader sent straight in would start on page 1 of a book they were halfway through.
    const readerReady = showPdf && !!pdfUrl && (!token || !savedPagePending);

    // Sent in by a card: bring the reader into view once it is there, once.
    useEffect(() => {
        if (readerReady && openedFromLink.current) {
            openedFromLink.current = false;
            readerRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
    }, [readerReady]);
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
            <PageShell>
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

    return (
        <PageShell>
            <div className="max-w-[900px] mx-auto w-full px-4 sm:px-6 py-8">
                {/* The book as the rest of the site now draws things: no panel around it, the cover
                    beside a serif title with the category in the kicker's gold, and the page's two
                    actions right there — the cover itself opens the reader too. The old page was a
                    boxed card with a bold title and a 280px crop of the cover as a banner. */}
                <header className="flex gap-5 sm:gap-8 pb-6 mb-6 border-b border-border">
                    <BookCover book={book} className="w-28 sm:w-44" onOpen={() => setShowPdf(true)} />

                    <div className="flex-1 min-w-0 flex flex-col">
                        {book.category && (
                            <span dir="auto" className="flex items-center gap-1.5 text-xs font-bold text-gold-ink mb-2">
                                <KhatamStar className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{book.category}</span>
                            </span>
                        )}
                        <h1 dir="auto" className="font-serif text-[1.9rem] sm:text-[2.6rem] font-semibold leading-tight">{book.title}</h1>

                        <div className="flex gap-x-3 gap-y-1 flex-wrap text-sm text-text-muted mt-2">
                            {book.pages && <span>{t('common.pageCount', { count: book.pages })}</span>}
                            {displayDate(book) && <span>{formatPublishDate(displayDate(book))}</span>}
                            {book.originalPublishDate && book.originalPublishDate !== book.publishDate && (
                                <span>{t('common.originalPublishDate', { date: book.originalPublishDate })}</span>
                            )}
                            <span>{t('common.views', { count: formatCompactCount(book.viewCount ?? 0) })}</span>
                        </div>

                        <div className="pt-5">
                            {pdfUrl && savedPage && !readerReady && (
                                <p className="text-sm font-semibold text-gold-ink mb-2">
                                    {t('books.stoppedAtPage', { page: savedPage })}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                                {pdfUrl && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowPdf(!showPdf)}
                                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md font-semibold"
                                        >
                                            <BookOpen size={17} />
                                            {readerReady ? t('books.hideReader') : savedPage ? t('books.continueReading') : t('books.read')}
                                        </button>
                                        <BookDownloadButton
                                            bookId={book.id}
                                            iconSize={17}
                                            className="gap-2 px-5 py-2.5 bg-primary-light text-primary rounded-md"
                                        >
                                            {t('books.download')}
                                        </BookDownloadButton>
                                    </>
                                )}
                                <div className="flex items-center gap-3 ms-1">
                                    <ShareButton title={book.title} path={`/books/${book.id}`} />
                                    <LikeButton type="book" id={book.id} />
                                    <BookmarkButton type="book" id={book.id} />
                                    <ReportButton type="book" id={book.id} />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Collapsed to four lines, the same as a video's: a book's blurb has no length
                    anyone agreed to. The toggle only appears when it opens something; see
                    ExpandableText. */}
                {book.description && (
                    <ExpandableText className="mb-8">
                        <p dir="auto" className="font-reading text-text-secondary leading-loose">{book.description}</p>
                    </ExpandableText>
                )}

                {readerReady && (
                    <div ref={readerRef} className="scroll-mt-[var(--navbar-h)] bg-surface rounded-lg overflow-hidden border border-border-light shadow-sm flex flex-col mb-6">
                        <div className="flex justify-between items-center px-5 py-3 border-b border-border-light">
                            <h2 dir="auto" className="m-0 flex items-center gap-2 font-serif text-[1.3rem] font-semibold leading-none"><BookOpen size={18} className="flex-shrink-0 text-gold-ink" /> <span className="truncate">{book.title}</span></h2>
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
                        <ArrowBack size={16} /> {t('books.backToLibrary')}
                    </Link>
                </div>
            </div>
        </PageShell>
    );
}

export default BookDetail;
