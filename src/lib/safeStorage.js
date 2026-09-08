/**
 * `localStorage`/`sessionStorage` that cannot throw.
 *
 * <p>Browsers throw on the storage *accessor itself* when site data is blocked (Chrome and Safari
 * raise `SecurityError` for `window.localStorage`), and `setItem` throws `QuotaExceededError` in
 * some private modes. Four modules read the token straight off `localStorage` and one wrote the
 * theme in an effect, so a visitor with "block all cookies and site data" hit an exception during
 * the first render: `ThemeProvider`'s effect threw, the top-level error boundary swallowed the
 * whole app, and the page showed "reload" forever. Meanwhile `index.html`'s theme script and
 * `lib/uploadResume.js` were both already wrapped in try/catch for exactly this — the app was
 * inconsistent with itself.
 *
 * <p>Falls back to an in-memory map for the life of the page, so a blocked store degrades to
 * "the session does not survive a reload", which is the correct answer there, rather than to a
 * blank screen.
 *
 * <p>The backing store is resolved on every call, never cached at import time: tests stub
 * `globalThis.localStorage` per test, and a cached reference would keep the first one forever.
 */
const createSafeStorage = (resolve) => {
    const memory = new Map();

    const backing = () => {
        try {
            return resolve() ?? null;
        } catch {
            return null;
        }
    };

    return {
        getItem(key) {
            const store = backing();
            if (store) {
                try {
                    return store.getItem(key);
                } catch {
                    /* fall through to memory */
                }
            }
            return memory.has(key) ? memory.get(key) : null;
        },
        setItem(key, value) {
            const store = backing();
            if (store) {
                try {
                    store.setItem(key, value);
                    memory.delete(key);
                    return;
                } catch {
                    /* fall through to memory */
                }
            }
            memory.set(key, String(value));
        },
        removeItem(key) {
            memory.delete(key);
            const store = backing();
            if (store) {
                try {
                    store.removeItem(key);
                } catch {
                    /* nothing to remove if the store is unavailable */
                }
            }
        },
    };
};

export const safeStorage = createSafeStorage(() => globalThis.localStorage);
export const safeSessionStorage = createSafeStorage(() => globalThis.sessionStorage);

export { createSafeStorage };
export default safeStorage;
