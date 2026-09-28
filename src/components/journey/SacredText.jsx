import { currentLocale } from '@/i18n';
import { pickText } from '@/lib/sacredTexts';
import { localDay } from '@/lib/dayFormat';

/**
 * Amiri and Amiri Quran, fetched the first time a text is drawn — index.html loads Amiri for the
 * progress stars' digits only, and no page but these needs the whole face.
 */
let fontsRequested = false;
function requestFonts() {
    if (fontsRequested || typeof document === 'undefined') return;
    fontsRequested = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:wght@400&display=swap';
    document.head.appendChild(link);
}

/**
 * One verse or hadith from `lib/sacredTexts.js`, with its source (PROGRESS-AND-GOALS.md §7.8, §8.2).
 * The Arabic is shown in every build — Amiri Quran for a verse, whose Uthmani marks need it, Amiri
 * for a hadith — and the English build adds the translation beneath, with its attribution.
 *
 * <p>Pass `entry`, or `moment` (+ `kind`) to let the catalogue choose; the choice is seeded by the
 * local date, so a page says the same thing all day. Renders nothing when the moment has no text.
 * `size="sm"` is the one-line form for a card; the default is a quiet block of its own.
 */
function SacredText({ entry = null, moment = null, kind = null, size = 'md', className = '' }) {
    const text = entry || (moment ? pickText(moment, localDay(), kind) : null);
    if (!text) return null;
    requestFonts();
    const english = currentLocale() !== 'ar';
    const ayah = text.kind === 'AYAH';
    const small = size === 'sm';
    return (
        <figure className={`${small ? '' : 'border-s-2 border-gold/60 ps-4'} ${className}`}>
            <blockquote
                lang="ar"
                dir="rtl"
                // In the English build the verse lines up with its translation on the page's start
                // (`text-end` inside an RTL block is the left edge) rather than across the page.
                className={`${ayah ? 'font-quran' : 'font-sacred'} text-text-primary leading-loose ${small ? 'text-[1.05rem]' : 'text-[1.25rem]'} ${english ? 'text-end' : ''}`}
            >
                {ayah ? <>﴿{text.ar}﴾</> : <>«{text.ar}»</>}
            </blockquote>
            {english && text.en && (
                <p lang="en" dir="ltr" className={`text-text-secondary mt-1 ${small ? 'text-xs' : 'text-sm'}`}>
                    {text.partial ? '… ' : ''}{text.en}
                </p>
            )}
            <figcaption className="text-xs text-text-muted mt-1">
                {english ? text.refLabel.en : text.refLabel.ar}
                {english && text.translation ? ` · ${text.translation}` : ''}
            </figcaption>
        </figure>
    );
}

export default SacredText;
