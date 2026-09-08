import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

// "Load more" pagination, same accumulating-pages shape as useInfiniteContents/
// useChannelContents — GET /api/books used to return the whole table in one unpaginated
// response.
export const useBooks = (size = 12) => {
    return useInfiniteQuery({
        queryKey: ['books', size],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/books?page=${pageParam}&size=${size}`);
            return res.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
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
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.bookReadProgress(id, scope),
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
    const scope = useUserScope();

    return useMutation({
        mutationFn: async (currentPage) => {
            await api.post(`/books/${id}/read`, { currentPage });
            return currentPage;
        },
        onMutate: (currentPage) => {
            queryClient.setQueryData(queryKeys.bookReadProgress(id, scope), currentPage);
        },
        onSuccess: () => {
            // The optimistic setQueryData above only covers this one book's own resume position
            // (used when reopening it) — it does not touch the separate reading-history query
            // that backs the History page and BookCard's progress bar everywhere else. Those are
            // a different key and nothing else marks them stale, so without this they keep
            // serving the pre-read snapshot for the rest of their staleTime. Same fix as
            // VideoPlayer's watch-progress reporting. Prefix, so it matches this viewer's copy.
            queryClient.invalidateQueries({ queryKey: ['reading-history'] });
        },
    });
};

// NOTE: `useCreateBook` / `useDeleteBook` used to live here too, calling the same /admin/books
// endpoints as the copies in `useAdminData.js` but invalidating only ['books'] — never
// ['admin-books'] or ['admin-stats']. Nothing imported them (the admin pages have always used
// useAdminData's), so they were dead code that would have refreshed the wrong lists the first
// time anyone reached for the nearer-looking name. Removed 2026-09-08; use useAdminData's.
