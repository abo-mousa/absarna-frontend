import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { List, Search } from 'lucide-react';
import { ChevronBack, ChevronForward } from '@/components/ui/DirectionalIcon';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { formatDigits, normalizeDigits, t } from '@/i18n';
import { normalizeArabic } from '@/lib/arabic';

// Bundled locally (not the browser's native PDF plugin) so rendering is identical across
// Chrome/Firefox/Safari/etc — this is the whole point of using react-pdf over <object>.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

// Debounces how often page turns are reported upward (to record reading progress) so
// quickly flipping through several pages doesn't fire a write per page.
const REPORT_DEBOUNCE_MS = 1000;

/**
 * How long a resize has to settle before the page is re-rendered at the new width.
 *
 * <p>The page is drawn fit-to-width (`<Page width={containerWidth}>`), so every change of width
 * re-rasterises a PDF page onto a canvas — the most expensive thing this component does. A
 * `ResizeObserver` fires on every frame of a drag, so an un-debounced observer re-rasterised the
 * page tens of times to show one final width.
 *
 * <p>Short on purpose. This is not a network call, and the page visibly lags the window until it
 * fires, so the number is doing one job: turning a drag into a single render rather than dozens.
 * Long enough and the reader looks broken mid-resize.
 *
 * <p><b>Above roughly a 750px viewport this never runs at all</b>: the reader sits inside
 * `max-w-reading`, so the container stops growing and the observer reports the same width, which
 * React discards without a render.
 */
