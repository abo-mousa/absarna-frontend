/**
 * The rule that bounds how often a failed lazy chunk may reload the page.
 *
 * <p>Split out of `App.jsx` so it can be tested as a plain function — the repo's preference over
 * standing up jsdom to drive a `useEffect`, and this is a guard whose whole value is the case
 * nobody reproduces by hand (a chunk that is missing permanently rather than stale).
 */

/**
 * When the last preload-triggered reload was fired, as an epoch-millisecond string.
 *
 * <p>Session storage, not local: it must survive the reload it is guarding (which is the whole
 * point — a page-level variable is gone by the time it would be read) and nothing beyond the tab.
 * Reached through `safeSessionStorage` at the call site, because a browser blocking site data
 * throws on the accessor itself.
 *
 * <p>The name is historical: it held `'1'` when it was a flag rather than a timestamp. An old
 * value left in a tab from a previous build parses as NaN and is treated as "no reload recorded",
 * which allows one reload — the same answer a fresh tab gets.
 */
export const PRELOAD_RELOAD_FLAG = 'absarna.preload-reload';

/**
 * How long after a reload another one is refused.
 *
 * <p>Long enough that a chunk which is genuinely gone cannot reload in a loop — the reload, the
 * boot and the first navigation back to the broken route all land well inside it — and short
 * enough that a tab left open across two separate deploys still gets its own repair for the
 * second one.
 */
export const PRELOAD_RELOAD_COOLDOWN_MS = 30_000;

/**
 * Whether a `vite:preloadError` may reload the page right now.
 *
 * <p><b>This exists because the previous guard did nothing.</b> It cleared its flag on mount and
 * set it immediately before `window.location.reload()` — but a reload remounts the app, so the
 * clear ran again on the way back up and the flag was never once observed to be set. A chunk that
 * was stale (the case the handler is for) got its one reload either way, so the guard looked
 * correct; a chunk that was permanently missing — a half-uploaded deploy, a proxy answering a
 * `.js` request with HTML — reloaded forever, and nothing in the loop ever rendered long enough
 * to show the error boundary or to let anyone read a console.
 *
 * <p>A timestamp rather than a flag is what survives the remount: the value is written before the
 * reload and is still there when the reloaded app reads it, so the second failure inside the
 * window is refused and the error is left to surface.
 *
 * @param stored what `PRELOAD_RELOAD_FLAG` currently holds (a string, or null)
 * @param now    `Date.now()`
 */
export const mayReloadAfterPreloadError = (stored, now) => {
    const last = Number(stored);
    // Nothing recorded, or something unreadable (an old `'1'`, a value another script wrote): the
    // failure mode of guessing "may reload" here is one extra reload, and of guessing the other
    // way it is a stale tab that never repairs itself. One reload is the cheaper mistake.
    if (!stored || !Number.isFinite(last) || last <= 0) return true;
    // A stamp in the future means the clock moved — a manual change, or a laptop resuming with a
    // corrected time. Treating it as expired costs at most one more reload, whereas honouring it
    // could suppress the repair for as long as the clock is wrong.
    if (last > now) return true;
    return now - last >= PRELOAD_RELOAD_COOLDOWN_MS;
};
