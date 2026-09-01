import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

// Fetch all books (cached for 5 minutes)
export const useBooks = (category = '') => {
    return useQuery({
        queryKey: ['books', category],
        queryFn: async () => {
            const url = category ? `/books?category=${encodeURIComponent(category)}` : '/books';
            const res = await api.get(url);
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
    });
};

// Fetch single book
export const useBook = (id) => {
    return useQuery({
        queryKey: ['book', id],
        queryFn: async () => {
            const res = await api.get(`/books/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
};

// Caller's own saved reading position for one book — {} when nothing saved yet.
export const useBookReadProgress = (id, enabled = true) => {
    return useQuery({
        queryKey: ['book-read-progress', id],
        queryFn: async () => {
            const res = await api.get(`/books/${id}/read`);
            return res.data?.currentPage || null;
        },
        enabled: enabled && !!id,
        staleTime: 60 * 1000,
    });
};

// Best-effort write on every page turn — updates the cached page optimistically (matching the
// previous local-state behavior of never blocking the reader on the network) and never rolls
// back on failure, since a dropped progress write shouldn't visibly disrupt reading.
export const useSaveReadProgress = (id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (currentPage) => {
            await api.post(`/books/${id}/read`, { currentPage });
            return currentPage;
        },
        onMutate: (currentPage) => {
            queryClient.setQueryData(['book-read-progress', id], currentPage);
        },
    });
};

// Create book
export const useCreateBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (book) => {
            const res = await api.post('/admin/books', book);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};

// Delete book
export const useDeleteBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            await api.delete(`/admin/books/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
};