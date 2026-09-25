import { useSyncExternalStore } from 'react';

/**
 * How many columns `grid-cols-1 xs:grid-cols-2 md:grid-cols-3` is rendering right now — Discover's
 * grid, the one `fitFeedToRows` fills. Read from the same breakpoints Tailwind compiles
 * (tailwind.config.js `xs`, and the default `md` 768px), so a change there has to be made here
 * too; `fitFeedToRows` is only as right as this number.
 *
 * <p>Three at most since Discover gained its channel column (from `lg`): four cards beside it came
 * out around 215px wide, thumbnails rather than pictures. Below `lg` there is no column, and three
 * was already the count there.
 */
const QUERIES = [
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
    // 3 on the server/in tests with no matchMedia: the widest layout, which trims least.
    return useSyncExternalStore(subscribe, read, () => 3);
}

export default useGridColumns;
