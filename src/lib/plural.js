import { currentLocale, t, tOptional } from '@/i18n';
import { formatCount } from '@/lib/numbers';

/**
 * A count with its noun in the form the language wants — «صفحة واحدة», «صفحتان», «٣ صفحات»,
 * «١١ صفحة»; "1 page", "4 pages". `key` names a catalog node holding the CLDR forms (`zero`,
 * `one`, `two`, `few`, `many`, `other`), each with `{count}`; a form the node leaves out falls back
 * to `other`. Arabic has six forms and `n + ' صفحات'` gets four of them wrong.
 */
export function countOf(key, count, { oblique = false } = {}) {
    const rule = new Intl.PluralRules(currentLocale()).select(count);
    // The form is chosen from the number; the number is shown grouped («٢٥٬٠٠٠ صفحة»), which
    // `t` alone does not do — it only localises digits.
    const params = { count: formatCount(count) };
    // After «من», «إلى», «في» and as an object, Arabic's dual changes its ending — «١ من حلقتين»,
    // «أبقِ صفحتين» — so a `_OBL` node carries the forms that differ; the rest are shared.
    const oblique_ = oblique ? tOptional(`${key}_OBL.${rule}`, params) : undefined;
    return oblique_ ?? tOptional(`${key}.${rule}`, params) ?? t(`${key}.other`, params);
}
