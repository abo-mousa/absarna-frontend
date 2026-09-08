/**
 * Query keys for everything the cache holds that belongs to *a particular viewer*.
 *
 * <p>The cache used to have no notion of whose data it held. `['watch-history']`,
 * `['bookmarks']`, `['my-channels']`, `['like-status', …]` and the rest were keyed by resource
 * alone, and nothing cleared them on logout — so on a shared device the next person to log in saw
 * the previous person's progress bars, owner controls, likes and history until each stale window
 * ran out. Even signed out, `useLikeStatus` kept serving `liked: true` from the cache.
 *
 * <p>Two fixes, and both are needed. `AuthContext` clears the whole cache on logout and session
 * expiry, which handles the sequential case. These keys carry the viewer's identity as their
 * <b>last</b> segment, which handles everything else: a login without a logout in between, the
 * anonymous → signed-in transition on a like button, and any future persistence of the cache.
 *
 * <p><b>The scope is the last segment, never the second</b>, so every existing prefix
 * invalidation — `['channel-manage', slug]`, `['bookmarks']`, `['subscription-status']` — keeps
 * matching every viewer's copy. Only the sites that read or write one exact entry
 * (`setQueryData`, `getQueryData`) need the scope, and they are the ones that have it.
 *
 * <p>Public catalogue keys (`['video', id]`, `['channel', slug]`, `['books', size]` …) are
 * deliberately not here: they are the same for everyone and are what a persisted cache would
 * keep across sessions.
 */

/**
 * The viewer's identity as seen by the cache: the JWT's subject (the username, stored in the
 * token exactly as the backend holds it), or `null` for an anonymous visitor.
 *
 * <p>Read off the token rather than off `user`, because `user` is `null` while the profile fetch
 * is in flight on every page load — keying on it would run each query twice per load (once under
 * `null`, once under the id) and briefly serve anonymous answers to a signed-in viewer. The token
 * is there synchronously from the first render.
 *
 * <p>A token whose payload cannot be decoded still yields a per-session scope rather than falling
 * back to anonymous — falling back would be the leak this exists to close.
 */
export const userScopeOf = (token) => {
    if (!token || typeof token !== 'string') return null;
    try {
        const payload = token.split('.')[1];
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const subject = JSON.parse(json)?.sub;
        if (typeof subject === 'string' && subject) return subject;
    } catch {
        /* not a JWT we can read */
    }
    return `token:${token.slice(-24)}`;
};

export const queryKeys = {
    // ---- the viewer's own lists ----
    feed: (scope) => ['feed', scope],
    watchHistory: (scope) => ['watch-history', scope],
    readingHistory: (scope) => ['reading-history', scope],
    bookmarks: (scope) => ['bookmarks', scope],
    subscriptions: (scope) => ['subscriptions', scope],
    myChannels: (scope) => ['my-channels', scope],

    // ---- per-item state that depends on who is asking ----
    bookmarkStatus: (itemType, id, scope) => ['bookmark-status', itemType, id, scope],
    likeStatus: (itemType, id, scope) => ['like-status', itemType, id, scope],
    subscriptionStatus: (channelId, scope) => ['subscription-status', channelId, scope],
    bookReadProgress: (bookId, scope) => ['book-read-progress', bookId, scope],

    // ---- owner dashboard ----
    channelManage: (slug, type, scope) => ['channel-manage', slug, type, scope],
    channelSeriesManage: (slug, scope) => ['channel-series-manage', slug, scope],
    channelComments: (slug, size, scope) => ['channel-comments', slug, size, scope],
    channelYouTube: (slug, scope) => ['channel-youtube', slug, scope],

    // ---- platform admin ----
    adminStats: (scope) => ['admin-stats', scope],
    adminBooks: (scope) => ['admin-books', scope],
    adminArticles: (scope) => ['admin-articles', scope],
    adminBiography: (scope) => ['admin-biography', scope],
    adminPendingChannels: (scope) => ['admin-pending-channels', scope],
    adminAllChannels: (scope) => ['admin-all-channels', scope],
};

export default queryKeys;
