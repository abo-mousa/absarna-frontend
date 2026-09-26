import { useId } from 'react';
import { AlertTriangle } from 'lucide-react';
import { KHATAM_POINTS, khatamDash, khatamSweep } from '@/lib/khatam';

/**
 * The eight-pointed star (khatam) — the redesign's one ornament.
 *
 * <p>It is the outline of the logo's own outer ring (`IrisMark`), so every star in the interface
 * is literally a piece of the mark rather than a lookalike. It marks a section heading
 * (`Cartouche`), a kicker, the end of a page — and, as `KhatamProgress`, how far through a series
 * or a book someone is, revealed clockwise from the top tip (see `khatamSweep`).
 *
 * <p>Deliberately not a crescent, a dome or a lantern: those place a platform in one region's
 * style. The eight-fold star is shared across the Muslim world and is already the logo.
 */

/**
 * The star, filled or as an outline, in `currentColor` — so `text-gold` colours it the way it
 * colours text. Decorative, and hidden from assistive technology: wherever it appears, the words
 * beside it are what carry the meaning.
 */
export function KhatamStar({ filled = true, strokeWidth = 9, className = '' }) {
    return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
            <polygon
                points={KHATAM_POINTS}
                fill={filled ? 'currentColor' : 'none'}
                stroke={filled ? 'none' : 'currentColor'}
                strokeWidth={filled ? undefined : strokeWidth}
                strokeLinejoin="miter"
            />
        </svg>
    );
}

/**
 * The picture for a place with nothing in it yet: the logo's star, drawn twice and turned against
 * itself the way the mark's rings interlace, around one thin line icon saying what is missing.
 * Replaced the emoji (📝, 📭, 📚…) the empty states used, which were the one thing on those pages
 * drawn by the operating system rather than by us, and looked different on every phone.
 * `tone="error"` is for a failed load: the star goes quiet and the glyph takes the voice colour.
 */
/**
 * Glyphs whose weight sits low, lifted so they LOOK centred in the star rather than measure it.
 * A triangle is centred by its box, but its mass is in the base (its centroid is two thirds of the
 * way down from the tip), so a box-centred warning sign sat visibly low inside the star's
 * symmetric frame. The lift is a fraction of the glyph's size — 2.5px at 30px, compared by eye
 * against 0, 1.5 and 3.75 — so both sizes keep the same correction.
 */
const OPTICAL_LIFT = new Map([[AlertTriangle, 1 / 12]]);

export function KhatamEmblem({ icon: Icon, tone = 'default', size = 'md', className = '' }) {
    const error = tone === 'error';
    const small = size === 'sm';
    const glyph = small ? 22 : 30;
    const lift = (OPTICAL_LIFT.get(Icon) || 0) * glyph;
    return (
        <span className={`relative inline-block ${small ? 'w-16 h-16' : 'w-24 h-24'} ${className}`} aria-hidden="true">
            <KhatamStar className={`absolute inset-0 w-full h-full ${error ? 'text-border-light' : 'text-gold/10'}`} />
            <KhatamStar filled={false} strokeWidth={2.5} className={`absolute inset-0 w-full h-full ${error ? 'text-border' : 'text-gold'}`} />
            <KhatamStar
                filled={false}
                strokeWidth={3}
                className={`absolute inset-[14%] w-[72%] h-[72%] rotate-[22.5deg] ${error ? 'text-border' : 'text-gold/50'}`}
            />
            {Icon && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <Icon
                        size={glyph}
                        strokeWidth={1.5}
                        className={error ? 'text-voice' : 'text-primary'}
                        style={lift ? { transform: `translateY(-${lift}px)` } : undefined}
                    />
                </span>
            )}
        </span>
    );
}

/**
 * How far through something the reader is: the star's outline revealed clockwise from the top
 * tip, over a faint copy of it. `value` is what is BEHIND the reader, 0–1, always the backend's
 * (episodes before the next one, pages before the current one). `label` sits in the middle («١٠٣», «ص ٢١٤»); `title` is the sentence a screen reader gets,
 * since a shape alone says nothing to one.
 */
export function KhatamProgress({ value, label, title, className = '', trackClassName = 'text-border', traceClassName = 'text-gold' }) {
    // Scoped, so two stars on one page cannot share a mask.
    const maskId = `${useId()}-sweep`;
    const dash = khatamDash(value);
    const sweep = khatamSweep(value);
    const outline = { points: KHATAM_POINTS, fill: 'none', stroke: 'currentColor', strokeWidth: 9, strokeLinejoin: 'miter' };
    return (
        <div className={`relative ${className}`} role="img" aria-label={title}>
            <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true" focusable="false">
                {sweep && (
                    <defs>
                        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
                            <path d={sweep} fill="white" />
                        </mask>
                    </defs>
                )}
                <polygon {...outline} className={trackClassName} />
                {/* The whole closed outline, revealed by the wedge (see khatamSweep) — or unmasked
                    when complete, so a finished star is exactly the track's shape in gold. */}
                {dash > 0 && (
                    <polygon {...outline} className={traceClassName} mask={sweep ? `url(#${maskId})` : undefined} />
                )}
            </svg>
            {label != null && (
                // Naskh, the reading face (product owner, 2026-09-26, over Cairo and Markazi): its
                // Arabic digits are the classic shapes, where Cairo's were squat and its «٠» a dot.
                // A label longer than a number («ص ٢١٤») steps down so it stays inside the star.
                <span className={`absolute inset-0 flex items-center justify-center font-reading font-semibold leading-none text-text-primary ${
                    String(label).length > 3 ? 'text-[0.75rem]' : 'text-[0.8125rem]'
                }`}>
                    {label}
                </span>
            )}
        </div>
    );
}

export default KhatamStar;
