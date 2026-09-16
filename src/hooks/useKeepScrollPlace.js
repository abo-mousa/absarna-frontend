import { useCallback, useEffect, useState } from 'react';

/**
 * The min-height a list area still needs so the page does not move — or `0` to let it go.
 *
 * <p>When a list is swapped for a shorter one (another view, the last page, or anything while it
 * loads), the document gets shorter under the reader, and once its bottom rises above the bottom of
 * the viewport the browser clamps the scroll position upward: the screen jumps. Holding the old
 * height as a minimum stops that, but held for good it leaves blank space under a short list. This
 * keeps only the part of the held height the viewport is actually standing on — `natural` plus
 * whatever the document would otherwise be short of — so the blank space shrinks away as the
 * reader scrolls up past it, and goes entirely once none of it is needed.
 *
 * @param natural      the list's own height
 * @param held         the min-height applied now
 * @param docHeight    the document's height now, with `held` applied
 * @param scrollBottom `scrollY + innerHeight`: where the bottom of the viewport is
 */
export function heldMinHeight({ natural, held, docHeight, scrollBottom }) {
    const area = Math.max(natural, held);
    const docWithoutHold = docHeight - (area - natural);
    const shortfall = scrollBottom - docWithoutHold;
    return shortfall > 0 ? Math.min(held, natural + Math.ceil(shortfall)) : 0;
}

/**
 * Keeps a list area from pulling the page up when its contents get shorter.
 *
 * <p>Call `hold()` just before changing what the list shows; apply the returned `minHeight` to the
 * element around `innerRef`, whose own height is the list's. After a hold the minimum is re-fitted
 * whenever the list resizes or the window scrolls or resizes, and released when nothing needs it.
 * Nothing here ever scrolls the page.
 *
 * @returns `[minHeight, hold]`
 */
export function useKeepScrollPlace(innerRef) {
    const [minHeight, setMinHeight] = useState(0);

    const hold = useCallback(() => {
        const inner = innerRef.current;
        if (inner) setMinHeight((current) => Math.max(current, inner.offsetHeight));
    }, [innerRef]);

    useEffect(() => {
        const inner = innerRef.current;
        if (!minHeight || !inner) return undefined;

        const fit = () => {
            // A hidden tab has no layout to measure; leave the hold until it is shown again.
            if (inner.offsetParent === null) return;
            const next = heldMinHeight({
                natural: inner.offsetHeight,
                held: minHeight,
                docHeight: document.documentElement.scrollHeight,
                scrollBottom: window.scrollY + window.innerHeight,
            });
            if (Math.abs(next - minHeight) >= 1) setMinHeight(next);
        };

        // ResizeObserver also fires once on observe, so a list that loaded before this effect ran
        // is fitted straight away.
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
        observer?.observe(inner);
        window.addEventListener('scroll', fit, { passive: true });
        window.addEventListener('resize', fit);
        return () => {
            observer?.disconnect();
            window.removeEventListener('scroll', fit);
            window.removeEventListener('resize', fit);
        };
    }, [minHeight, innerRef]);

    return [minHeight, hold];
}
