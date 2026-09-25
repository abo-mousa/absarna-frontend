import { useSyncExternalStore } from 'react';

/**
 * How many columns `grid-cols-1 xs:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4` is rendering right
 * now — Discover's grid, the one `fitFeedToRows` fills. Read from the same breakpoints Tailwind
 * compiles (tailwind.config.js `xs`, and the defaults `md` 768px / `2xl` 1536px), so a change there
 * has to be made here too; `fitFeedToRows` is only as right as this number.
 *
 * <p>Four only from `2xl` since Discover gained its 240px channel column (from `lg`): four cards
 * beside it on a 1280px screen came out around 230px wide, thumbnails rather than pictures.
 */
const QUERIES = [
    ['(min-width: 1536px)', 4],
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

export function useGridColumns() {
    // 4 on the server/in tests with no matchMedia: the widest layout, which trims least.
    return useSyncExternalStore(subscribe, read, () => 4);
}

export default useGridColumns;
