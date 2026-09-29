import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

// Every listing here is admin-only, so it is user-scoped for the same reason the viewer's own
// lists are: it must not survive a logout into the next person's session. The scope is the last
// key segment, so the invalidations below stay prefix matches and need no scope of their own.
//
// The book, article and biography mutations that used to live here had no caller left — the
// admin CRUD screens they served were removed long ago and the hooks stayed behind. Gone.

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

// ============ USERS ============

/** One page of accounts, narrowed by a username-or-email substring. */
export const useAdminUsers = (search = '', page = 0, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.adminUsers(search, page, scope),
        queryFn: async () => {
            const params = { page, size: 20 };
            if (search) params.search = search;
            return (await api.get('/admin/users', { params })).data;
        },
        enabled,
        placeholderData: keepPreviousData,
        staleTime: 30 * 1000,
    });
};

/** One account: who they are, the channels they own, what they reported and how it ended. */
export const useAdminUser = (id) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.adminUser(id, scope),
        queryFn: async () => (await api.get(`/admin/users/${id}`)).data,
        enabled: !!id,
        staleTime: 30 * 1000,
    });
};

export const useUpdateUserRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, role }) => (await api.put(`/admin/users/${id}/role`, { role })).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-user'] });
        },
    });
};

// ============ CHANNEL DECISIONS ============

/** Every recorded approve / reject / suspend of one channel, newest first. */
export const useChannelStatusHistory = (channelId, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.adminChannelStatusHistory(channelId, scope),
        queryFn: async () => (await api.get(`/channels/admin/${channelId}/status-history`)).data,
        enabled: enabled && !!channelId,
        staleTime: 30 * 1000,
    });
};

/**
 * One page of the metadata affirmations recorded on one channel, newest first — the audit an
 * admin hands to whoever asks. Rows are under `records`; `totalItems` is the whole record's size.
 */
export const useAdoptionAudit = (slug, page = 0, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.adminAdoptionAudit(slug, page, scope),
        queryFn: async () => (await api.get(`/channels/${slug}/youtube/adoption/audit`, { params: { page, size: 20 } })).data,
        enabled: enabled && !!slug,
        staleTime: 60 * 1000,
        // The previous page stays up while the next loads — but only within one channel, or
        // opening the audit of a second channel would show the first one's records under its name.
        placeholderData: (previous, previousQuery) => (previousQuery?.queryKey?.[1] === slug ? previous : undefined),
    });
};
