import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { t } from '@/i18n';

/**
 * Long prose, collapsed to a few lines with a control to open it.
 *
 * <p><b>Why a video description needs this at all.</b> An imported YouTube description is not a
 * paragraph — it is a paragraph, then a table of contents, then links to four other channels, then
 * a standing block of hashtags. Rendered whole it is routinely longer than everything else on the
 * page put together, and it pushes the series navigation and the comments below the fold on a
 * video nobody has finished watching. Collapsed, the page reads as a video with a description;
 * expanded, nothing is lost.
 *
 * <p><b>The toggle appears only when it does something.</b> A "عرض المزيد" under a one-line
 * description is a control that opens nothing, and a reader who presses it twice learns to
 * distrust the one on the next video that is real. So the button is rendered from a measurement,
 * not from a guess.
 *
 * <p><b>Measured rather than counted.</b> Deciding from the string — over N characters, over N
 * newlines — is cheaper and wrong in both directions: whether text overflows four lines depends on
 * the width it is laid out in and the face it is laid out with, and this page is 900px on a desktop
 * and 340 on a phone. The measurement compares the content's natural height against the clamped
 * box, which is the actual question.
 *
 * <p>Three things move that height after the first paint, and one observer covers all of them:
 * the column resizes (rotation, a desktop window drag), the text changes (navigating to the next
 * video re-uses this component), and — the one that is easy to miss — the Arabic webfont arrives.
 * `index.html` asks for IBM Plex Sans Arabic with `display=swap`, so the first measurement runs
 * against a fallback face and the text reflows underneath it a moment later, which is enough to
 * carry a description across the four-line line either way. The inner element is what is observed
 * because it is the one with no height constraint: the outer box is pinned by `max-height` and
 * would report the same number whatever it holds.
 *
 * <p>Nothing is measured while it is open. Expanded, the box is exactly as tall as its content, so
 * the comparison would answer "fits" and remove the only control that closes it again.
 */
function ExpandableText({
    children,
    // Four lines at this page's `leading-loose`. A collapsed height rather than `line-clamp`
    // because this wraps arbitrary children — `line-clamp` needs `display: -webkit-box` on the
    // element holding the text itself, and LinkifiedText's `<p>` is one level down.
    collapsedClassName = 'max-h-32',
    // The ground the fade resolves into. Both callers sit on `bg-surface`; a card on a different
    // background has to say so, or the gradient ends in the wrong colour.
    fadeClassName = 'from-surface',
    className = '',
}) {
    const [expanded, setExpanded] = useState(false);
    const [overflowing, setOverflowing] = useState(false);
    const outerRef = useRef(null);
    const innerRef = useRef(null);
    const regionId = useId();

    useEffect(() => {
        if (expanded) return undefined;

        const outer = outerRef.current;
        const inner = innerRef.current;
        if (!outer || !inner) return undefined;

        // A pixel of slack: a sub-pixel line height rounds the two apart on a scaled display and
        // would offer to expand a description that is already whole.
        const measure = () => setOverflowing(inner.offsetHeight > outer.clientHeight + 1);
        measure();

        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(inner);
        observer.observe(outer);
        return () => observer.disconnect();
    }, [expanded]);

    return (
        <div className={className}>
            <div
                ref={outerRef}
                id={regionId}
                className={`relative ${expanded ? '' : `overflow-hidden ${collapsedClassName}`}`}
            >
                <div ref={innerRef}>{children}</div>

                {/* The cut edge, softened. A hard crop mid-line reads as a rendering fault; a fade
                    reads as "there is more", which is what the button then offers. Decorative and
                    `aria-hidden`, and `pointer-events-none` so it cannot eat a click on a link in
                    the last visible line. */}
                {!expanded && overflowing && (
                    <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-0 bottom-0 h-10
                            bg-gradient-to-t ${fadeClassName} to-transparent`}
                    />
                )}
            </div>

            {overflowing && (
                <button
                    type="button"
                    onClick={() => setExpanded((open) => !open)}
                    // `aria-expanded` plus `aria-controls` is the disclosure contract: the name
                    // stays the visible words, and the state is carried by the attribute rather
                    // than inferred from them.
                    aria-expanded={expanded}
                    aria-controls={regionId}
                    className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary
                        hover:underline focus:outline-none focus-visible:ring-2
                        focus-visible:ring-primary rounded-sm"
                >
                    {expanded ? t('common.showLess') : t('common.showMore')}
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            )}
        </div>
    );
}

export default ExpandableText;
