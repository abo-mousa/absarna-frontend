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

/**
 * How long until the backend's day ends, measured from `fromMs`.
 *
 * <p>The backend's day is its own `LocalDate.now()` and the servers run in UTC
 * (`absarna-backend/infra/deployment.md`), so the day ends at UTC midnight — not at the reader's.
 * A reader in Riyadh gets a fresh feed at 03:00 local, which is when the feed actually changes.
 */
export const msUntilServerMidnight = (fromMs) => {
    const next = new Date(fromMs);
    next.setUTCHours(24, 0, 0, 0);
    return next.getTime() - fromMs;
};

/** How long until the reader's own midnight, in the browser's time zone. */
const msUntilLocalMidnight = (fromMs) => {
    const next = new Date(fromMs);
    next.setHours(24, 0, 0, 0);
    return next.getTime() - fromMs;
};

/**
 * How long until the reader's next local `hour:00` — the first one strictly after `fromMs`.
 */
const msUntilLocalHour = (fromMs, hour) => {
    const next = new Date(fromMs);
    next.setHours(hour, 0, 0, 0);
    if (next.getTime() <= fromMs) next.setDate(next.getDate() + 1);
    return next.getTime() - fromMs;
};

/**
 * How long until any of Today's days ends — the backend's (UTC), the reader's calendar day, or the
 * reader's LEARNING day. Today needs all of them: its feed row is seeded by the backend's day,
 * «أسبوعك» and «برامج جديدة» turn over at the reader's midnight (the SPA sends `?tz=`), and every
 * portion's state is decided by the learning day, which turns at 03:00 local (`LearningDay`) — a
 * copy fetched at 01:30 still says last night's portion is done, and without this bound it stayed
 * fresh until the next UTC midnight. Noon is the fourth edge: the make-up offer closes and the
 * carry-over opens there (`GoalService.assemble`). Whichever comes first makes the copy wrong.
 */
export const msUntilDayEnds = (fromMs) => Math.min(
    msUntilServerMidnight(fromMs),
    msUntilLocalMidnight(fromMs),
    msUntilLocalHour(fromMs, 3),
    msUntilLocalHour(fromMs, 12),
);

/**
 * Good until the day ends — for per-reader responses the backend builds fresh on every request
 * and that change within a day only because the reader did something. Today is the case. The
 * backend deliberately does not cache per-reader answers (only what is the same for everybody),
 * so this is where they are kept.
 *
 * <p>Each copy goes stale at the first midnight after it was FETCHED. What changes the answer
 * inside a day is the reader's own action, and each such action invalidates the key — a watch, a
 * page read, a hide, a follow, clearing history. This tier is only as correct as those
 * invalidations.
 *
 * <p>`gcTime` covers the longest possible remaining day, so an unmounted copy is not thrown away
 * before it goes stale — the app-wide 30 minutes would bring back a request on every return.
 */
export const UNTIL_DAY_ENDS = {
    staleTime: (query) => msUntilDayEnds(query.state.dataUpdatedAt || Date.now()),
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: true,
};

/**
 * The home feed's (Discover's) tier. Its random parts are fixed for the day and the page load (the
 * shuffle is not in the query key, so a refetch inside one load returns the same row), but the catalogue is
 * not — a followed channel's new upload belongs in its subscribed section the same day — so it
 * is kept for a quarter of an hour rather than until midnight: long enough that browsing a few
 * videos and coming back costs nothing, short enough that a new lecture is not a day late.
 */
export const FEED = {
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
};
