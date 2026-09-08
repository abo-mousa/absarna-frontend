/**
 * Route knowledge that more than one place needs and that must not drift between them.
 */

/**
 * The routes `App.jsx` wraps in `ProtectedRoute`. Kept here rather than derived from the router
 * because `AuthContext` needs the answer outside any `<Routes>` — when a session expires it has to
 * decide whether the current page is one the visitor may keep reading.
 */
const PROTECTED_PATTERNS = [
    /^\/profile(\/|$)/,
    /^\/subscriptions(\/|$)/,
    /^\/history(\/|$)/,
    /^\/bookmarks(\/|$)/,
    /^\/admin(\/|$)/,
    /^\/create-channel(\/|$)/,
    /^\/channel\/[^/]+\/manage(\/|$)/,
];

export const isProtectedPath = (pathname) =>
    typeof pathname === 'string' && PROTECTED_PATTERNS.some((pattern) => pattern.test(pathname));

/**
 * A path the app may navigate to after login, or `null`.
 *
 * <p>Return-to destinations come from router state, which is not attacker-controlled today — but
 * the check is what keeps that true if the value ever arrives from a query string: only a
 * same-origin, root-relative path is accepted. `//evil.example` is a protocol-relative URL and
 * `/\evil.example` is treated the same way by browsers, so both are rejected along with anything
 * carrying a scheme.
 */
export const safeInternalPath = (path) => {
    if (typeof path !== 'string' || path.length === 0) return null;
    if (!path.startsWith('/')) return null;
    if (path.startsWith('//') || path.startsWith('/\\')) return null;
    if (/^\/[^/?#]*:/.test(path)) return null;
    return path;
};
