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