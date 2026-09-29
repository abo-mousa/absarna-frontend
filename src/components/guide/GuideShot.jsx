import { useLayoutEffect, useRef, useState } from 'react';
import { shotMeta, shotSrc } from './guideShotMeta';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDigits, t } from '@/i18n';

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

// The margin a column of discs takes beside the picture, and the least distance between two
// discs in one column (a disc is 24px).
const GUTTER = 32;
const SPACING = 28;

/**
 * Which margin a mark's disc goes in: the one nearer its middle — unless the straight line from
 * that margin would cross another marked thing (a caption beside a button), and the other margin's
 * would not.
 */
function sideOf(mark, marks) {
    const [x, y, w, h] = mark;
    const level = y + h / 2;
    const blocked = (from, to) => marks.some((other) => other !== mark
        && other[1] <= level && level <= other[1] + other[3]
        && other[0] < to && other[0] + other[2] > from);
    const near = x + w / 2 < 50 ? 'left' : 'right';
    const far = near === 'left' ? 'right' : 'left';
    const crosses = (side) => (side === 'left' ? blocked(0, x) : blocked(x + w, 100));
    return crosses(near) && !crosses(far) ? far : near;
}

/**
 * Where each mark's disc goes, in pixels of the figure: in a margin beside the picture — never on
 * it, since whatever a disc covered would be the very thing being explained — on the side nearer
 * the thing it marks, level with its middle. Discs sharing a margin are pushed apart, downwards
 * first and then back up from the bottom, so none overlaps and none leaves the picture. Each is
 * joined by a hairline to the nearer edge of what it marks.
 */
function layout(marks, width, height, hasLeft) {
    const offset = hasLeft ? GUTTER : 0;
    const placed = marks.map((mark, index) => {
        const [x, y, w, h] = mark;
        const side = sideOf(mark, marks);
        const left = offset + (x / 100) * width;
        const target = {
            x: side === 'left' ? left : left + (w / 100) * width,
            y: ((y + h / 2) / 100) * height,
        };
        return { index, side, target, y: target.y, x: side === 'left' ? GUTTER / 2 : offset + width + GUTTER / 2 };
    });
    for (const side of ['left', 'right']) {
        const column = placed.filter((mark) => mark.side === side).sort((a, b) => a.y - b.y);
        const top = 12;
        const bottom = Math.max(top, height - 12);
        column.forEach((mark, i) => {
            mark.y = Math.max(mark.y, top, i ? column[i - 1].y + SPACING : top);
        });
        for (let i = column.length - 1; i >= 0; i--) {
            column[i].y = Math.min(column[i].y, i === column.length - 1 ? bottom : column[i + 1].y - SPACING);
        }
    }
    return placed.sort((a, b) => a.index - b.index);
}

/**
 * A screenshot of the real page, on a mat, with a numbered disc for each thing the captions below
 * it talk about — in the margin, joined to its thing by a hairline (`layout`), so no disc sits on
 * a word. Pointing at a caption outlines its thing on the picture and pointing at a disc lights
 * its caption, so a reader can go either way.
 *
 * <p>`cut` fades an edge where the picture is a slice of something longer (the milestone road).
 */
function GuideShot({ name, captions = [], cut = null }) {
    const theme = useTheme()?.theme;
    const [active, setActive] = useState(null);
    const [width, setWidth] = useState(0);
    const picture = useRef(null);
    const meta = shotMeta(name);

    useLayoutEffect(() => {
        const element = picture.current;
        if (!element) return undefined;
        setWidth(element.getBoundingClientRect().width);
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    if (!meta) return null;
    const marks = meta.marks.slice(0, captions.length);
    // Only a side a disc goes on gets a margin, so the picture keeps as much of its size as it can.
    const hasLeft = marks.some((mark) => sideOf(mark, marks) === 'left');
    const hasRight = marks.some((mark) => sideOf(mark, marks) === 'right');
    const height = width * (meta.h / meta.w);
    const placed = width ? layout(marks, width, height, hasLeft) : [];
    const toggle = (index) => setActive((current) => (current === index ? null : index));
    const hover = (index) => ({ onMouseEnter: () => setActive(index), onMouseLeave: () => setActive(null) });

    return (
        <figure className="flex flex-col gap-4">
            <div className="relative rounded-lg bg-bg ring-1 ring-border-light p-2.5 sm:p-3">
                <span className="absolute -top-2.5 end-3 z-10 px-2 py-0.5 rounded-sm border border-border-light bg-surface text-[0.65rem] font-semibold text-text-muted">
                    {t('guide.sheet.example')}
                </span>
                {/* Physical left and right, because the marks were measured on the picture as it is. */}
                <div className="relative" style={{ paddingLeft: hasLeft ? GUTTER : 0, paddingRight: hasRight ? GUTTER : 0 }}>
                    <div
                        ref={picture}
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
                    </div>

                    {width > 0 && (
                        <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                            {placed.map((mark) => {
                                const on = active === mark.index;
                                const from = mark.side === 'left' ? mark.x + 12 : mark.x - 12;
                                return (
                                    <g key={mark.index} className={`transition-opacity duration-150 ${active != null && !on ? 'opacity-30' : 'opacity-100'}`}>
                                        <line x1={from} y1={mark.y} x2={mark.target.x} y2={mark.target.y}
                                              className={on ? 'stroke-gold-ink' : 'stroke-gold'} strokeWidth={on ? 1.75 : 1.25} strokeLinecap="round" />
                                        <circle cx={mark.target.x} cy={mark.target.y} r={on ? 3.75 : 3}
                                                className={on ? 'fill-gold-ink stroke-surface' : 'fill-gold stroke-surface'} strokeWidth="1.5" />
                                    </g>
                                );
                            })}
                        </svg>
                    )}

                    {placed.map((mark) => (
                        <button
                            key={`mark-${mark.index}`}
                            type="button"
                            onClick={() => toggle(mark.index)}
                            {...hover(mark.index)}
                            aria-label={`${t('guide.sheet.mark', { n: mark.index + 1 })}: ${captions[mark.index]}`}
                            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:animate-[guide-pop_320ms_ease-out_both]"
                            style={{ left: mark.x, top: mark.y, animationDelay: `${120 + mark.index * 70}ms` }}
                        >
                            <MarkBadge n={mark.index + 1} active={active === mark.index} />
                        </button>
                    ))}
                </div>
            </div>
            {captions.length > 0 && (
                <ol className="flex flex-col gap-1.5">
                    {captions.map((caption, index) => (
                        <li key={caption}>
                            <button
                                type="button"
                                onClick={() => toggle(index)}
                                {...hover(index)}
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
