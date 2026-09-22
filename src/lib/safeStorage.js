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
        /**
         * Writes, and <b>answers whether the write will outlive this page</b>.
         *
         * <p>`true` means it reached the real store; `false` means it went to the in-memory
         * fallback and is gone on the next navigation. Almost every caller can ignore that — a
         * remembered theme or a collapsed panel degrades to "not remembered" and nothing else.
         *
         * <p>`lib/locale.js` cannot ignore it, because changing language *reloads the page*: the
         * mechanism that applies the choice is the same one that discards a memory-only copy, so
         * without this the switcher would reload straight back into the old language and read as
         * a dead button. It is the one preference whose own delivery destroys its fallback.
         */
        setItem(key, value) {
            const store = backing();
            if (store) {
                try {
                    store.setItem(key, value);
                    memory.delete(key);
                    return true;
                } catch {
                    /* fall through to memory */
                }
            }
            memory.set(key, String(value));
            return false;
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
