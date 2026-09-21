/**
 * The locales the app ships, and everything that is a property of a locale rather than a string.
 *
 * <p>Deliberately separate from `index.js` and importing nothing: `index.html`'s pre-paint script
 * needs the same three facts (which codes exist, which is the default, which storage key holds the
 * choice) before any module has loaded, and a React Native copy needs them without a DOM. Both
 * read this shape; the inline script is the one place that restates it, for the reason the theme
 * script already restates `'dark'` — it runs before there is a bundle to import from.
 *
 * <p><b>`dir` is here and not derived at a call site.</b> Direction is a fact about the locale, so
 * a component asks which direction it is in rather than asking which language it is in and
 * answering the direction itself — the second form is how one screen ends up mirrored and the next
 * one does not.
 */

/**
 * Arabic is the default for everyone, including a visitor whose browser is English.
 *
 * <p>Not a detection failure — a decision. The catalogue is Arabic: the lectures, the books, the
 * titles and the descriptions are all Arabic and none of them are translated. An English interface
 * around them is a useful thing to be able to choose and a strange thing to be given, so it is
 * opt-in and the choice is remembered. `navigator.language` is deliberately never read.
 */
export const DEFAULT_LOCALE = 'ar';

/** Where the choice lives — a plain `safeStorage` key, exactly as the theme's does. */
export const LOCALE_STORAGE_KEY = 'locale';

export const LOCALES = {
    ar: {
        code: 'ar',
        dir: 'rtl',
        /** What goes in `<html lang>`. Bare `ar`, not `ar-EG`: nothing here is region-specific. */
        htmlLang: 'ar',
        /**
         * The locale name written in its own language, which is the only form that is useful in a
         * switcher — «العربية» is readable to the person who wants Arabic whatever they can
         * currently read, and "Arabic" is not.
         */
        nativeName: 'العربية',
        /** The dayjs locale registered in `lib/datetime.js` — see the note there on `ar-latn`. */
        dayjs: 'ar-latn',
    },
    en: {
        code: 'en',
        dir: 'ltr',
        htmlLang: 'en',
        nativeName: 'English',
        dayjs: 'en',
    },
};

export const LOCALE_CODES = Object.keys(LOCALES);

export const isLocale = (code) => typeof code === 'string'
    && Object.prototype.hasOwnProperty.call(LOCALES, code);

/** The locale record for a code, falling back to the default rather than returning undefined. */
export const localeInfo = (code) => LOCALES[isLocale(code) ? code : DEFAULT_LOCALE];
