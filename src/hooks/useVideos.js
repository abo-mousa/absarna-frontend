import { useMemo } from 'react';
import { useInfiniteQuery, useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/api/client';
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
        staleTime: 30 * 60 * 1000,
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
    return useQuery({
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
};

// Bounded home feed (subscribed / discover / featured) — a fixed snapshot, not paginated.
export const useFeed = (enabled = true) => {
    return useQuery({
        queryKey: ['feed'],
        queryFn: async () => {
            const res = await api.get('/feed');
            return res.data;
        },
        enabled,
        staleTime: 5 * 60 * 1000,
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
    return useQuery({
        queryKey: ['watch-history'],
        queryFn: async () => {
            const res = await api.get('/user/history?limit=200');
            return res.data;
        },
        enabled,
        staleTime: 60 * 1000,
        // Overrides the app-wide refetchOnMount: false (same reasoning as useMediaToken's own
        // override) — VideoPlayer invalidates this query the moment it reports progress, but
        // that almost never happens while History/Home/Bookmarks is the mounted page (you're on
        // VideoDetail while watching), so the invalidation only marks the query stale for
        // *next* mount rather than refetching it immediately. With refetchOnMount left at the
        // app-wide false, React Query ignores that staleness on mount too (it only compares
        // against staleTime, not the isInvalidated flag) and keeps serving the pre-watch
        // snapshot — so a watch that just happened would never show up without a full reload.
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
    return useQuery({
        queryKey: ['reading-history'],
        queryFn: async () => {
            const res = await api.get('/user/reading-history?limit=200');
            return res.data;
        },
        enabled,
        staleTime: 60 * 1000,
        // Same refetchOnMount override as useWatchHistory above, for the same reason —
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
