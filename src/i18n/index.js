/**
 * The string catalogs and the one function that reads them.
 *
 * <p>Every user-facing string in the app lives in a catalog (`ar.js`, `en.js`) and reaches the
 * screen through `t()`. Before this existed, ~600 Arabic literals were spread across 51 files,
 * which had three costs: a wording change meant grepping for a phrase in three quoting styles,
 * the same sentence drifted into four slightly different versions (four spellings of
 * «جاري التحميل...» were in the tree), and there was no answer at all to "what would an English
 * build say" or "what copy does the mobile app share with this one".
 *
 * ## Why hand-rolled instead of react-i18next
 *
 * This module has no dependencies, which is the point rather than a boast:
 *
 * - **It is portable verbatim.** The catalogs are plain objects and `t()` is a plain function —
 *   none of them imports React, touches the DOM, or knows what a bundler is. A React Native app
 *   can import them unchanged, which is the largest single thing the web app can hand a mobile one.
 * - **The call sites are what matter, and they are identical either way.** `t('home.title')` is
 *   what a migration to i18next would leave untouched; swapping the implementation later is a
 *   one-file change. Extracting the strings is the irreversible half, and it is done.
 * - **Plural rules are still not owed.** Arabic's six forms are the real argument for a library,
 *   and the copy here is written with its counts inline, so nothing is deferred by not having
 *   them. If a screen ever needs true plural selection, that is the change that buys i18next.
 *
 * ## The locale is fixed for the life of the page
 *
 * <p>`t()` is a pure function of (key, params) — not a hook, not a subscriber — and 99 files call
 * it directly. That is only sound because the active locale cannot change while the page is up:
 * `lib/locale.js` persists the choice and reloads, exactly as a change of `<html dir>` wants
 * anyway. See that module for why a reload is the honest mechanism here and not a shortcut.
 *
 * <p>The locale is resolved **once, at import time**, from `<html lang>` — which `index.html`'s
 * pre-paint script has already set, the same way it has already applied the `dark` class. Reading
 * it back from the DOM rather than re-deriving it from storage is what keeps the attribute the
 * browser is laying out with and the catalog this module serves from ever disagreeing.
 *
 * ## What is deliberately NOT in here
 *
 * - **`lib/datetime.js`** — month names and relative-time forms are dayjs *locale data*, not app
 *   copy. They ship to dayjs, not to a screen, and a locale swaps the whole locale object rather
 *   than translating its entries.
 * - **Arabic inside comments**, which is prose about the code, not output.
 * - **Test fixtures** that happen to be Arabic (`{ title: 'درس' }`) — they stand for "some text",
 *   and pinning them to catalog keys would make the test assert the catalog rather than the code.
 *   Tests that assert a *user-visible* string do go through `t()`, so a reworded message updates
 *   its test automatically instead of turning it red.
 */

import { ar } from './ar';
import { en } from './en';
import { DEFAULT_LOCALE, isLocale, localeInfo, localizeDigits } from './locales';

const catalogs = { ar, en };

// The only line in this module that knows about a bundler. Vite and Vitest both define it;
// Metro does not, so a React Native copy replaces it with __DEV__.
const isDev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Reads `<html lang>`, which the pre-paint script in `index.html` has already set.
 *
 * <p>Guarded on `document` rather than assuming one: this module is meant to be importable by a
 * React Native app, where there is no DOM and the host calls {@link setActiveLocale} at boot
 * instead. A jsdom test with no `lang` attribute lands on the default, which is what a test that
 * has not said otherwise should get.
 */
