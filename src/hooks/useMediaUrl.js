import { keepPreviousData, useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { safeExternalUrl } from '@/lib/media';

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

/**
 * Returns the whole payload, not just the URL: `{ url, quality, qualities, format }`.
 *
 * `format` is `'hls'` or `'progressive'`, and the player needs it before it can decide anything:
 * an HLS URL goes to hls.js outside Safari and to the <video> tag inside it, while a progressive
 * MP4 goes straight to the tag everywhere. It is reported rather than inferred because both
 * shapes are legitimately reachable — a video transcoded before the HLS migration still serves a
 * `v1/` MP4 ladder, and the pre-transcode fallback always does.
 *
 * `qualities` is the rendition ladder's names, which is everything a selector needs — object
 * keys never leave the backend. **Under HLS it is no longer the whole selector**: the video
 * variants come from master.m3u8, which is what the player can actually switch between without
 * reloading, and this list contributes the audio rung, which is deliberately not in that
 * manifest. `quality` is the rung actually being served, and is null for a master playlist —
 * correctly, since no single rung was served.
 *
 * `quality` is part of the query key, so each rung is cached separately and switching back to
 * one already fetched is instant. `placeholderData: keepPreviousData` is what makes switching
 * usable at all — without it the query goes undefined mid-flight, the caller falls back to its
 * loading state, and the <video> element unmounts, taking the playhead with it.
 */
export const useVideoPlaybackUrl = (videoId, enabled = true, quality = null) =>
    useQuery({
        queryKey: ['videoPlaybackUrl', videoId, quality],
        queryFn: async () => {
            const { data } = await api.get(`/videos/${videoId}/playback-url`, {
                params: quality ? { quality } : undefined,
            });
            return data;
        },
        enabled: Boolean(videoId) && enabled,
        placeholderData: keepPreviousData,
        staleTime: STALE_MS,
        gcTime: STALE_MS,
        retry: false, // a 404 here means "not visible to you", which retrying cannot change
    });

/**
 * The book's file URL — a presigned GET for an uploaded PDF, or the book's own external link for
 * one hosted elsewhere.
 *
 * **Passed through `safeExternalUrl`, and that is not belt-and-braces.** Every caller renders this
 * as something the browser navigates to: an `href` on the detail page, a `location.replace` on the
 * card, `<Document file>` in the reader. The external branch is a value someone typed into the
 * database, and while the backend now allowlists the scheme both on write (`SafeUrl`'s `@Pattern`)
 * and on read, `sourceUrl` gets the same treatment here for exactly this reason — the guard
 * belongs at the point of render, where the consequence is, rather than only at the two points
 * that happen to write and serve it today. Anything not absolute http(s) becomes null and the
 * callers already render their no-file state for that.
 */
export const useBookReadUrl = (bookId, enabled = true) =>
    useQuery({
        queryKey: ['bookReadUrl', bookId],
        queryFn: async () => {
            const { data } = await api.get(`/books/${bookId}/read-url`);
            return safeExternalUrl(data.url);
        },
        enabled: Boolean(bookId) && enabled,
        staleTime: STALE_MS,
        gcTime: STALE_MS,
        retry: false,
    });
