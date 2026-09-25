import { useIsFetching, useIsMutating } from '@tanstack/react-query';

/**
 * True for exactly as long as the app is loading or saving anything — the one rule for when the
 * logo moves. Every mark already on screen (the navbar's, the guide's) turns while this is true
 * and is still otherwise: a logo that animates with nothing happening says "loading" and lies.
 * `useIsFetching` counts reads and `useIsMutating` writes; both re-render only when their count
 * crosses zero.
 */
export function useAppBusy() {
    return useIsFetching() + useIsMutating() > 0;
}
