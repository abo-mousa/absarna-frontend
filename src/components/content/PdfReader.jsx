import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronRight, ChevronLeft, List, Search } from 'lucide-react';
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

// A TOC entry's `dest` is either a named destination (string, needs an extra lookup) or an
// already-explicit destination array — either way it resolves to a page *reference*, not a
// page number, hence the second `getPageIndex` round trip. Recurses into `items` for nested
// outlines (most PDFs are 1-2 levels deep, some go further).
async function resolveOutline(pdf, items) {
    const resolved = await Promise.all(items.map(async (item) => {
        let pageNumber = null;
        try {
            const explicitDest = typeof item.dest === 'string' ? await pdf.getDestination(item.dest) : item.dest;
            if (explicitDest?.[0]) pageNumber = (await pdf.getPageIndex(explicitDest[0])) + 1;
        } catch {
            // A malformed/unresolvable destination just means this entry isn't clickable —
            // still worth showing the title for context.
        }
        const children = item.items?.length ? await resolveOutline(pdf, item.items) : [];
        return { title: item.title, pageNumber, children };
    }));
    return resolved;
}

function OutlineList({ items, onSelect, depth = 0 }) {
    return (
        <ul className={depth > 0 ? 'mr-3.5 border-r border-border-light pr-2.5' : ''}>
            {items.map((item, i) => (
                <li key={i}>
                    <button
                        type="button"
                        onClick={() => item.pageNumber && onSelect(item.pageNumber)}
                        disabled={!item.pageNumber}
                        className="block w-full text-right py-1.5 text-sm text-text-secondary hover:text-primary disabled:opacity-50 disabled:hover:text-text-secondary transition-colors truncate"
                    >
                        {item.title}
                    </button>
                    {item.children?.length > 0 && (
                        <OutlineList items={item.children} onSelect={onSelect} depth={depth + 1} />
                    )}
                </li>
            ))}
        </ul>
    );
}

