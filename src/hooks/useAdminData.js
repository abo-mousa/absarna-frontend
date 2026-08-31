import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

// ============ STATS ============

export const useStats = () => {
    return useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get('/admin/stats');
            return res.data;
        },
        staleTime: 60 * 1000,
    });
};

// ============ VIDEOS ============

export const useVideos = () => {
    return useQuery({
        queryKey: ['admin-videos'],
        queryFn: async () => {
            const res = await api.get('/contents?page=0&size=100');
            return res.data?.content || res.data || [];
        },
        staleTime: 10 * 60 * 1000,
    });
};

export const useCreateVideo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (video) => {
            const res = await api.post('/admin/contents', video);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            queryClient.invalidateQueries({ queryKey: ['contents'] });
        },
    });
};

export const useDeleteVideo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            await api.delete(`/admin/contents/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            queryClient.invalidateQueries({ queryKey: ['contents'] });
        },
    });
};

// ============ BOOKS ============

export const useBooks = () => {
    return useQuery({
        queryKey: ['admin-books'],
        queryFn: async () => {
            const res = await api.get('/admin/books');
            return res.data?.content || res.data || [];
        },
        staleTime: 10 * 60 * 1000,
    });
};

export const useCreateBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (book) => {
            const res = await api.post('/admin/books', book);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-books'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};

export const useDeleteBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            await api.delete(`/admin/books/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-books'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
    });
};

// ============ ARTICLES ============

export const useArticles = () => {
    return useQuery({
        queryKey: ['admin-articles'],
        queryFn: async () => {
            const res = await api.get('/admin/articles');
            return res.data?.content || res.data || [];
        },
        staleTime: 10 * 60 * 1000,
    });
};

export const useCreateArticle = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (article) => {
            const res = await api.post('/admin/articles', article);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            queryClient.invalidateQueries({ queryKey: ['articles'] });
        },
    });
};

export const useDeleteArticle = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            await api.delete(`/admin/articles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
    });
};

// ============ BIOGRAPHY ============

export const useBiography = () => {
    return useQuery({
        queryKey: ['admin-biography'],
        queryFn: async () => {
            const res = await api.get('/admin/biography');
            return res.data;
        },
        staleTime: 10 * 60 * 1000,
    });
};

export const useUpdateBiography = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (bio) => {
            const res = await api.put('/admin/biography', bio);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-biography'] });
            queryClient.invalidateQueries({ queryKey: ['biography'] });
        },
    });
};