import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';

export const useArticles = () => {
    return useQuery({
        queryKey: ['articles'],
        queryFn: async () => {
            const res = await api.get('/articles');
            return res.data || [];
        },
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
