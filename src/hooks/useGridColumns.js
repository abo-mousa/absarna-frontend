import { useSyncExternalStore } from 'react';

/**
 * How many columns `grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4` is rendering right
 * now — Discover's grid, the one `fitFeedToRows` fills. Read from the same breakpoints Tailwind
 * compiles (tailwind.config.js `xs`, and the defaults `md` 768px / `xl` 1280px), so a change there
 * has to be made here too; `fitFeedToRows` is only as right as this number.
 *
 * <p>Four from `xl` (product owner, 2026-09-26): four videos across an ordinary laptop screen. It
 * was `2xl` for a while after Discover gained its channel column, because four beside the column
 * at 1280px are about 230px wide; smaller cards were chosen over a three-card row on most screens.
 *
 * <p><b>Five from `3xl` (1920px), for grids that ask for it.</b> On a large monitor the page column
 * widens, and a grid that stayed at four made each card half as large again as on a laptop. A grid
 * opts in with `useGridColumns(5)` and `3xl:grid-cols-5` together — Discover does. Today does not:
 * its sections are sized in whole rows of four (four news, eight suggestions), so its grid stops at
 * four and its cards grow instead. The cap is what keeps this number equal to the grid on screen.
 */
const QUERIES = [
    ['(min-width: 1920px)', 5],
    ['(min-width: 1280px)', 4],
    ['(min-width: 768px)', 3],
    ['(min-width: 480px)', 2],
];

const media = () => (typeof window !== 'undefined' && window.matchMedia
    ? QUERIES.map(([query, cols]) => [window.matchMedia(query), cols])
    : []);

const read = () => media().find(([mql]) => mql.matches)?.[1] ?? 1;

const subscribe = (onChange) => {
    const lists = media().map(([mql]) => mql);
    lists.forEach((mql) => mql.addEventListener('change', onChange));
    return () => lists.forEach((mql) => mql.removeEventListener('change', onChange));
};

export function useGridColumns(maxColumns = 4) {
    // 4 on the server/in tests with no matchMedia: the widest laptop layout, which trims least.
    return Math.min(useSyncExternalStore(subscribe, read, () => 4), maxColumns);
}

export default useGridColumns;
