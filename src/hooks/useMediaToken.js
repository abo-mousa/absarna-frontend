import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';

// A short-lived, media-only credential for the `?token=` query param on /uploads and /stream
// URLs (see lib/media.js's resolveMediaUrl, and JwtUtil.generateMediaToken on the backend).
//
// This exists because those components used to put the **session** token there — the same JWT
// that authenticates every API call, valid for a day. A query param is not a private place: it
// lands in the API's own access logs, in every proxy/CDN log between here and there, and in the
// browser's history. A media token can only fetch a file, is rejected on every other route and
// from the Authorization header, and expires within the hour.
//
// `required` gates the request: only a hidden (or suspended-channel) item's file needs a token
// at all, so an ordinary public thumbnail never triggers this call. Callers should also hold
// off rendering the media until the token arrives when it's required — otherwise the first
// paint fires a tokenless request that 404s, and an <img onError> handler would latch that
// failure permanently.
//
// Deliberately no refetchInterval: a refreshed token would change the resolved URL, and
// swapping a <video>'s src mid-playback restarts it from zero. The token is fetched once and
// held stable for as long as the component is mounted, which is why the backend's TTL is set
// long enough to cover playing a full-length lecture rather than the few minutes a
// single-request credential would need.

// Used only if the backend ever stops sending expiresInSeconds.
const ASSUMED_TTL_SECONDS = 600;

// Treat the token as stale this long before it actually expires, so a remount close to the
// boundary refetches rather than handing out a token that dies mid-request.
const REFRESH_MARGIN_SECONDS = 60;

const freshFor = (query) => {
    const ttl = query.state.data?.expiresInSeconds ?? ASSUMED_TTL_SECONDS;
    return Math.max(ttl - REFRESH_MARGIN_SECONDS, 30) * 1000;
};

export const useMediaToken = (required = true) => {
    const { token: sessionToken } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ['media-token'],
        queryFn: async () => {
            const res = await api.get('/user/media-token');
            return res.data ?? null;
        },
        // Anonymous callers can't have one, and can only ever see public files anyway.
        enabled: required && !!sessionToken,
        staleTime: freshFor,
        // Overrides the app-wide refetchOnMount: false — a token that has aged past staleTime
        // between page views has to be replaced, unlike ordinary cached content.
        refetchOnMount: true,
        // A failed token fetch just means media stays as it would have been without one; no
        // point retrying and delaying the render further.
        retry: false,
    });

    return {
        mediaToken: data?.token ?? null,
        // True only while a token is genuinely needed and hasn't arrived — the signal for
        // "don't render the media element yet".
        isLoading: required && !!sessionToken && isLoading,
    };
};
