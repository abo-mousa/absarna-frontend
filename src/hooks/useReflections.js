import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/client';
import { STANDARD } from '@/lib/queryCache';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

/**
 * «خواطري» — the reader's own lines about what they took from an episode or a book
 * (`/api/user/reflections`). Private: nothing but these hooks reads them.
 */
const PAGE = 20;

export const useReflections = () => {
    const scope = useUserScope();
    return useInfiniteQuery({
        queryKey: queryKeys.reflections(scope),
        queryFn: async ({ pageParam = 0 }) => (await api.get('/user/reflections', { params: { page: pageParam, size: PAGE } })).data,
        initialPageParam: 0,
        // The endpoint answers a plain list: a full page means there may be more.
        getNextPageParam: (last, pages) => (last.length === PAGE ? pages.length : undefined),
        ...STANDARD,
    });
};

/** The reader's reflections on one video or book, in the order they sit in it. */
export const useItemReflections = (kind, itemId) => {
    const { token } = useAuth();
    const scope = useUserScope();
    return useQuery({
        queryKey: [...queryKeys.reflections(scope), 'item', kind, itemId],
        queryFn: async () => (await api.get('/user/reflections', { params: { kind, itemId } })).data,
        enabled: !!token && !!itemId,
        ...STANDARD,
    });
};

const invalidate = (queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['reflections'] });
    // The Friday review carries the week's.
    queryClient.invalidateQueries({ queryKey: ['weekly-review'] });
};

/** `{ kind: 'VIDEO' | 'BOOK', itemId, position?, text }`. */
export const useCreateReflection = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (body) => (await api.post('/user/reflections', body)).data,
        onSuccess: () => invalidate(queryClient),
    });
};

export const useDeleteReflection = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/user/reflections/${id}`),
        onSuccess: () => invalidate(queryClient),
    });
};
