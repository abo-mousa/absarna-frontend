import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';

/**
 * Presigned URLs for media held in object storage.
 *
 * Bytes are served directly by object storage, never by our backend — the backend's only role is
 * to run the visibility check and, if it passes, mint a signed URL. So the URL *is* the access
 * grant: a caller who may not see the item simply never receives one (the endpoint 404s, matching
 * the detail endpoint so a gated item is indistinguishable from a missing one).
 *
 * This replaces `useMediaToken`. That hook existed because the backend served gated bytes from its
 * own /uploads and /stream URLs and an <img>/<video> tag cannot attach an Authorization header, so
 * a short-lived token rode in the query string. A presigned URL carries its own signature, so
 * there is no credential to place there any more.
 */

// The signed URL is valid for hours (the backend picks the TTL so it outlives a full viewing
// session — a player re-requests on every seek, and an expired URL mid-playback is an opaque
// 403). Cached well inside that: refetching would change the URL, and swapping a <video>'s src
// mid-playback restarts it from zero.
const STALE_MS = 30 * 60 * 1000;

export const useVideoPlaybackUrl = (videoId, enabled = true) =>
    useQuery({
        queryKey: ['videoPlaybackUrl', videoId],
        queryFn: async () => {
            const { data } = await api.get(`/videos/${videoId}/playback-url`);
            return data.url;
        },
        enabled: Boolean(videoId) && enabled,
        staleTime: STALE_MS,
        gcTime: STALE_MS,
        retry: false, // a 404 here means "not visible to you", which retrying cannot change
    });

export const useBookReadUrl = (bookId, enabled = true) =>
    useQuery({
        queryKey: ['bookReadUrl', bookId],
        queryFn: async () => {
            const { data } = await api.get(`/books/${bookId}/read-url`);
            return data.url;
        },
        enabled: Boolean(bookId) && enabled,
        staleTime: STALE_MS,
        gcTime: STALE_MS,
        retry: false,
    });
