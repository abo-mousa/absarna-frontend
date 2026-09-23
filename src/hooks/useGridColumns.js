import { useSyncExternalStore } from 'react';

/**
 * How many columns `grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4` is rendering right
 * now — the one grid the home page uses. Read from the same breakpoints Tailwind compiles
 * (tailwind.config.js `xs`, and the defaults `md` 768px / `xl` 1280px), so a change there has to be
 * made here too; `fitFeedToRows` is only as right as this number.
 */
const QUERIES = [
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

export function useGridColumns() {
    // 4 on the server/in tests with no matchMedia: the widest layout, which trims least.
    return useSyncExternalStore(subscribe, read, () => 4);
}

export default useGridColumns;
