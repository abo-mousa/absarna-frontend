import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';
import { currentLocale } from '@/i18n';

/**
 * The owner's confirmation that an imported catalogue's titles and descriptions are their own.
 *
 * <p><b>Why the platform asks at all.</b> Titles read through the YouTube Data API may only be
 * stored for 30 days, and this platform keeps them indefinitely on purpose — the importer adds and
 * never edits, because an owner may have corrected a title here and a nightly overwrite would undo
 * that silently. The way out is provenance rather than deletion: the owner wrote those titles, so
 * when they read them and affirm them, what we hold is their submission rather than our cache of
 * someone else's data. The backend records each affirmation with a snapshot of the text; see
 * `content/adoption` in absarna-backend.
 *
 * <p><b>Two queries under one key prefix, deliberately.</b> The progress counts and the page of
 * rows awaiting confirmation always move together — confirming a page changes both — and the one
 * state worth designing out is a panel reading «١٨٤٧ متبقٍ» beside a list that has already lost
 * them. `queryKeys.channelAdoptionPending` nests under `channelAdoption`, so one invalidation
 * covers both.
 */

/**
 * Progress for the panel line: how many rows carry imported metadata, how many are confirmed, and
 * whether this owner may confirm at all.
 *
 * <p>`canAdopt` is false on a channel a platform admin linked on the owner's behalf: confirming
 * requires the owner's own proof, so the panel explains the missing step instead of letting them
 * press a button that would be refused. Polls nothing — every number here moves only when the
 * owner acts, or when a daily refresh adds rows, and neither is worth a timer.
 */
export const useAdoptionProgress = (slug, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.channelAdoption(slug, scope),
        // `?locale=` is what the affirmation's wording and its recorded VERSION are both chosen
        // by, and it is deliberately this browser's active locale rather than the account's: the
        // record's claim is that the owner read the words on their screen. The confirm below
        // sends the same value, so the string displayed and the string recorded cannot disagree.
        queryFn: async () => (await api.get(`/channels/${slug}/youtube/adoption`,
            { params: { locale: currentLocale() } })).data,
        enabled: Boolean(slug) && enabled,
        retry: false,
    });
};

/**
 * One page of videos awaiting confirmation.
 *
 * <p>The backend pages these at 20 rather than the 50 its other owner lists use, because every row
 * here has to be read for the confirmation to mean anything and an imported description is rarely
 * a paragraph. The page size is left to the backend's default on purpose: it is a property of how
 * much text a person can actually read, which belongs with the endpoint that knows what is in the
 * rows.
 *
 * <p><b>`placeholderData` keeps the previous page on screen while the next loads.</b> Without it
 * the list empties to a spinner between pages, and an owner working through a catalogue of
 * thousands sees that flash on every single confirmation.
 */
export const useAdoptionPending = (slug, page = 0, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.channelAdoptionPending(slug, page, scope),
        queryFn: async () =>
            (await api.get(`/channels/${slug}/youtube/adoption/pending`, { params: { page } })).data,
        enabled: Boolean(slug) && enabled,
        placeholderData: (previous) => previous,
        retry: false,
    });
};

/**
 * Confirms the videos on one page.
 *
 * <p>Sends ids and nothing else: the snapshot, the affirmer and the channel's proof are all read
 * server-side from the rows themselves, so this side cannot tell the record what was on screen.
 *
 * <p>Invalidates the whole `channel-adoption` prefix rather than writing the response into the
 * cache. The response carries the new counts, but the *page* has changed shape underneath it —
 * every row just confirmed has left the awaiting queue, so the rows behind them have moved up into
 * this page number. Patching the counts and keeping the stale list is exactly the half-updated
 * view this is avoiding.
 */
export const useAdoptMetadata = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (videoIds) =>
            (await api.post(`/channels/${slug}/youtube/adoption`, { videoIds },
                { params: { locale: currentLocale() } })).data,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['channel-adoption', slug] }),
    });
};
