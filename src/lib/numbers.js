/**
 * Counts shown to readers — views, comments, likes, pages, results.
 *
 * <p><b>Latin digits, grouped Western-style.</b> The app had two digit systems on one card:
 * `toLocaleString('ar')` gave Arabic-Indic digits (١٢٣) for view/comment/like counts while every
 * date (`lib/dayjsAr.js`, deliberately), every «{count} صفحة», subscriber count, «الجزء 3 من 99»
 * and result count used Latin digits. The codebase had already chosen Latin for dates and recorded
 * why; this makes the counts agree with them, in one place, so the next count cannot re-open the
 * question by copying whichever call site it happened to sit next to.
 *
 * <p>`null`/`undefined`/non-numeric input renders as an empty string rather than "NaN" — a card
 * missing a count should show nothing, not a bug.
 */
const FORMAT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export const formatCount = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const number = Number(value);
    if (!Number.isFinite(number)) return '';
    return FORMAT.format(number);
};

export default formatCount;
