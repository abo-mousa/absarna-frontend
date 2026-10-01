import { keepPreviousData, useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { STANDARD } from '@/lib/queryCache';
import { queryKeys } from '@/lib/queryKeys';
import { readerTimeZone } from '@/lib/timeZone';
import { useUserScope } from './useUserScope';

/**
 * Choosing what a goal pursues (`pages/JourneyChoose`) — the backend's `GoalSuggestions` and
 * `GoalProposals`. Per reader (what they started is left out of every answer), so the SPA is the
 * cache; every key is under `goals`, so starting a goal refreshes them all.
 */

/** The browse shelves, narrowed to a field when one is given. */
export const useGoalSuggestions = (field, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.goalSuggestions(field || null, scope),
        queryFn: async () => (await api.get('/user/goals/suggestions', { params: { field: field || undefined } })).data,
        placeholderData: keepPreviousData,
        enabled,
        ...STANDARD,
    });
};

/** «ساعدني أختار»'s two questions: every field and subject with something filed under it. */
export const useGoalTopics = (enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.goalTopics(scope),
        queryFn: async () => (await api.get('/user/goals/topics')).data,
        enabled,
        ...STANDARD,
    });
};

/**
 * Every page of proposals up to `pages` (0-based, from the URL), so «أرني ثلاثة غيرها» adds three
 * below the ones already shown rather than replacing them — and Back, or a reload, rebuilds the
 * same list. Each page is the same query `useGoalProposals` makes, so the cache is shared.
 */
export const useGoalProposalPages = ({ subject, minutes, deadline, pages }, enabled = true) => {
    const scope = useUserScope();
    const results = useQueries({
        queries: Array.from({ length: pages + 1 }, (_, page) => ({
            queryKey: queryKeys.goalProposals(subject || null, minutes, deadline || null, page, scope),
            queryFn: async () => (await api.get('/user/goals/proposals', {
                params: { subject: subject || undefined, minutes, deadline: deadline || undefined, page, tz: readerTimeZone() },
            })).data,
            enabled,
            ...STANDARD,
        })),
    });
    const loaded = results.filter((result) => result.data).map((result) => result.data);
    const last = results[results.length - 1];
    return {
        proposals: loaded.flatMap((data) => data.proposals || []),
        widened: loaded.some((data) => data.widened),
        hasMore: !!last?.data?.hasMore,
        isLoading: results[0]?.isLoading,
        isLoadingMore: results.length > 1 && !!last?.isLoading,
        isError: results.some((result) => result.isError),
        error: results.find((result) => result.error)?.error,
        refetch: () => results.forEach((result) => result.isError && result.refetch()),
    };
};

/** Channels to choose from, largest first, narrowed to a field and, with `q`, to names holding it. */
export const useGoalChannels = (field, q = '', enabled = true) => {
    const scope = useUserScope();
    return useInfiniteQuery({
        queryKey: queryKeys.goalChannels(field || null, q || null, scope),
        queryFn: async ({ pageParam = 0 }) => (await api.get('/user/goals/channels', {
            params: { field: field || undefined, page: pageParam, q: q || undefined },
        })).data,
        placeholderData: keepPreviousData,
        initialPageParam: 0,
        getNextPageParam: (last) => (last.hasNext ? last.currentPage + 1 : undefined),
        enabled,
        ...STANDARD,
    });
};

/**
 * Any programme or book on the site by what the reader types — the site's own search (its
 * visibility rules included), grouped by series, and the books listing's search.
 */
export const useGoalSearch = (q) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.goalSearch(q, scope),
        enabled: q.length >= 2,
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const [videos, books] = await Promise.all([
                api.get('/search', { params: { q, size: 24 } }).then((res) => res.data?.content || []),
                api.get('/books', { params: { search: q, size: 6 } }).then((res) => res.data?.content || []),
            ]);
            const series = new Map();
            for (const video of videos) {
                if (video.seriesId && !series.has(video.seriesId)) {
                    series.set(video.seriesId, {
                        kind: 'FINISH_SERIES', targetId: video.seriesId, title: video.seriesTitle || video.title,
                        channelName: video.channelName, channelSlug: video.channelSlug, firstEpisode: video,
                    });
                }
            }
            return [
                ...[...series.values()].slice(0, 8),
                ...books.map((book) => ({ kind: 'FINISH_BOOK', targetId: book.id, title: book.title, pages: book.pages, book })),
            ];
        },
        ...STANDARD,
    });
};

// ============ The owner's side: inferred subjects to confirm ============

/** `{ total, pending }` — the series whose inferred subject waits for the owner's answer. */
export const useSubjectReview = (slug, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.subjectReview(slug, scope),
        queryFn: async () => (await api.get(`/channels/${slug}/content/subject-review`)).data,
        enabled: enabled && !!slug,
        ...STANDARD,
    });
};

/** `{ seriesId, decision: CONFIRM | CHANGE | NONE, subject? }`. */
export const useAnswerSubjectReview = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ seriesId, decision, subject }) =>
            (await api.post(`/channels/${slug}/content/subject-review/${seriesId}`, { decision, subject })).data,
        // The series lists carry the subject too, and share the prefix.
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channel-series-manage', slug] }),
    });
};

/** Confirms several high-confidence answers at once → `{ confirmed: [seriesId…] }`. */
export const useConfirmSubjectReviews = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (seriesIds) =>
            (await api.post(`/channels/${slug}/content/subject-review/confirm`, { seriesIds })).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channel-series-manage', slug] }),
    });
};

/** Takes back the caller's last answer; `previous` is the field the series had before, or null. */
export const useUndoSubjectReview = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ seriesId, previous }) =>
            (await api.post(`/channels/${slug}/content/subject-review/${seriesId}/undo`, { previous: previous || null })).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channel-series-manage', slug] }),
    });
};
