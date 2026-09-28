import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { STANDARD } from '@/lib/queryCache';
import { queryKeys } from '@/lib/queryKeys';
import { readerTimeZone } from '@/lib/timeZone';
import { invalidateProgress } from './useGoals';
import { useUserScope } from './useUserScope';

/** The progress tab's reads (`/api/user/progress/*`) and the Friday review. */
const withZone = (params = {}) => ({ params: { tz: readerTimeZone(), ...params } });

export const useProgressOverview = () => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.progressOverview(scope),
        queryFn: async () => (await api.get('/user/progress/overview', withZone())).data,
        ...STANDARD,
    });
};

export const useMilestones = () => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.progressMilestones(scope),
        queryFn: async () => (await api.get('/user/progress/milestones', withZone())).data,
        ...STANDARD,
    });
};

export const useCompletions = (enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.progressCompletions(scope),
        queryFn: async () => (await api.get('/user/progress/completions', { params: { size: 50 } })).data,
        enabled,
        ...STANDARD,
    });
};

export const useWeeklyReview = (enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.weeklyReview(scope),
        queryFn: async () => (await api.get('/user/review/current', withZone())).data,
        enabled,
        ...STANDARD,
    });
};

export const useSaveReview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ weekStart, ...body }) => (await api.put(`/user/review/${weekStart}`, body, withZone())).data,
        onSuccess: () => invalidateProgress(queryClient),
    });
};

/** The record tab's charts: the year as 52 week-stars, the last weeks' minutes, the time of day. */
export const useProgressYear = () => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.progressYear(scope),
        queryFn: async () => (await api.get('/user/progress/year', withZone())).data,
        ...STANDARD,
    });
};

export const useProgressWeeks = (count = 12) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.progressWeeks(count, scope),
        queryFn: async () => (await api.get('/user/progress/weeks', withZone({ count }))).data,
        ...STANDARD,
    });
};

export const useProgressSlots = (days = 30) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.progressSlots(days, scope),
        queryFn: async () => (await api.get('/user/progress/slots', withZone({ days }))).data,
        ...STANDARD,
    });
};
