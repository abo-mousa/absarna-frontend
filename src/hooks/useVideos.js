import { useMemo } from 'react';
import { useInfiniteQuery, useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { NO_CACHE, STATIC } from '@/lib/queryCache';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';
import { useDebouncedValue } from './useDebouncedValue';

export const fetchVideos = async ({ pageParam = 0, queryKey }) => {
    const [, { search, category, size }] = queryKey;

    let url = `/videos?page=${pageParam}&size=${size || 12}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;

    const res = await api.get(url);
    return res.data;
};

export const useInfiniteVideos = (search = '', category = '', size = 12, enabled = true) => {
    return useInfiniteQuery({
        queryKey: ['videos', { search, category, size }],
        queryFn: fetchVideos,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            return lastPage.hasNext ? lastPage.currentPage + 1 : undefined;
        },
        enabled,
        staleTime: 5 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
};

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories');
            return res.data;
        },
        ...STATIC,
    });
};

export const useSearch = (query, page = 0, size = 12) => {
    return useQuery({
        queryKey: ['search', query, page, size],
        queryFn: async () => {
            if (!query || !query.trim()) {
                return { content: [], hasNext: false, totalItems: 0 };
            }
            const res = await api.get(`/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
            return res.data;
        },
        enabled: !!query && query.trim().length > 0,
        staleTime: 2 * 60 * 1000,
    });
};

// SearchPage's "load more" pagination — same accumulating-pages shape as useInfiniteVideos.
export const useInfiniteSearch = (query, size = 12, enabled = true) => {
    return useInfiniteQuery({
        queryKey: ['search-infinite', query, size],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/search?q=${encodeURIComponent(query)}&page=${pageParam}&size=${size}`);
            return res.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        enabled: enabled && !!query && query.trim().length > 0,
        staleTime: 2 * 60 * 1000,
    });
};

// Search-box typeahead: debounces `rawQuery` itself (rather than the request) so a fast
// typist doesn't fire one request per keystroke, then leans on React Query's own
// queryKey cache for the "retype something already seen" case — no separate cache needed.
// `rawQuery` blank/empty still queries (q omitted) so a suggestion list appears on focus,
// before the user types anything, per GET /api/search/suggestions's own blank-query default.
export const useSearchSuggestions = (rawQuery, limit = 8, enabled = true) => {
    const query = useDebouncedValue(rawQuery.trim(), 200);
    const result = useQuery({
        queryKey: ['search-suggestions', query, limit],
        queryFn: async ({ signal }) => {
            let url = `/search/suggestions?limit=${limit}`;
            if (query) url += `&q=${encodeURIComponent(query)}`;
            const res = await api.get(url, { signal });
            return res.data;
        },
        enabled,
        staleTime: query ? 60 * 1000 : 5 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
    // `settledQuery` is the query the returned suggestions actually answer, which is NOT what is
    // in the box: during the debounce window (and the request after it) `isFetching` is false
    // while the data still belongs to the previous keystrokes. Callers need it to avoid making
    // claims about text nobody has searched for yet — see SearchBar's "no matches" line.
    //
    // Named properties, never `{ ...result }`: a v5 query result is a proxy that records which
    // properties the caller reads and re-renders only when one of those changes. A spread reads
    // every one of them, which opts the component out of that entirely — and this hook lives in
    // the navbar, on every page, so it would re-render the whole header on each internal
    // transition of a query that fires per keystroke.
    return {
        data: result.data,
        isFetching: result.isFetching,
        isError: result.isError,
        refetch: result.refetch,
        settledQuery: query,
    };
};

// Bounded home feed (subscribed / discover / featured) — a fixed snapshot, not paginated.
// Scoped to the viewer: its "subscribed" section is theirs alone.
export const useFeed = (enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.feed(scope),
        queryFn: async () => {
            const res = await api.get('/feed');
            return res.data;
        },
        enabled,
        // Not cached at all. The discover section is randomised server-side precisely so a return
        // visit shows something else; any caching makes that invisible and the home page static.
        ...NO_CACHE,
    });
};

export const useVideo = (id) => {
    return useQuery({
        queryKey: ['video', id],
        queryFn: async () => {
            const res = await api.get(`/videos/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
};

export const useRelatedVideo = (id, limit = 6) => {
    return useQuery({
        queryKey: ['related-video', id, limit],
        queryFn: async () => {
            const res = await api.get(`/videos/${id}/related?limit=${limit}`);
            return res.data;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

// The caller's own "continue watching" list — bounded/non-paginated per the backend's design
// (see absarna-backend's CLAUDE.md), never used to drive ranking, only to show progress.
export const useWatchHistory = (enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.watchHistory(scope),
        queryFn: async () => {
            const res = await api.get('/user/history?limit=200');
            return res.data;
        },
        enabled,
        staleTime: 60 * 1000,
        // Kept explicit even though the app-wide default is `refetchOnMount: true` now.
        // VideoPlayer invalidates this query the moment it reports progress, but that almost
        // never happens while History/Home/Bookmarks is the mounted page (you are on VideoDetail
        // while watching), so the invalidation only marks the query stale for the *next* mount.
        // This line is what makes that next mount actually refetch rather than serve the
        // pre-watch snapshot for the rest of its staleTime.
        refetchOnMount: true,
    });
};

// videoId -> progressSeconds, for VideoCard's watched-progress bar.
export const useWatchProgressMap = (enabled = true) => {
    const { data: history = [] } = useWatchHistory(enabled);
    return useMemo(
        () => Object.fromEntries(history.map((entry) => [entry.videoId, entry.progressSeconds])),
        [history]
    );
};

// The caller's own "resume reading" list — same bounded/non-ranking-signal design as
// useWatchHistory, for books instead of videos.
export const useReadingHistory = (enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.readingHistory(scope),
        queryFn: async () => {
            const res = await api.get('/user/reading-history?limit=200');
            return res.data;
        },
        enabled,
        staleTime: 60 * 1000,
        // Same explicit refetchOnMount as useWatchHistory above, for the same reason —
        // useSaveReadProgress invalidates this on every successful page-turn write.
        refetchOnMount: true,
    });
};

// bookId -> currentPage, for BookCard's read-progress bar.
export const useReadingProgressMap = (enabled = true) => {
    const { data: history = [] } = useReadingHistory(enabled);
    return useMemo(
        () => Object.fromEntries(history.map((entry) => [entry.bookId, entry.currentPage])),
        [history]
    );
};