function PdfReader({ fileUrl, initialPage = 1, onPageChange, onPageChangeImmediate }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [pageInput, setPageInput] = useState(String(initialPage));
    const [loadError, setLoadError] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const [panel, setPanel] = useState(null); // null | 'toc' | 'search'
    const [outline, setOutline] = useState(null); // null = not fetched yet, [] = fetched, none found
    const [outlineLoading, setOutlineLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);
    const appliedInitialPageRef = useRef(initialPage <= 1);
    const pdfRef = useRef(null);
    // Extracted page text is cached per document (keyed by page number) so re-running a search
    // after the first one is instant instead of re-walking every page again.
    const pageTextCacheRef = useRef(new Map());
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
            setPageInput(String(initialPage));
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
        setPageInput(String(clamped));
        // Zero-cost (no network call) — just lets the parent keep a `pagehide`-safe ref of the
        // true latest page, since the debounced `reportPage` write below may not have fired yet.
        onPageChangeImmediate?.(clamped, numPages);
        reportPage(clamped, numPages);
    };

    const handlePageInputSubmit = (e) => {
        e.preventDefault();
        const parsed = parseInt(pageInput, 10);
        if (Number.isFinite(parsed)) {
            goToPage(parsed);
        } else {
            setPageInput(String(pageNumber));
        }
    };

    const handleSelectFromPanel = (page) => {
        goToPage(page);
        setPanel(null);
    };

    const togglePanel = async (name) => {
        if (panel === name) {
            setPanel(null);
            return;
        }
        setPanel(name);
        if (name === 'toc' && outline === null && pdfRef.current) {
            setOutlineLoading(true);
            try {
                const raw = await pdfRef.current.getOutline();
                setOutline(raw?.length ? await resolveOutline(pdfRef.current, raw) : []);
            } catch {
                setOutline([]);
            } finally {
                setOutlineLoading(false);
            }
        }
    };

    // Extracts every page's text once (cached in pageTextCacheRef) and searches the cache —
    // there's no pdfjs viewer's FindController available outside the full viewer widget react-pdf
    // doesn't ship, so this trades highlight-in-place for a simpler, still genuinely useful
    // "which pages mention this" result list the reader can jump from.
    const runSearch = async (e) => {
        e.preventDefault();
        const query = searchQuery.trim().toLocaleLowerCase();
        if (!query || !pdfRef.current || !numPages) {
            setSearchResults(null);
            return;
        }
        setSearching(true);
        const pdf = pdfRef.current;
        const cache = pageTextCacheRef.current;
        const matches = [];
        for (let i = 1; i <= numPages; i++) {
            // Bail out if the document changed mid-search (new book opened) — pdfRef would no
            // longer match what this loop started with.
            if (pdfRef.current !== pdf) return;
            let text = cache.get(i);
            if (text === undefined) {
                try {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text = content.items.map((item) => item.str).join(' ').toLocaleLowerCase();
                } catch {
                    text = '';
                }
                cache.set(i, text);
            }
            if (text.includes(query)) matches.push(i);
        }
        setSearchResults(matches);
        setSearching(false);
    };

    if (loadError) {
        return (
            <div className="py-16 text-center text-red-600 dark:text-red-400">
                تعذر تحميل الملف —{' '}
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    افتح الملف في تبويب جديد
                </a>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full">
            {numPages && (
                <div className="flex items-center gap-2 mb-3 w-full justify-center flex-wrap">
                    <button
                        type="button"
                        onClick={() => togglePanel('toc')}
                        aria-pressed={panel === 'toc'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                            panel === 'toc' ? 'bg-primary-light text-primary' : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <List size={15} /> المحتويات
                    </button>
                    <button
                        type="button"
                        onClick={() => togglePanel('search')}
                        aria-pressed={panel === 'search'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                            panel === 'search' ? 'bg-primary-light text-primary' : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <Search size={15} /> بحث
                    </button>
                </div>
            )}

            {panel === 'toc' && (
                <div className="w-full max-w-[500px] mb-4 p-3.5 rounded-md border border-border-light bg-surface-hover max-h-[280px] overflow-y-auto">
                    {outlineLoading ? (
                        <p className="text-sm text-text-muted text-center py-3">جاري التحميل...</p>
                    ) : outline?.length ? (
                        <OutlineList items={outline} onSelect={handleSelectFromPanel} />
                    ) : (
                        <p className="text-sm text-text-muted text-center py-3">لا توجد قائمة محتويات لهذا الملف</p>
                    )}
                </div>
            )}

            {panel === 'search' && (
                <div className="w-full max-w-[500px] mb-4 p-3.5 rounded-md border border-border-light bg-surface-hover">
                    <form onSubmit={runSearch} className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث داخل الملف..."
                            className="flex-1 min-w-0 px-3 py-2 rounded-md border border-border bg-surface text-sm outline-none focus:border-primary"
                        />
                        <button
                            type="submit"
                            disabled={searching || !searchQuery.trim()}
                            className="px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-50"
                        >
                            بحث
                        </button>
                    </form>

                    {searching && <p className="text-sm text-text-muted text-center py-2">جاري البحث في الملف...</p>}

                    {!searching && searchResults !== null && (
                        searchResults.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto">
                                {searchResults.map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handleSelectFromPanel(page)}
                                        className="px-3 py-1 rounded-full bg-surface border border-border text-sm text-text-secondary hover:text-primary hover:border-primary transition-colors"
                                    >
                                        صفحة {page}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-text-muted text-center py-2">لا توجد نتائج</p>
                        )
                    )}
                </div>
            )}

            <div ref={containerRef} className="w-full flex justify-center overflow-x-auto">
                <Document
                    file={fileUrl}
                    onLoadSuccess={(pdf) => {
                        pdfRef.current = pdf;
                        pageTextCacheRef.current = new Map();
                        setOutline(null);
                        setSearchResults(null);
                        setNumPages(pdf.numPages);
                    }}
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

                    <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 text-sm text-text-secondary whitespace-nowrap">
                        صفحة
                        <input
                            type="text"
                            inputMode="numeric"
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            aria-label="الانتقال إلى صفحة"
                            className="w-12 px-1.5 py-1 text-center rounded-md border border-border bg-surface outline-none focus:border-primary"
                        />
                        من {numPages}
                    </form>

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
