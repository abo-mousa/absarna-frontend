import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';

export const fetchContents = async ({ pageParam = 0, queryKey }) => {
    const [, { search, category, size }] = queryKey;

    let url = `/contents?page=${pageParam}&size=${size || 12}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;

    const res = await api.get(url);
    return res.data;
};

export const useInfiniteContents = (search = '', category = '', size = 12, enabled = true) => {
    return useInfiniteQuery({
        queryKey: ['contents', { search, category, size }],
        queryFn: fetchContents,
        getNextPageParam: (lastPage) => {
            return lastPage.hasNext ? lastPage.currentPage + 1 : undefined;
        },
        enabled,
        staleTime: 5 * 60 * 1000,
        keepPreviousData: true,
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

// SearchPage's "load more" pagination — same accumulating-pages shape as useInfiniteContents.
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

export const useContent = (id) => {
    return useQuery({
        queryKey: ['content', id],
        queryFn: async () => {
            const res = await api.get(`/contents/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
};

export const useRelatedContent = (id, limit = 6) => {
    return useQuery({
        queryKey: ['related-content', id, limit],
        queryFn: async () => {
            const res = await api.get(`/contents/${id}/related?limit=${limit}`);
            return res.data;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

// The caller's own "continue watching" list — bounded/non-paginated per the backend's design
// (see manara-platform's CLAUDE.md), never used to drive ranking, only to show progress.
export const useWatchHistory = (enabled = true) => {
    return useQuery({
        queryKey: ['watch-history'],
        queryFn: async () => {
            const res = await api.get('/user/history?limit=200');
            return res.data;
        },
        enabled,
        staleTime: 60 * 1000,
    });
};

// contentId -> progressSeconds, for VideoCard's watched-progress bar.
export const useWatchProgressMap = (enabled = true) => {
    const { data: history = [] } = useWatchHistory(enabled);
    return useMemo(
        () => Object.fromEntries(history.map((entry) => [entry.contentId, entry.progressSeconds])),
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