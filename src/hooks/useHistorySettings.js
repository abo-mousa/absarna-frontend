import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { STANDARD } from '@/lib/queryCache';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/contexts/AuthContext';
import { invalidateProgress } from './useGoals';
import { MILESTONES_SEEN_KEY } from '@/lib/journey';
import { safeStorage } from '@/lib/safeStorage';
import { useUserScope } from './useUserScope';

/**
 * How long the reader's history is kept and whether recording is paused
 * (`/api/user/history/settings`, PROGRESS-AND-GOALS.md §6.6). Read wherever the paused line shows
 * — the player, the reader, the journey pages — so it is one cached query, signed in only.
 */
export const useHistorySettings = () => {
    const { token } = useAuth();
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.historySettings(scope),
        queryFn: async () => (await api.get('/user/history/settings')).data,
        enabled: !!token,
        ...STANDARD,
    });
};

/** `{ retention }`, `{ paused }`, or both; the answer is the whole new setting. */
export const useUpdateHistorySettings = () => {
    const queryClient = useQueryClient();
    const scope = useUserScope();
    return useMutation({
        mutationFn: async (body) => (await api.put('/user/history/settings', body)).data,
        onSuccess: (settings) => queryClient.setQueryData(queryKeys.historySettings(scope), settings),
    });
};

/**
 * Erases the history and the day logs — and, with `counts`, the week totals, the finished list and
 * the milestones. Everything built from them goes stale at once.
 */
export const useEraseProgress = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ counts = false } = {}) => api.delete('/user/progress', { params: counts ? { include: 'counts' } : {} }),
        onSuccess: (_, { counts = false } = {}) => {
            // Milestones erased can be reached again, and must then be announced again.
            if (counts) safeStorage.removeItem(MILESTONES_SEEN_KEY);
            invalidateProgress(queryClient);
            queryClient.invalidateQueries({ queryKey: ['watch-history'] });
            queryClient.invalidateQueries({ queryKey: ['reading-history'] });
            queryClient.invalidateQueries({ queryKey: ['book-read-progress'] });
            // «خواطري» is erased with the history on the backend; without this the list, and a
            // video page's cached lines, kept showing what was just erased.
            queryClient.invalidateQueries({ queryKey: ['reflections'] });
        },
    });
};
