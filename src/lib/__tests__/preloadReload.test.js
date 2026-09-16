import { describe, expect, it } from 'vitest';
import {
    PRELOAD_RELOAD_COOLDOWN_MS,
    mayReloadAfterPreloadError,
} from '@/lib/preloadReload';

/**
 * The guard that stops a missing chunk reloading the page forever.
 *
 * <p>The bug this pins: the previous guard cleared its flag on mount and set it immediately before
 * reloading, and a reload remounts the app — so the clear ran again and the flag was never once
 * observed set. The stale-chunk case (one reload, then success) looked identical either way, which
 * is why it survived review; the permanently-missing case reloaded until the tab was closed, and
 * nothing rendered long enough to show the error boundary or to let anyone read the console.
 *
 * <p>So the assertion that matters is the second one: a value written a moment ago must refuse.
 */
describe('mayReloadAfterPreloadError', () => {
    const NOW = 1_700_000_000_000;

    it('allows the first reload, with nothing recorded', () => {
        expect(mayReloadAfterPreloadError(null, NOW)).toBe(true);
        expect(mayReloadAfterPreloadError('', NOW)).toBe(true);
    });

    it('refuses a second reload inside the cooldown', () => {
        // The whole point. This is the state the reloaded app comes back up in, and the previous
        // implementation could not reach it at all.
        expect(mayReloadAfterPreloadError(String(NOW), NOW)).toBe(false);
        expect(mayReloadAfterPreloadError(String(NOW - 1), NOW)).toBe(false);
        expect(mayReloadAfterPreloadError(String(NOW - PRELOAD_RELOAD_COOLDOWN_MS + 1), NOW)).toBe(false);
    });

    it('allows one again once the cooldown has passed', () => {
        // A tab left open across two deploys still repairs itself for the second one.
        expect(mayReloadAfterPreloadError(String(NOW - PRELOAD_RELOAD_COOLDOWN_MS), NOW)).toBe(true);
        expect(mayReloadAfterPreloadError(String(NOW - 60 * 60 * 1000), NOW)).toBe(true);
    });

    it('treats an unreadable value as no reload recorded', () => {
        // Including the '1' the old flag wrote: a tab carrying one from a previous build must
        // still get its repair, not be locked out of reloading forever.
        expect(mayReloadAfterPreloadError('1', NOW)).toBe(true);
        expect(mayReloadAfterPreloadError('not-a-number', NOW)).toBe(true);
        expect(mayReloadAfterPreloadError('0', NOW)).toBe(true);
    });

    it('does not honour a stamp from the future', () => {
        // A clock that moved must cost at most one extra reload, never a tab that can no longer
        // repair itself for as long as the clock is wrong.
        expect(mayReloadAfterPreloadError(String(NOW + 60_000), NOW)).toBe(true);
    });
});
