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
        /** The dayjs locale registered in `lib/datetime.js`. */
        dayjs: 'ar',
        /**
         * The BCP 47 tag `Intl.NumberFormat` is given for a GROUPED count. `ar-EG` brings the
         * Arabic-Indic digits and the Arabic thousands separator together, which is why the digit
         * map below is not used for counts — one call gets both right.
         */
        numberFormat: 'ar-EG',
        /**
         * ASCII digit → this locale's digit. Used for numbers that are a LABEL rather than a
         * magnitude — a page number, an index, a year — where grouping would be wrong («٢٬٠٢٦» for
         * a year) and only the glyphs should change.
         */
        digits: '٠١٢٣٤٥٦٧٨٩',
    },
    en: {
        code: 'en',
        dir: 'ltr',
        htmlLang: 'en',
        nativeName: 'English',
        dayjs: 'en',
        numberFormat: 'en-US',
        // Identity: the mapper returns its input unchanged when a locale's digits are ASCII.
        digits: '0123456789',
    },
};

export const LOCALE_CODES = Object.keys(LOCALES);

export const isLocale = (code) => typeof code === 'string'
    && Object.prototype.hasOwnProperty.call(LOCALES, code);

/** The locale record for a code, falling back to the default rather than returning undefined. */
export const localeInfo = (code) => LOCALES[isLocale(code) ? code : DEFAULT_LOCALE];

/**
 * Rewrites the ASCII digits in a string as the locale's own.
 *
 * <p><b>Glyphs only — no grouping, no rounding, no parsing.</b> That is the whole point of having
 * this beside {@code Intl.NumberFormat} rather than instead of it: a count is a magnitude and wants
 * grouping («١٬٩٤٣»), while a page number, an index or a year is a label and must not be grouped —
 * a year run through a number formatter comes out «٢٬٠٢٦».
 *
 * <p>Idempotent, because the output contains no ASCII digits for a second pass to find. And it is
 * deliberately blunt: it maps every ASCII digit in whatever it is handed, so callers must not hand
 * it text a person wrote or an identifier. See the note in `numbers.js` on where the line sits.
 */
export const localizeDigits = (value, code) => {
    const digits = localeInfo(code).digits;
    if (value === null || value === undefined) return '';
    const text = String(value);
    return digits === '0123456789'
        ? text
        : text.replace(/[0-9]/g, (d) => digits[Number(d)]);
};

/**
 * The inverse, and it accepts BOTH scripts on purpose: a reader typing into the PDF reader's page
 * box may use either keyboard, and refusing one of them would be a worse answer than accepting
 * both. Everything that is not a digit is left alone, so a caller still has to parse the result.
 */
export const normalizeDigits = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
};
