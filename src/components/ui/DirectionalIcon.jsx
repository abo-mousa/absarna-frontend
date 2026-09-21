import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { isRtl } from '@/i18n';

/**
 * Arrows and chevrons that mean "back" and "forward", not "left" and "right".
 *
 * <p><b>These are the icons a logical CSS property cannot fix.</b> Everything else in this app
 * mirrors by itself now — `ms-`/`me-`, `start-`/`end-`, `text-start` all resolve against
 * `<html dir>` — but an arrow is a *drawing*, and the drawing of a left-pointing arrow is a
 * different SVG from the drawing of a right-pointing one. On the Arabic build "back" points right,
 * exactly as the browser's own back button does under `dir="rtl"`; on the English build it points
 * left. The label beside it is what a reader acts on either way, and the glyph follows the label.
 *
 * <p><b>One module rather than a ternary at each of the fourteen call sites</b>, because the bug
 * this prevents is invisible: a chevron pointing the wrong way looks like an ordinary chevron, and
 * nothing renders red. A call site that says `ChevronBack` cannot be wrong about which way that
 * is; a call site that says `ChevronRight` is right about one build by accident.
 *
 * <p>Deliberately NOT a CSS mirror (`rtl:scale-x-[-1]`). It would work for a plain chevron and
 * quietly ruin anything with a corner, a hook or a caption in it, and the rule would then be "mirror
 * these icons but not those" — which is the decision this module is here to hold. The play triangle
 * in `VideoControlBar` IS mirrored that way, and it is a triangle, which is the whole argument.
 */

const props = (rest) => ({ 'aria-hidden': 'true', ...rest });

/** Towards the beginning: previous page, previous item, the way back. */
export const ChevronBack = (rest) => (isRtl()
    ? <ChevronRight {...props(rest)} />
    : <ChevronLeft {...props(rest)} />);

/** Towards the end: next page, next item, opening a submenu. */
export const ChevronForward = (rest) => (isRtl()
    ? <ChevronLeft {...props(rest)} />
    : <ChevronRight {...props(rest)} />);

/** The same two, drawn as a full arrow — "back to the library", "back to the channel". */
export const ArrowBack = (rest) => (isRtl()
    ? <ArrowRight {...props(rest)} />
    : <ArrowLeft {...props(rest)} />);

export const ArrowForward = (rest) => (isRtl()
    ? <ArrowLeft {...props(rest)} />
    : <ArrowRight {...props(rest)} />);