const RESIZE_DEBOUNCE_MS = 150;

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
        <ul className={depth > 0 ? 'ms-3.5 border-s border-border-light ps-2.5' : ''}>
            {items.map((item, i) => (
                <li key={i}>
                    <button
                        type="button"
                        onClick={() => item.pageNumber && onSelect(item.pageNumber)}
                        disabled={!item.pageNumber}
                        // The outline comes from inside the PDF, so it is the document's
                        // language and not the interface's.
                        dir="auto"
                        className="block w-full text-start py-1.5 text-sm text-text-secondary hover:text-primary disabled:opacity-50 disabled:hover:text-text-secondary transition-colors truncate"
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
    // Shown in the locale's digits like every other number, but NOT forced on what the reader
    // types: the box keeps their own characters until they submit, and `normalizeDigits` accepts
    // either script — rewriting an input as someone types in it is hostile, and refusing a Latin
    // keyboard on an Arabic page would be worse.
    const [pageInput, setPageInput] = useState(formatDigits(initialPage));
    const [loadError, setLoadError] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    // The height the last page rendered at, held on the container so a page turn does not
    // collapse it — see the note on the container below.
    const [pageHeight, setPageHeight] = useState(0);
    const [panel, setPanel] = useState(null); // null | 'toc' | 'search'
    const [outline, setOutline] = useState(null); // null = not fetched yet, [] = fetched, none found
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);
    // Its own timer, deliberately not `debounceRef`: that one reports page turns, and sharing it
    // would let a resize cancel a pending progress write.
    const resizeTimerRef = useRef(null);
    const hasMeasuredRef = useRef(false);
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

        // Rounded: `contentRect.width` is fractional, and a sub-pixel wobble would otherwise be a
        // new value every time. Passing the same number back to `setContainerWidth` is free —
        // React bails out of the render — so rounding is what makes that bail-out actually happen.
        const apply = (width) => setContainerWidth(Math.round(width));

        const observer = new ResizeObserver((entries) => {
            const { width } = entries[0].contentRect;

            // THE FIRST MEASUREMENT IS IMMEDIATE, and that is the point of the flag rather than a
            // plain debounce. Nothing renders until `containerWidth > 0`, so debouncing the first
            // one would leave the reader blank for the delay every single time it is opened — a
            // guaranteed cost on every open, to save a cost that only occurs while dragging.
            if (!hasMeasuredRef.current) {
                if (width > 0) hasMeasuredRef.current = true;
                apply(width);
                return;
            }

            clearTimeout(resizeTimerRef.current);
            resizeTimerRef.current = setTimeout(() => apply(width), RESIZE_DEBOUNCE_MS);
        });

        observer.observe(el);
        return () => {
            // Dropped rather than flushed, unlike the page-turn debounce below: a resize that
            // never settled describes an element that no longer exists.
            clearTimeout(resizeTimerRef.current);
            observer.disconnect();
        };
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
        setPageInput(formatDigits(clamped));
        // Zero-cost (no network call) — just lets the parent keep a `pagehide`-safe ref of the
        // true latest page, since the debounced `reportPage` write below may not have fired yet.
        onPageChangeImmediate?.(clamped, numPages);
        reportPage(clamped, numPages);
    };

    const handlePageInputSubmit = (e) => {
        e.preventDefault();
        const parsed = parseInt(normalizeDigits(pageInput), 10);
        if (Number.isFinite(parsed)) {
            goToPage(parsed);
        } else {
            setPageInput(formatDigits(pageNumber));
        }
    };

    const handleSelectFromPanel = (page) => {
        goToPage(page);
        setPanel(null);
    };

    const togglePanel = (name) => setPanel(panel === name ? null : name);

    /**
     * Reads the table of contents as soon as the document is open, rather than when the button is
     * pressed.
     *
     * <p><b>So that the button can be absent when there is nothing behind it.</b> Fetching lazily
     * meant the control had to be rendered before anyone knew whether it led anywhere, and plenty
     * of books have no outline at all — pressing «المحتويات» to be told «لا توجد قائمة محتويات
     * لهذا الملف» is a control that exists only to refuse.
     *
     * <p>It costs one call against the document catalog, which is metadata and not page content,
     * so it does not touch the pages or the text layer. `resolveOutline` then turns each entry's
     * destination into a page number, which is the part that needs the document.
     *
     * <p>Guarded on the pdf it started with, like the search below: opening another book while
     * this is in flight must not write the old book's contents onto the new one.
     */
    useEffect(() => {
        const pdf = pdfRef.current;
        if (!numPages || !pdf || outline !== null) return;
        let cancelled = false;
        (async () => {
            let resolved = [];
            try {
                const raw = await pdf.getOutline();
                if (raw?.length) resolved = await resolveOutline(pdf, raw);
            } catch {
                resolved = [];
            }
            if (cancelled || pdfRef.current !== pdf) return;
            setOutline(resolved);
        })();
        return () => { cancelled = true; };
    }, [numPages, outline]);

    // Extracts every page's text once (cached in pageTextCacheRef) and searches the cache —
    // there's no pdfjs viewer's FindController available outside the full viewer widget react-pdf
    // doesn't ship, so this trades highlight-in-place for a simpler, still genuinely useful
    // "which pages mention this" result list the reader can jump from.
    const runSearch = async (e) => {
        e.preventDefault();
        // Folded the way `absarna_normalize_arabic` folds every server-side search: the four
        // alefs together, alef maqsura into ya, ta marbuta into ha, and every mark dropped. A
        // reader types «اسلامية» and the page says «إسلاميّة»; without this they do not meet.
        const query = normalizeArabic(searchQuery.trim());
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
                    // Both sides through the same fold, so the comparison is like for like — and
                    // the NFKC inside it is what turns a PDF's pre-shaped presentation forms back
                    // into the letters a reader actually typed.
                    text = normalizeArabic(content.items.map((item) => item.str).join(' '));
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
                {t('pdfReader.loadFailed')}{' '}
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    {t('pdfReader.openInNewTab')}
                </a>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full">
            {numPages && (
                <div className="flex items-center gap-2 mb-3 w-full justify-center flex-wrap">
                    {/* Only when the book HAS a table of contents. Plenty do not, and a control
                        whose only outcome is «لا توجد قائمة محتويات لهذا الملف» is one that exists
                        to refuse — so the outline is read when the document opens (see the effect
                        above) and this is absent rather than disappointing. */}
                    {outline?.length > 0 && (
                        <button
                            type="button"
                            onClick={() => togglePanel('toc')}
                            aria-pressed={panel === 'toc'}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                                panel === 'toc' ? 'bg-primary-light text-primary' : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            <List size={15} /> {t('pdfReader.contents')}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => togglePanel('search')}
                        aria-pressed={panel === 'search'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                            panel === 'search' ? 'bg-primary-light text-primary' : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <Search size={15} /> {t('pdfReader.search')}
                    </button>
                </div>
            )}

            {/* No loading or empty branch: the button above only exists once the outline is
                loaded and not empty, so there is no state where this panel has nothing to show.

                THE OUTLINE IS CHECKED AGAIN HERE ANYWAY, and not out of caution. `panel` and
                `outline` are separate pieces of state and only one of them is reset when a
                document loads: `onLoadSuccess` sets the outline back to `null` and leaves the
                panel open, so a reader with the contents open when the file reloads would render
                this branch with nothing in it — and `OutlineList` maps over what it is given.
                One condition covers it; the alternative is `panel` being reset in a second place
                and staying correct there for ever. */}
            {panel === 'toc' && outline?.length > 0 && (
                <div className="w-full max-w-[500px] mb-4 p-3.5 rounded-md border border-border-light bg-surface-hover max-h-[280px] overflow-y-auto">
                    <OutlineList items={outline} onSelect={handleSelectFromPanel} />
                </div>
            )}

            {panel === 'search' && (
                <div className="w-full max-w-[500px] mb-4 p-3.5 rounded-md border border-border-light bg-surface-hover">
                    <form onSubmit={runSearch} className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('pdfReader.searchPlaceholder')}
                            className="flex-1 min-w-0 px-3 py-2 rounded-md border border-border bg-surface text-sm outline-none focus:border-primary"
                        />
                        <button
                            type="submit"
                            disabled={searching || !searchQuery.trim()}
                            className="px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-50"
                        >
                            {t('pdfReader.search')}
                        </button>
                    </form>

                    {searching && <p className="text-sm text-text-muted text-center py-2">{t('pdfReader.searching')}</p>}

                    {!searching && searchResults !== null && (
                        searchResults.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto">
                                {searchResults.map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handleSelectFromPanel(page)}
                                        className="px-3 py-1 rounded-full bg-surface border border-border text-sm text-text-secondary hover:text-primary hover:border-primary transition-colors"
                                    >
                                        {t('pdfReader.resultPage', { page })}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-text-muted text-center py-2">{t('common.noResults')}</p>
                        )
                    )}
                </div>
            )}

            {/* WHY THE HEIGHT IS HELD. Turning a page unmounts one canvas and mounts another, and
                rasterising the new one takes a moment — during which this box has nothing in it and
                collapses to nothing. The document above the scrollbar shrinks by a page's worth of
                height, the browser clamps the scroll position to the new maximum, and by the time
                the canvas reappears the reader has been thrown to the top. That is the "it
                refreshes and jumps" — not a reload, a relayout.

                Reserving the last rendered height means the box never shrinks, so there is nothing
                to clamp and the scroll position survives the turn. `onRenderSuccess` hands back the
                height in CSS pixels at the scale it actually drew, so this tracks the real page
                rather than an assumed A4, and it re-measures on every page — a document that mixes
                portrait and landscape settles on each new size as it reaches it. */}
            <div
                ref={containerRef}
                style={pageHeight ? { minHeight: pageHeight } : undefined}
                className="w-full flex justify-center overflow-x-auto"
            >
                <Document
                    file={fileUrl}
                    onLoadSuccess={(pdf) => {
                        pdfRef.current = pdf;
                        pageTextCacheRef.current = new Map();
                        setOutline(null);
                        setSearchResults(null);
                        setNumPages(pdf.numPages);
                        // A different document is a different page size; holding the old one's
                        // height would leave a gap under the first page of the new one.
                        setPageHeight(0);
                    }}
                    onLoadError={() => setLoadError(true)}
                    loading={<div className="py-16 text-text-muted">{t('common.loading')}</div>}
                >
                    {containerWidth > 0 && (
                        <Page
                            pageNumber={pageNumber}
                            width={containerWidth}
                            renderAnnotationLayer={false}
                            onRenderSuccess={({ height }) => setPageHeight(height)}
                        />
                    )}
                </Document>
            </div>

            {numPages && (
                // BACK, POSITION, FORWARD — in that source order, which is what puts each control
                // on the side its own arrow points to. A flex row follows the page's direction, so
                // under `ltr` this reads «← back | page 3 of 99 | forward →» and under `rtl` it
                // mirrors to «forward ← | page | back →»: backward is always on the side the text
                // starts, forward always on the side it runs towards.
                //
                // It used to be forward-first, which put "next" on the LEFT in English with an
                // arrow pointing right — the control and its own glyph disagreeing about which way
                // they went. Under RTL it was wrong the same way and simply harder to catch.
                // `ui/Pager` has always been in this order; this row was the odd one out.
                <div className="flex items-center gap-4 mt-4 py-3 border-t border-border-light w-full justify-center">
                    <button
                        onClick={() => goToPage(pageNumber - 1)}
                        disabled={pageNumber <= 1}
                        className="p-2 rounded-md bg-surface-hover disabled:opacity-40"
                        aria-label={t('pdfReader.previousPage')}
                    >
                        <ChevronBack size={18} />
                    </button>

                    <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 text-sm text-text-secondary whitespace-nowrap">
                        {t('pdfReader.page')}
                        <input
                            type="text"
                            inputMode="numeric"
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            aria-label={t('pdfReader.goToPage')}
                            className="w-12 px-1.5 py-1 text-center rounded-md border border-border bg-surface outline-none focus:border-primary"
                        />
                        {t('pdfReader.ofPages', { total: numPages })}
                    </form>

                    <button
                        onClick={() => goToPage(pageNumber + 1)}
                        disabled={pageNumber >= numPages}
                        className="p-2 rounded-md bg-surface-hover disabled:opacity-40"
                        aria-label={t('pdfReader.nextPage')}
                    >
                        <ChevronForward size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default PdfReader;
