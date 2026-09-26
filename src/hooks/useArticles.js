import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { useUserScope } from './useUserScope';

// "Load more" pagination, same accumulating-pages shape as useInfiniteContents/
// useChannelContents — GET /api/articles used to return the whole table in one unpaginated
// response.
//
// Ordering, the category filter and search all happen on the server, over the whole catalogue: the
// page used to do them to the rows it had loaded, which could only ever find what was on page one.
// `sort` is a backend name (NEWEST / TITLE, `ListingSort`); this hook passes it and nothing more.
export const useArticles = (size = 15, { sort = 'NEWEST', category = '', search = '' } = {}) => {
    return useInfiniteQuery({
        queryKey: ['articles', size, sort, category, search],
        queryFn: async ({ pageParam = 0 }) => {
            const params = new URLSearchParams({ page: pageParam, size, sort });
            if (category) params.set('category', category);
            if (search) params.set('search', search);
            const res = await api.get(`/articles?${params}`);
            return res.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        staleTime: 5 * 60 * 1000,
        // Keep the previous results on screen while a new sort, category or search loads, rather
        // than flashing the spinner on every keystroke.
        placeholderData: keepPreviousData,
    });
};

/** Every category the public listing has, A to Z — the backend's list, not page one's. */
export const useArticleCategories = () => useQuery({
    queryKey: ['articles-categories'],
    queryFn: async () => (await api.get('/articles/categories')).data,
    staleTime: 5 * 60 * 1000,
});

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

/** The Articles tab's first section: `{basis, articles}` on the reader's topics, or none. */
export const useSuggestedArticles = (enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: ['articles-suggested', scope],
        queryFn: async () => (await api.get('/articles/suggested', { params: { limit: 4 } })).data,
        enabled,
    });
};
