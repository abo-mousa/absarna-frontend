/**
 * Folding Arabic so a search matches what a reader meant rather than what they typed.
 *
 * <h4>Why this exists on the client at all</h4>
 *
 * <p>Every other search on this platform is the backend's: `/api/search` and friends normalise in
 * Postgres, through `absarna_normalize_arabic` (migration 020, renamed in 024), and the SPA just
 * sends the query. The PDF reader is the one search that never reaches a server — the text is
 * extracted from the document in the reader's own browser and matched there — so it is the one
 * place that needs its own copy of the rule.
 *
 * <p><b>The rules below are that function's, character for character</b>, and deliberately not a
 * better set. Two searches for the same words that disagree about whether «إسلامية» matches
 * «اسلامية» would be worse than either rule on its own, so if this ever needs to change, change
 * the SQL first and follow it here. What the backend does is fold the four alef forms together,
 * fold alef maqsura into ya and ta marbuta into ha, drop every short-vowel mark, the shadda, the
 * sukun, the superscript alef and the tatweel, and lower-case the result.
 *
 * <h4>The one thing added, and why it is not a departure</h4>
 *
 * <p>NFKC runs first, which the SQL has no need of and this does. A PDF's text layer frequently
 * carries Arabic as PRESENTATION FORMS (U+FB50–U+FEFF) — the pre-shaped glyphs a typesetter
 * emitted — where a reader types the ordinary letters. Nothing in the fold below would bring those
 * two together, so a search for a word plainly visible on the page would find nothing. NFKC maps a
 * presentation form back to the letter it is, which is a statement about encoding rather than about
 * Arabic, and it is a no-op on text that is already ordinary.
 */

/** أ إ آ ٱ → ا. The four alefs a reader will not distinguish when typing. */
const ALEFS = /[أإآٱ]/g;

/**
 * Tashkeel and friends, all removed: fathatan, dammatan, kasratan, fatha, damma, kasra, shadda,
 * sukun (U+064B–U+0652), the superscript alef (U+0670), and the tatweel (U+0640) — which is not a
 * mark at all but a stretching character a typesetter inserts and nobody types.
 */
const MARKS = /[ً-ْٰـ]/g;

/**
 * The normalised form of a string, for comparison only.
 *
 * <p><b>Never store or display the result.</b> It is lossy by design: «مُحَمَّد» and «محمد» collapse to
 * the same thing, which is the point when matching and vandalism when rendering.
 */
export function normalizeArabic(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .normalize('NFKC')
        .replace(ALEFS, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(MARKS, '')
        .toLowerCase();
}

export default normalizeArabic;
