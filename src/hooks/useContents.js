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