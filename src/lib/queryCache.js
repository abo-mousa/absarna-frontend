/**
 * Named cache tiers, so "how long is this good for" is a decision with a reason attached rather
 * than a number copied from the query above it.
 *
 * <p>These exist because the app's defaults were `staleTime: 10min` **and**
 * `refetchOnMount: false`, which together mean stale data is never refetched at all — navigating
 * away and back showed exactly what you left, indefinitely. That is invisible on a small
 * catalogue and became "the feed is always the same" on a large one.
 *
 * <p>`refetchOnWindowFocus` stays off everywhere. Reshuffling a page under someone who just
 * tabbed back is disorienting in a way that refreshing on navigation is not — they did not ask
 * for it, and they may be halfway down the page.
 */

/**
 * Never cached. Every mount is a fresh request.
 *
 * <p>For responses that are *supposed* to differ each time. The feed's discover section is
 * randomised server-side precisely so a return visit shows something else; caching it makes that
 * randomisation invisible and the home page static.
 */
export const NO_CACHE = {
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
};

/**
 * Things the user themselves just changed, or that others change while they watch — comments,
 * bookmarks, history, an import's progress. Short enough that their own action is reflected,
 * long enough that a re-render is not a request.
 */
export const LIVE = {
    staleTime: 10 * 1000,
    refetchOnMount: true,
};

/**
 * The default: content listings, channel pages, search. New content appears on a human timescale,
 * not a per-second one, but a two-minute-old list should not survive a navigation.
 */
export const STANDARD = {
    staleTime: 2 * 60 * 1000,
    refetchOnMount: true,
};

/**
 * Things that essentially do not change within a session — the category list, the biography page.
 * Refetching these on every navigation is pure waste.
 */
export const STATIC = {
    staleTime: 60 * 60 * 1000,
    refetchOnMount: false,
};
