import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Bundled locally (not the browser's native PDF plugin) so rendering is identical across
// Chrome/Firefox/Safari/etc — this is the whole point of using react-pdf over <object>.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

// Debounces how often page turns are reported upward (to record reading progress) so
// quickly flipping through several pages doesn't fire a write per page.
const REPORT_DEBOUNCE_MS = 1000;

function PdfReader({ fileUrl, initialPage = 1, onPageChange, onPageChangeImmediate }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [loadError, setLoadError] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);
    const appliedInitialPageRef = useRef(initialPage <= 1);
    // Mirror the latest callback/page-state into refs so the unmount cleanup below (an effect
    // with `[]` deps, so its closure is otherwise frozen at mount) can flush the true latest
    // values instead of whatever was current on first render.
    const onPageChangeRef = useRef(onPageChange);
    onPageChangeRef.current = onPageChange;
    const pageNumberRef = useRef(pageNumber);
    pageNumberRef.current = pageNumber;
    const numPagesRef = useRef(numPages);
    numPagesRef.current = numPages;

    // initialPage often arrives asynchronously (fetched after this component already mounted
    // at page 1) — apply it once, the first time it becomes a real saved page.
    useEffect(() => {
        if (!appliedInitialPageRef.current && initialPage > 1) {
            setPageNumber(initialPage);
            appliedInitialPageRef.current = true;
        }
    }, [initialPage]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return undefined;
        const observer = new ResizeObserver((entries) => {
            setContainerWidth(entries[0].contentRect.width);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Flush (not drop) a still-pending debounced report on unmount — navigating away from the
    // reader within the debounce window used to silently discard that page turn instead of
    // ever reporting it.
    useEffect(() => () => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            onPageChangeRef.current?.(pageNumberRef.current, numPagesRef.current);
        }
    }, []);

    const reportPage = (page, total) => {
        if (!onPageChange) return;
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onPageChange(page, total), REPORT_DEBOUNCE_MS);
    };

    const goToPage = (page) => {
        if (!numPages) return;
        const clamped = Math.min(Math.max(1, page), numPages);
        setPageNumber(clamped);
        // Zero-cost (no network call) — just lets the parent keep a `pagehide`-safe ref of the
        // true latest page, since the debounced `reportPage` write below may not have fired yet.
        onPageChangeImmediate?.(clamped, numPages);
        reportPage(clamped, numPages);
    };

    if (loadError) {
        return (
            <div className="py-16 text-center text-red-600">
                تعذر تحميل الملف —{' '}
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    افتح الملف في تبويب جديد
                </a>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full">
            <div ref={containerRef} className="w-full flex justify-center overflow-x-auto">
                <Document
                    file={fileUrl}
                    onLoadSuccess={({ numPages: total }) => setNumPages(total)}
                    onLoadError={() => setLoadError(true)}
                    loading={<div className="py-16 text-text-muted">جاري التحميل...</div>}
                >
                    {containerWidth > 0 && (
                        <Page pageNumber={pageNumber} width={containerWidth} renderAnnotationLayer={false} />
                    )}
                </Document>
            </div>

            {numPages && (
                <div className="flex items-center gap-4 mt-4 py-3 border-t border-border-light w-full justify-center">
                    <button
                        onClick={() => goToPage(pageNumber + 1)}
                        disabled={pageNumber >= numPages}
                        className="p-2 rounded-md bg-surface-hover disabled:opacity-40"
                        aria-label="الصفحة التالية"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-text-secondary whitespace-nowrap">
                        صفحة {pageNumber} من {numPages}
                    </span>
                    <button
                        onClick={() => goToPage(pageNumber - 1)}
                        disabled={pageNumber <= 1}
                        className="p-2 rounded-md bg-surface-hover disabled:opacity-40"
                        aria-label="الصفحة السابقة"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default PdfReader;
