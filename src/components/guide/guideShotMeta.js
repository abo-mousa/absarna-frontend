import shots from './guideShots.json';
import { currentLocale } from '@/i18n';

/**
 * A screenshot's measurements for the active locale — Arabic's when a locale has none, since the
 * two are the same page mirrored and a guide showing the other language's picture beats one
 * showing nothing.
 */
export function shotMeta(name) {
    const entry = shots[name];
    if (!entry) return null;
    const locale = entry[currentLocale()] ? currentLocale() : 'ar';
    return { ...entry[locale], locale };
}

/** Where `npm run guide:shots` wrote a screenshot, for the reader's locale and theme. */
export function shotSrc(name, locale, theme, ext = 'png') {
    return `${import.meta.env.BASE_URL}guide/${locale}/${theme === 'dark' ? 'dark' : 'light'}/${name}.${ext}`;
}
