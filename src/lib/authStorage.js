import { safeSessionStorage, safeStorage } from './safeStorage';

const TOKEN_KEY = 'token';
const REFRESH_KEY = 'refreshToken';

/**
 * Where the session's token pair lives, and for how long.
 *
 * <p><b>Two stores, and which one holds the pair IS the "stay logged in" answer.</b> A ticked box
 * puts it in `localStorage`, where it outlives the tab and the browser; an unticked one puts it in
 * `sessionStorage`, which the browser drops when the tab closes — the whole of what the promise
 * means on a shared computer, and something no token lifetime can deliver on its own.
 *
 * <p>Reads check the session store first, so a browser-session login on a device that also has a
 * remembered one wins for as long as it lasts, rather than the reader having to know which box
 * was ticked. That also makes the switch invisible to sessions that predate it: a pair already
 * sitting in `localStorage` keeps being found and keeps working.
 *
 * <p>Everything goes through `safeStorage`/`safeSessionStorage` rather than the globals, for the
 * reason stated there: the accessor itself throws where site data is blocked, and this module is
 * read during the first render of the provider that wraps the whole app.
 */
const storeFor = (remember) => (remember ? safeStorage : safeSessionStorage);

export const readToken = () => safeSessionStorage.getItem(TOKEN_KEY) ?? safeStorage.getItem(TOKEN_KEY);

export const readRefreshToken = () =>
    safeSessionStorage.getItem(REFRESH_KEY) ?? safeStorage.getItem(REFRESH_KEY);

/**
 * Whether this session is one the viewer asked to be remembered — i.e. whether it survives the
 * browser closing. Derived from where the pair actually sits rather than from a flag beside it,
 * so the two can never disagree.
 */
export const isRemembered = () => safeStorage.getItem(TOKEN_KEY) != null;

/**
 * Store a freshly issued pair at the tier the viewer chose, clearing the other store.
 *
 * <p>Clearing matters: signing in without the box ticked on a computer where someone left a
 * remembered session behind must not leave that session's tokens in `localStorage`, where the
 * next reader would find them once this tab closed.
 */
export const storeSession = ({ token, refreshToken, remember }) => {
    const keep = storeFor(remember);
    const drop = storeFor(!remember);
    drop.removeItem(TOKEN_KEY);
    drop.removeItem(REFRESH_KEY);
    keep.setItem(TOKEN_KEY, token);
    // The refresh endpoint returns a rotated refresh token; a password change returns a whole new
    // pair. A response that carries no refresh token leaves the one already stored in place —
    // it is still valid, and dropping it would end the session at the access token's next expiry.
    if (refreshToken) keep.setItem(REFRESH_KEY, refreshToken);
};

/**
 * Store a rotated pair where the session already lives, without changing its tier.
 *
 * <p>A refresh is not a new session and must not promote a browser session into a remembered one
 * (or the other way round) — the backend mints the replacement at the tier the old refresh token
 * carried, and this is the storage half of the same rule.
 */
export const storeRotatedTokens = ({ token, refreshToken }) => {
    const keep = storeFor(isRemembered());
    if (token) keep.setItem(TOKEN_KEY, token);
    if (refreshToken) keep.setItem(REFRESH_KEY, refreshToken);
};

export const clearSession = () => {
    safeStorage.removeItem(TOKEN_KEY);
    safeStorage.removeItem(REFRESH_KEY);
    safeSessionStorage.removeItem(TOKEN_KEY);
    safeSessionStorage.removeItem(REFRESH_KEY);
};