function resolveInitialLocale() {
    if (typeof document === 'undefined') return DEFAULT_LOCALE;
    const lang = document.documentElement?.lang;
    return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

let active = resolveInitialLocale();

/** The active locale code. */
export const currentLocale = () => active;

/** The active locale's record — `dir`, `nativeName`, the dayjs locale name. */
export const currentLocaleInfo = () => localeInfo(active);

/** `'rtl'` or `'ltr'`. What a component passes to a `dir=` it needs to state explicitly. */
export const direction = () => localeInfo(active).dir;

/**
 * Whether the interface currently runs right to left.
 *
 * <p>For the handful of places that cannot be expressed as a logical CSS property and have to
 * branch — the scrubber measuring a pointer from one edge of its track, the arrow keys that seek
 * along it, the swipe zones that are the same timeline without the timeline. Everything else uses
 * `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-` and flips on its own.
 */
export const isRtl = () => localeInfo(active).dir === 'rtl';

/**
 * The active locale's digits for a number that is a LABEL — a page, an index, a year.
 *
 * <p>Glyphs only, never grouping: «٢٬٠٢٦» is not a year. A magnitude goes through
 * `lib/numbers.js`'s `formatCount` instead, which groups it properly for the locale.
 *
 * <p>Never hand this text a person wrote. It maps every ASCII digit it is given, so a title or a
 * YouTube id would be rewritten along with everything else.
 */
export const formatDigits = (value) => localizeDigits(value, active);

/**
 * The inverse of {@link formatDigits}, for reading a number back out of something a person typed.
 * Accepts either script whatever the locale is — see `locales.js`.
 */
export { normalizeDigits } from './locales';

/**
 * Sets the locale for a host that has no `<html lang>` to read — a React Native shell, or a test
 * that wants the other catalog. <b>Not the way a person changes language</b>: in the browser that
 * is `lib/locale.js`, which persists the choice and reloads, because 99 call sites of `t()` are
 * plain function calls that nothing would re-run.
 */
export function setActiveLocale(code) {
    active = isLocale(code) ? code : DEFAULT_LOCALE;
}

function lookup(catalog, key) {
    return key.split('.').reduce(
        (node, part) => (node == null ? undefined : node[part]),
        catalog,
    );
}

/**
 * Looks up a dotted key in the active catalog, falling back to Arabic.
 *
 * <p><b>A key the active catalog is missing falls back to `ar` rather than showing the key.</b>
 * English is being filled in namespace by namespace, so a gap is an expected state for a while and
 * an Arabic sentence on an English screen is legible, obviously untranslated, and safe — where the
 * dotted key is none of the three. The gaps are not invisible: `__tests__/i18n.test.js` asserts
 * that every namespace `en.js` declares translated is complete, and lists the rest.
 *
 * <p><b>A key missing from Arabic too returns the key itself</b> rather than throwing or rendering
 * empty. All three are wrong in production, but visibly wrong beats invisibly wrong: an empty
 * string is a button with no label that nobody notices in review, while `home.titel` on screen
 * names its own bug. In dev it also warns, which is where a typo should actually be caught.
 *
 * @param key    dotted path into the catalog, e.g. `'comments.submit'`
 * @param params values for `{name}` placeholders in the string
 */
export function t(key, params) {
    let value = lookup(catalogs[active], key);

    if (typeof value !== 'string' && active !== DEFAULT_LOCALE) {
        value = lookup(catalogs[DEFAULT_LOCALE], key);
    }

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
    //
    // A NUMBER is localised, a STRING is passed through untouched, and that split is the whole
    // rule about digits. Everything the app counts or numbers arrives here as a number and should
    // read in the locale's own digits; everything a person wrote — a title in `{title}`, a search
    // in `{query}` — arrives as a string and is nobody's to rewrite. Call sites that pre-format a
    // magnitude with `formatCount` hand in a string that is already localised, and a second pass
    // would find no ASCII digits in it anyway.
    return value.replace(PLACEHOLDER, (match, name) => {
        const supplied = params[name];
        if (supplied === undefined || supplied === null) return match;
        return typeof supplied === 'number' ? localizeDigits(supplied, active) : String(supplied);
    });
}

/**
 * The catalog node at a dotted key — an object or an array, not a string.
 *
 * <p><b>`t()` cannot do this and must not learn to.</b> It is a string API by contract: it returns
 * the key itself when the result is not a string, and `__tests__` pins that deliberately, because
 * the alternative is `[object Object]` rendered into a page. The legal documents are the one place
 * the catalog holds structure rather than sentences — sections, paragraph arrays, and paragraphs
 * that are themselves arrays of text and `{ text, href }` links — so they need an accessor that
 * hands back the node.
 *
 * <p>It exists because the three legal pages used to import `{ ar }` and read `ar.legal.terms`
 * straight out of it. That was correct while there was one catalog and became a bug the moment
 * there were two: the page chrome translated and the document itself stayed Arabic, which reads as
 * a half-broken page rather than an untranslated one.
 *
 * <p>Falls back to the default catalog for the same reason {@link t} does, and returns `undefined`
 * rather than a string, so a caller that reaches for a node and finds a sentence gets nothing
 * instead of something it cannot render.
 */
export function tData(key) {
    const value = lookup(catalogs[active], key);
    if (value !== undefined && typeof value !== 'string') {
        return value;
    }
    const fallback = lookup(catalogs[DEFAULT_LOCALE], key);
    return typeof fallback === 'string' ? undefined : fallback;
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
    let value = lookup(catalogs[active], key);
    if (typeof value !== 'string' && active !== DEFAULT_LOCALE) {
        value = lookup(catalogs[DEFAULT_LOCALE], key);
    }
    if (typeof value !== 'string') {
        return undefined;
    }
    return params ? t(key, params) : value;
}

export default t;
