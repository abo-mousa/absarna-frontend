/**
 * Changing the interface language — the browser half of `i18n/`.
 *
 * <p>`i18n/index.js` resolves the active locale once and serves strings; this is the only module
 * that *changes* it, and it is separate for the reason the catalogs are: that module imports
 * nothing and has no DOM in it, so a React Native app can take it verbatim. Storage and
 * `document.documentElement` are exactly what a second host would not want.
 *
 * ## Why switching reloads the page
 *
 * <p>It looks heavy-handed and it is the honest mechanism rather than a shortcut:
 *
 * - **`t()` is a plain function called from 99 files.** Nothing subscribes to it and nothing
 *   re-renders when it would answer differently. Making it reactive means a `useT()` hook at every
 *   call site, including the ones outside React — `lib/authErrors.js`, `lib/describeError.js`,
 *   `lib/navigation.js`, and the two module-level constants in `usePageMeta`. That is a rewrite of
 *   the whole app for a control a person touches approximately once.
 * - **Direction is not a render, it is a layout.** Flipping `<html dir>` under a live tree leaves
 *   measured state behind: the scrubber caches its track rect, hls.js and the PDF reader both hold
 *   DOM they did not build this frame, and the sticky navbar writes its own height into
 *   `--navbar-h`. A reload is the one way to guarantee every one of those is re-measured, and
 *   finding the ones that were not would be a bug report about a crooked page, not a stack trace.
 * - **The choice has to survive a reload anyway**, so the persist step is owed either way.
 *
 * <p>The cost is losing unsaved in-page state. That is real, and it is why the switcher sits in
 * the footer and the navbar overflow rather than beside a form's submit button.
 */

import { safeStorage } from './safeStorage';
import {
    DEFAULT_LOCALE,
    LOCALE_CODES,
    LOCALE_STORAGE_KEY,
    isLocale,
    localeInfo,
} from '@/i18n/locales';
import { currentLocale } from '@/i18n';

export { LOCALE_CODES, localeInfo, currentLocale };

/**
 * The stored choice, or the default.
 *
 * <p>Only useful to the pre-paint script's fallback path and to tests — everything in the app
 * asks `currentLocale()`, which reads what the document is actually laid out as. The two agree
 * because the script below is what set it.
 */
export function storedLocale() {
    const stored = safeStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

/** Writes `lang` and `dir` onto `<html>`. The same two lines `index.html`'s script runs. */
export function applyLocaleToDocument(code) {
    const info = localeInfo(code);
    document.documentElement.lang = info.htmlLang;
    document.documentElement.dir = info.dir;
}

/**
 * Persists a language choice and reloads onto it.
 *
 * <p>Writes the attributes first so that a browser which refuses to reload — or a person who
 * cancels the navigation — is not left on a page whose direction no longer matches its stored
 * preference. A no-op when the locale is already active, so the switcher cannot be a
 * reload button.
 */
export function changeLocale(code) {
    if (!isLocale(code) || code === currentLocale()) return;
    // safeStorage, not localStorage: a browser with site data blocked throws on the accessor
    // itself, and the language switcher is not worth taking the app into the error boundary.
    safeStorage.setItem(LOCALE_STORAGE_KEY, code);
    applyLocaleToDocument(code);
    window.location.reload();
}
