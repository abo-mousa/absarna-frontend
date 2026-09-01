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
