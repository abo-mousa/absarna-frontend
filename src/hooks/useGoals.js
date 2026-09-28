import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { STANDARD } from '@/lib/queryCache';
import { queryKeys } from '@/lib/queryKeys';
import { readerTimeZone } from '@/lib/timeZone';
import { startQada } from '@/lib/qada';
import { useUserScope } from './useUserScope';

/**
 * The reader's goals (`/api/user/goals`, PROGRESS-AND-GOALS.md §6.8). Per reader, so the SPA is
 * the cache; every write invalidates what it moves — the goals, the tab's reads, Today and the
 * review — and nothing else.
 */
const withZone = () => ({ params: { tz: readerTimeZone() } });

export const invalidateProgress = (queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['progress'] });
    queryClient.invalidateQueries({ queryKey: ['today'] });
    queryClient.invalidateQueries({ queryKey: ['weekly-review'] });
};

export const useGoals = (enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.goals(scope),
        queryFn: async () => (await api.get('/user/goals', withZone())).data,
        enabled,
        ...STANDARD,
    });
};

export const useGoal = (id) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.goal(id, scope),
        queryFn: async () => (await api.get(`/user/goals/${id}`, withZone())).data,
        enabled: !!id,
        ...STANDARD,
    });
};

const useGoalMutation = (mutationFn) => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn, onSuccess: () => invalidateProgress(queryClient) });
};

export const useCreateGoal = () => useGoalMutation(async (body) => (await api.post('/user/goals', body, withZone())).data);

export const useUpdateGoal = () => useGoalMutation(async ({ id, ...body }) =>
    (await api.patch(`/user/goals/${id}`, body, withZone())).data);

export const useArchiveGoal = () => useGoalMutation((id) => api.delete(`/user/goals/${id}`));

/** The excuse: `{ id, days }` or `{ id, untilReturn: true }`. */
export const usePauseGoal = () => useGoalMutation(async ({ id, days, untilReturn }) =>
    (await api.post(`/user/goals/${id}/pause`, untilReturn ? { untilReturn: true } : { days }, withZone())).data);

export const useResumeGoal = () => useGoalMutation(async (id) =>
    (await api.delete(`/user/goals/${id}/pause`, withZone())).data);

/**
 * «أتمِمه الآن»: asks the backend for the day to credit, then marks this tab's reports about the
 * goal's programme or book with it until noon (lib/qada.js). Resolves to the credit day.
 */
export const useStartQada = () => useGoalMutation(async (goal) => {
    const { creditDay } = (await api.post(`/user/goals/${goal.id}/qada`, null, withZone())).data;
    startQada({
        goalId: goal.id,
        creditDay,
        seriesId: goal.kind === 'FINISH_SERIES' ? goal.targetId : null,
        bookId: goal.kind === 'FINISH_BOOK' ? goal.targetId : null,
    });
    return creditDay;
});

export const useCarry = () => useGoalMutation(async (id) => (await api.post(`/user/goals/${id}/carry`, null, withZone())).data);

/** The goal dialog's live preview — pace, the year's total, size advice. Writes nothing. */
export const useGoalPreview = (body, enabled) => useQuery({
    queryKey: ['goals', 'preview', body],
    queryFn: async () => (await api.post('/user/goals/preview', body, withZone())).data,
    enabled,
    staleTime: 60 * 1000,
    retry: false,
    // The last answer stays up while the next loads, so the box does not blink on every tap.
    placeholderData: keepPreviousData,
});
