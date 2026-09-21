import { Languages } from 'lucide-react';
import { t } from '@/i18n';
import { LOCALE_CODES, changeLocale, currentLocale, localeInfo } from '@/lib/locale';

/**
 * The interface language control.
 *
 * <p><b>Each locale's label is its own `nativeName` and is never translated.</b> "English" has to
 * read as English to somebody currently looking at the Arabic build, and «العربية» has to read as
 * Arabic to somebody looking at the English one — a switcher whose labels are in the language you
 * are trying to leave is the one control that must not be localised.
 *
 * <p><b>A toggle rather than a menu, because there are two.</b> It names the language it would
 * switch TO, which is the only thing a person pressing it cares about; a control labelled with the
 * language you are already reading is a control that looks like it does nothing. A third locale
 * turns this into a menu — `LOCALE_CODES` is read rather than the two codes being written out, so
 * the day that happens this file is what fails to make sense, rather than quietly showing two of
 * three.
 *
 * <p>Pressing it reloads the page. That is `lib/locale.js`'s decision and the reasoning is there.
 */
function LanguageToggle({ className, labelClassName }) {
    const active = currentLocale();
    const next = LOCALE_CODES[(LOCALE_CODES.indexOf(active) + 1) % LOCALE_CODES.length];
    const nextName = localeInfo(next).nativeName;

    return (
        <button
            type="button"
            onClick={() => changeLocale(next)}
            title={t('nav.languageSwitchedTo', { name: nextName })}
            // The accessible name says both halves: what the control is, and what it would do.
            // `nav.language` alone leaves a screen-reader user with a button called "Language"
            // whose visible text is a word in a script their synthesiser may not read out at all.
            aria-label={`${t('nav.language')}: ${nextName}`}
            className={className}
        >
            <Languages size={18} />
            {/* `lang` on the label so a screen reader switches voice for it, and so the font
                stack's own `:lang(en)` rule picks the right face for the word — this is the one
                place in the app where a string is deliberately not in the page's language. */}
            <span className={labelClassName} lang={localeInfo(next).htmlLang}>{nextName}</span>
        </button>
    );
}

export default LanguageToggle;
