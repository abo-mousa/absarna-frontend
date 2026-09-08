/**
 * The string catalog and the one function that reads it.
 *
 * <p>Every user-facing string in the app lives in `ar.js` and reaches the screen through `t()`.
 * Before this existed, ~600 Arabic literals were spread across 51 files, which had three costs:
 * a wording change meant grepping for a phrase in three quoting styles, the same sentence drifted
 * into four slightly different versions (four spellings of "جاري التحميل..." were in the tree),
 * and there was no answer at all to "what would an English build say" or "what copy does the
 * mobile app share with this one".
 *
 * ## Why hand-rolled instead of react-i18next
 *
 * This module is ~40 lines and has no dependencies, which is the point rather than a boast:
 *
 * - **It is portable verbatim.** `ar.js` is a plain object and `t()` is a plain function — neither
 *   imports React, touches the DOM, or knows what a bundler is. A React Native app can import both
 *   files unchanged, which is the largest single thing the web app can hand a mobile one.
 * - **The app has one locale.** i18next's weight is in plural rules, language detection, lazy
 *   namespace loading and a suspense-aware React binding — all of which price in a problem we do
 *   not have yet. Arabic's six plural forms are a real argument for a library, but the copy here
 *   is already written with its counts inline, so nothing is being deferred by not having them.
 * - **The call sites are what matter, and they are identical either way.** `t('home.title')` is
 *   what a migration to i18next would leave untouched; swapping the implementation later is a
 *   one-file change. Extracting the strings is the irreversible half, and it is done.
 *
 * ## What is deliberately NOT in here
 *
 * - **`lib/dayjsAr.js`** — month names and relative-time forms are dayjs *locale data*, not app
 *   copy. It ships to dayjs, not to a screen, and a second locale would swap the whole locale
 *   object rather than translate its entries.
 * - **Arabic inside comments**, which is prose about the code, not output.
 * - **Test fixtures** that happen to be Arabic (`{ title: 'درس' }`) — they stand for "some text",
 *   and pinning them to catalog keys would make the test assert the catalog rather than the code.
 *   Tests that assert a *user-visible* string do go through `t()`, so a reworded message updates
 *   its test automatically instead of turning it red.
 */

import { ar } from './ar';

const catalog = ar;

// The only line in this module that knows about a bundler. Vite and Vitest both define it;
// Metro does not, so a React Native copy replaces it with __DEV__.
const isDev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Looks up a dotted key.
 *
 * <p><b>A missing key returns the key itself rather than throwing or rendering empty.</b> All
 * three are wrong in production, but visibly wrong beats invisibly wrong: an empty string is a
 * button with no label that nobody notices in review, while `home.titel` on screen names its own
 * bug. In dev it also warns, which is where a typo should actually be caught.
 *
 * @param key    dotted path into the catalog, e.g. `'comments.submit'`
 * @param params values for `{name}` placeholders in the string
 */
export function t(key, params) {
    const value = key.split('.').reduce(
        (node, part) => (node == null ? undefined : node[part]),
        catalog,
    );

    if (typeof value !== 'string') {
        if (isDev) {
            console.warn(`[i18n] missing string for key "${key}"`);
        }
        return key;
    }

    if (!params) {
        return value;
    }
    // An unmatched placeholder is left as written rather than replaced with "undefined" — the
    // literal `{count}` on screen says which value the caller forgot to pass.
    return value.replace(PLACEHOLDER, (match, name) =>
        params[name] === undefined || params[name] === null ? match : String(params[name]));
}

/**
 * Like {@link t}, but a missing key is an expected answer rather than a bug: returns `undefined`
 * and warns about nothing.
 *
 * <p>For lookups whose key comes from data rather than from source — the video quality selector
 * asks the catalog whether it has a word for a rung name the transcode worker chose. "1080p" has
 * no translation and should render as itself, so an absent entry is the normal case and warning
 * about it would train everyone to ignore the warning that matters.
 */
export function tOptional(key, params) {
    const value = key.split('.').reduce(
        (node, part) => (node == null ? undefined : node[part]),
        catalog,
    );
    if (typeof value !== 'string') {
        return undefined;
    }
    return params ? t(key, params) : value;
}

export default t;
