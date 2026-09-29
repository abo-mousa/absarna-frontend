import { useState } from 'react';
import { shotMeta, shotSrc } from './guideShotMeta';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDigits, isRtl, t } from '@/i18n';

/** The numbered disc a mark and its caption share, so the eye can go from one to the other. */
export function MarkBadge({ n, active = false, className = '' }) {
    return (
        <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold text-[#2b1f00] font-numeral font-bold text-[0.85rem] leading-none
                shadow-[0_1px_3px_rgb(0_0_0/0.3)] ring-2 transition-transform duration-150 ${active ? 'ring-text-primary scale-110' : 'ring-surface'} ${className}`}
            aria-hidden="true"
        >
            {formatDigits(n)}
        </span>
    );
}

/**
 * Where a mark's disc goes: just outside the thing, on its reading-start side and level with its
 * middle — so it points at the thing without covering the first word of it. Something narrow (a
 * star, a badge) would push the disc onto its neighbour that way, so its disc sits just above it
 * instead. Either way the disc is kept inside the picture.
 */
function discPlace(x, y, w, h, rtl) {
    const inside = (value) => `clamp(13px, ${value}, calc(100% - 13px))`;
    if (w < 22) {
        return { left: inside(`${x + w / 2}%`), top: inside(`calc(${y}% - 12px)`) };
    }
    return {
        left: inside(rtl ? `calc(${x + w}% + 12px)` : `calc(${x}% - 12px)`),
        top: inside(`${y + h / 2}%`),
    };
}

/**
 * A screenshot of the real page, on a mat, with a numbered disc on each thing the captions below
 * it talk about. Pointing at a caption outlines its place on the picture and pointing at a disc
 * lights its caption, so a reader can go either way (`discPlace` says where a disc sits).
 *
 * <p>`cut` fades an edge where the picture is a slice of something longer (the milestone road).
 */
function GuideShot({ name, captions = [], cut = null, compact = false }) {
    const theme = useTheme()?.theme;
    const [active, setActive] = useState(null);
    const meta = shotMeta(name);
    if (!meta) return null;
    const rtl = isRtl();
    const marks = meta.marks.slice(0, captions.length);
    const toggle = (index) => setActive((current) => (current === index ? null : index));

    return (
        <figure className="flex flex-col gap-4">
            <div className="relative rounded-lg bg-bg ring-1 ring-border-light p-2.5 sm:p-3">
                <span className="absolute -top-2.5 end-3 z-10 px-2 py-0.5 rounded-sm border border-border-light bg-surface text-[0.65rem] font-semibold text-text-muted">
                    {t('guide.sheet.example')}
                </span>
                <div
                    className="relative overflow-hidden rounded-md ring-1 ring-border-light shadow-[0_1px_2px_rgb(0_0_0/0.05),0_10px_28px_-14px_rgb(0_0_0/0.35)]"
                    style={{ aspectRatio: `${meta.w} / ${meta.h}` }}
                >
                    <img
                        src={shotSrc(name, meta.locale, theme)}
                        alt=""
                        width={meta.w}
                        height={meta.h}
                        loading="lazy"
                        decoding="async"
                        draggable="false"
                        className="absolute inset-0 w-full h-full select-none"
                    />
                    {cut && (
                        <span aria-hidden="true"
                              className={`absolute inset-x-0 h-12 pointer-events-none from-bg to-transparent ${cut === 'top' ? 'top-0 bg-gradient-to-b' : 'bottom-0 bg-gradient-to-t'}`} />
                    )}
                    {marks.map(([x, y, w, h], index) => (
                        <span
                            key={`box-${index}`}
                            aria-hidden="true"
                            className={`absolute rounded-md transition-[box-shadow,background-color] duration-150 pointer-events-none ${
                                active === index ? 'bg-gold/15 shadow-[0_0_0_2px_rgb(var(--color-gold))]' : ''
                            }`}
                            style={{
                                left: `calc(${x}% - 4px)`, top: `calc(${y}% - 4px)`,
                                width: `calc(${w}% + 8px)`, height: `calc(${h}% + 8px)`,
                            }}
                        />
                    ))}
                    {marks.map(([x, y, w, h], index) => (
                        <button
                            key={`mark-${index}`}
                            type="button"
                            onClick={() => toggle(index)}
                            onMouseEnter={() => setActive(index)}
                            onMouseLeave={() => setActive(null)}
                            aria-label={`${t('guide.sheet.mark', { n: index + 1 })}: ${captions[index]}`}
                            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:animate-[guide-pop_320ms_ease-out_both]"
                            style={{ ...discPlace(x, y, w, h, rtl), animationDelay: `${120 + index * 70}ms` }}
                        >
                            <MarkBadge n={index + 1} active={active === index} />
                        </button>
                    ))}
                </div>
            </div>
            {captions.length > 0 && (
                <ol className={`flex flex-col ${compact ? 'gap-1' : 'gap-1.5'}`}>
                    {captions.map((caption, index) => (
                        <li key={caption}>
                            <button
                                type="button"
                                onClick={() => toggle(index)}
                                onMouseEnter={() => setActive(index)}
                                onMouseLeave={() => setActive(null)}
                                onFocus={() => setActive(index)}
                                onBlur={() => setActive(null)}
                                className={`flex items-start gap-3 w-full text-start rounded-md px-2 py-1.5 transition-colors ${
                                    active === index ? 'bg-gold-light/60' : 'hover:bg-surface-hover'
                                }`}
                            >
                                <MarkBadge n={index + 1} active={active === index} className="flex-shrink-0 mt-px" />
                                <span className="text-sm leading-relaxed text-text-primary">{caption}</span>
                            </button>
                        </li>
                    ))}
                </ol>
            )}
        </figure>
    );
}

export default GuideShot;
