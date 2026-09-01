import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

export const useComments = (type, id) => {
    return useQuery({
        queryKey: ['comments', type, id],
        queryFn: async () => {
            const res = await api.get(`/${type}s/${id}/comments`);
            return res.data || [];
        },
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
