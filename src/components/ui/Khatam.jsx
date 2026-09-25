import { KHATAM_POINTS, khatamDash } from '@/lib/khatam';

/**
 * The eight-pointed star (khatam) — the redesign's one ornament.
 *
 * <p>It is the outline of the logo's own outer ring (`IrisMark`), so every star in the interface
 * is literally a piece of the mark rather than a lookalike. It marks a section heading
 * (`Cartouche`), a kicker, the end of a page — and, as `KhatamProgress`, how far through a series
 * or a book someone is, traced along its outline.
 *
 * <p>Deliberately not a crescent, a dome or a lantern: those place a platform in one region's
 * style. The eight-fold star is shared across the Muslim world and is already the logo.
 */

/**
 * The star, filled or as an outline, in `currentColor` — so `text-gold` colours it the way it
 * colours text. Decorative, and hidden from assistive technology: wherever it appears, the words
 * beside it are what carry the meaning.
 */
export function KhatamStar({ filled = true, className = '' }) {
    return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
            <polygon
                points={KHATAM_POINTS}
                fill={filled ? 'currentColor' : 'none'}
                stroke={filled ? 'none' : 'currentColor'}
                strokeWidth={filled ? undefined : 9}
                strokeLinejoin="miter"
            />
        </svg>
    );
}

/**
 * How far through something the reader is, traced along the star's outline over a faint copy of
 * it. `label` sits in the middle («١٠٣», «ص ٢١٤»); `title` is the sentence a screen reader gets,
 * since a shape alone says nothing to one.
 */
export function KhatamProgress({ value, label, title, className = '', trackClassName = 'text-border', traceClassName = 'text-gold' }) {
    const dash = khatamDash(value);
    return (
        <div className={`relative ${className}`} role="img" aria-label={title}>
            <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true" focusable="false">
                <polygon points={KHATAM_POINTS} fill="none" stroke="currentColor" strokeWidth="9"
                         strokeLinejoin="miter" className={trackClassName} />
                {dash > 0 && (
                    <polygon points={KHATAM_POINTS} fill="none" stroke="currentColor" strokeWidth="9"
                             strokeLinejoin="miter" pathLength="100" strokeDasharray={`${dash} 100`}
                             className={traceClassName} />
                )}
            </svg>
            {label != null && (
                <span className="absolute inset-0 flex items-center justify-center text-[0.7rem] font-bold text-text-primary">
                    {label}
                </span>
            )}
        </div>
    );
}

export default KhatamStar;
