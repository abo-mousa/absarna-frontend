import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

export const COMMENTS_PAGE_SIZE = 20;

/**
 * A thread, twenty top-level comments at a time, each with all of its replies.
 *
 * <p>"Load more" rather than numbered pages: a thread is read from the top down. It used to come
 * back whole, so the most-discussed item on the platform was also its heaviest page. Each page
 * also carries `totalComments` — every visible comment including replies — because a heading
 * counted from the loaded pages would change every time the reader pressed "load more".
 *
 * <p>The mutations below invalidate `['comments', type, id]`, which refetches every page already
 * loaded, so a new comment appears without the reader losing their place.
 */
export const useComments = (type, id) => {
    return useInfiniteQuery({
        queryKey: ['comments', type, id],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/${type}s/${id}/comments`,
                { params: { page: pageParam, size: COMMENTS_PAGE_SIZE } });
            return res.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        enabled: !!type && !!id,
        staleTime: 30 * 1000,
    });
};

export const useCreateComment = (type, id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (content) => {
            const res = await api.post(`/${type}s/${id}/comments`, { content });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', type, id] });
        },
    });
};

export const useReplyComment = (type, id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ parentId, content }) => {
            const res = await api.post(`/comments/${parentId}/reply`, { content });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', type, id] });
        },
    });
};

// Author-only edit/delete (backend gates on Comment.userId, see CommentController) — works for
// both top-level comments and replies since both share the same /comments/{id} endpoint.
export const useUpdateComment = (type, id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ commentId, content }) => {
            const res = await api.patch(`/comments/${commentId}`, { content });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', type, id] });
        },
    });
};

export const useDeleteComment = (type, id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (commentId) => {
            await api.delete(`/comments/${commentId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', type, id] });
        },
    });
};
