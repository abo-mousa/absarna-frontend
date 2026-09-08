import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

// Every listing here is admin-only, so it is user-scoped for the same reason the viewer's own
// lists are: it must not survive a logout into the next person's session. The scope is the last
// key segment, so the invalidations below stay prefix matches and need no scope of their own.

// ============ STATS ============

export const useStats = () => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.adminStats(scope),
        queryFn: async () => {
            const res = await api.get('/admin/stats');
            return res.data;
        },
        staleTime: 60 * 1000,
    });
};

// ============ BOOKS ============

// /admin/books is now paginated (it used to return every book in one response) — same
// bounded-first-page approach admin listings use rather than adding "load more" to the admin
// table.
export const useBooks = () => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.adminBooks(scope),
        queryFn: async () => {
            const res = await api.get('/admin/books?page=0&size=100');
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

// Same pagination change as useBooks above.
export const useArticles = () => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.adminArticles(scope),
        queryFn: async () => {
            const res = await api.get('/admin/articles?page=0&size=100');
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
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.adminBiography(scope),
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