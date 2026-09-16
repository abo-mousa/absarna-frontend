import { useEffect } from 'react';

/**
 * The page to move to when `page` has come back empty, or `null` to stay.
 *
 * <p>Deleting the last row on the last page leaves the owner on a page past the end: the list
 * says «لا يوجد محتوى بعد» over a channel that has plenty. The server's `totalPages` is already
 * the new count, so the last real page is one below it.
 *
 * @param page the zero-based page on screen
 * @param data the page object the backend returned for it (`content`, `totalPages`)
 */
export function pageAfterEmpty(page, data) {
    if (!data || page <= 0 || (data.content?.length ?? 0) > 0) return null;
    return Math.max(0, (data.totalPages ?? 0) - 1);
}

/** Applies {@link pageAfterEmpty} whenever a settled page comes back empty. */
export function useEmptyPageStepBack(page, setPage, data, loading) {
    useEffect(() => {
        if (loading) return;
        const next = pageAfterEmpty(page, data);
        if (next !== null && next !== page) setPage(next);
    }, [page, setPage, data, loading]);
}
