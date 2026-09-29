import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

/**
 * Admin outreach (`/api/admin/outreach`): one personal letter at a time to somebody without an
 * account — an influencer, a scholar with no YouTube channel, a reader.
 *
 * <p>Every call that names an address sends it in a POST body, never a query string: the reverse
 * proxy's access log records query strings, and an outreach address is a stranger's.
 */

/** The starter letters in `locale`, placeholders left in, plus the placeholders a letter may name. */
export const useOutreachStarters = (locale) =>
    useQuery({
        queryKey: ['outreach-starters', locale],
        queryFn: async () => (await api.get('/admin/outreach/starters', { params: { locale } })).data,
        staleTime: Infinity,
    });

/**
 * The letter rendered exactly as it would be sent, and not sent. A query keyed by the letter
 * rather than a mutation fired on each change: two renders in flight would land in whichever
 * order the network chose, and the older one could overwrite the newer on screen. A query keyed
 * by its body always shows the answer to the letter as it is now, and keeps the last one up
 * while the next loads.
 */
export const useOutreachPreview = (letter, enabled) =>
    useQuery({
        queryKey: ['outreach-preview', letter],
        queryFn: async () => (await api.post('/admin/outreach/preview', letter)).data,
        enabled,
        staleTime: 60_000,
        retry: false,
        placeholderData: keepPreviousData,
    });

/** The letter to the admin's own inbox — unlogged, outside the daily cap, to read in a real client. */
export const useSendOutreachTest = () =>
    useMutation({
        mutationFn: (letter) => api.post('/admin/outreach/test', letter),
    });

/**
 * What is known about an address before writing to it: on the do-not-contact list, already has an
 * account, and who wrote to it before. A query keyed by the address, so re-typing one is free.
 */
export const useOutreachLookup = (email) =>
    useQuery({
        queryKey: ['outreach-lookup', email],
        queryFn: async () => (await api.post('/admin/outreach/lookup', { email })).data,
        enabled: Boolean(email),
        placeholderData: keepPreviousData,
    });

export const useSendOutreach = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (body) => (await api.post('/admin/outreach/send', body)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['outreach-log'] });
            queryClient.invalidateQueries({ queryKey: ['outreach-lookup'] });
        },
    });
};

export const useOutreachLog = (page) =>
    useQuery({
        queryKey: ['outreach-log', page],
        queryFn: async () => (await api.get('/admin/outreach', { params: { page, size: 20 } })).data,
        placeholderData: keepPreviousData,
    });

export const useDoNotContact = (page) =>
    useQuery({
        queryKey: ['outreach-dnc', page],
        queryFn: async () =>
            (await api.get('/admin/outreach/do-not-contact', { params: { page, size: 20 } })).data,
        placeholderData: keepPreviousData,
    });

const invalidateLists = (queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['outreach-dnc'] });
    queryClient.invalidateQueries({ queryKey: ['outreach-lookup'] });
};

export const useAddDoNotContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ email, note }) =>
            (await api.post('/admin/outreach/do-not-contact', { email, note })).data,
        onSuccess: () => invalidateLists(queryClient),
    });
};

export const useRemoveDoNotContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (email) => api.post('/admin/outreach/do-not-contact/remove', { email }),
        onSuccess: () => invalidateLists(queryClient),
    });
};
