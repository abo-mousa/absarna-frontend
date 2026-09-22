/**
 * Counts shown to readers — views, comments, likes, pages, results.
 *
 * <p><b>Each locale's own digits, grouped its own way.</b> `Intl.NumberFormat` is given the tag on
 * the locale record, so Arabic gets Arabic-Indic digits and the Arabic thousands separator from one
 * call — «١٬٩٤٣» — and English gets «1,943».
 *
 * <p><b>This reverses an earlier decision, deliberately.</b> The app once had two digit systems on
 * one card: `toLocaleString('ar')` gave Arabic-Indic digits for view/comment/like counts while
 * every date, «{count} صفحة», subscriber count and result count used Latin. That was settled by
 * making everything Latin — the right call at the time, because it ended the split with one rule.
 * It is now settled the other way, because the goal was always that a screen has ONE digit system
 * and the Arabic build reading in Arabic digits is the better version of that. What must not come
 * back is the mixture.
 *
 * <p>The line, and it is the one thing to keep straight: <b>numbers the APP formats are localised;
 * text a PERSON wrote is not.</b> A count, a page number, a year, a duration — ours, and they
 * convert. A title, a description, a comment, a YouTube id, a slug, a quality rung like "1080p" —
 * theirs or an identifier, and they are left exactly as they are. `i18n`'s `t()` enforces the same
 * split by converting numeric parameters and passing strings through untouched.
 *
 * <p>`null`/`undefined`/non-numeric input renders as an empty string rather than "NaN" — a card
 * missing a count should show nothing, not a bug.
 */
import { currentLocaleInfo } from '@/i18n';

/**
 * One formatter per locale tag, built on first use.
 *
 * <p>Not a module-level constant, because that would be built before a test calls
 * `setActiveLocale` and would then format every locale as the first one. Not one per call either:
 * `Intl.NumberFormat` is comparatively expensive to construct, and a home page draws three counts
 * on each of two dozen cards and rebuilds them on every render. Keyed by the tag, so the cache
 * cannot serve the wrong locale's formatter.
 */
const formatters = new Map();

const formatterFor = (tag) => {
    let formatter = formatters.get(tag);
    if (!formatter) {
        formatter = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 });
        formatters.set(tag, formatter);
    }
    return formatter;
};

export const formatCount = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const number = Number(value);
    if (!Number.isFinite(number)) return '';
    return formatterFor(currentLocaleInfo().numberFormat).format(number);
};

export default formatCount;
