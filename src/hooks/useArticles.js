import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';

// "Load more" pagination, same accumulating-pages shape as useInfiniteContents/
// useChannelContents — GET /api/articles used to return the whole table in one unpaginated
// response.
export const useArticles = (size = 15) => {
    return useInfiniteQuery({
        queryKey: ['articles', size],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/articles?page=${pageParam}&size=${size}`);
            return res.data;
        },
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        staleTime: 5 * 60 * 1000,
    });
};

export const useArticle = (id) => {
    return useQuery({
        queryKey: ['article', id],
        queryFn: async () => {
            const res = await api.get(`/articles/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
};
