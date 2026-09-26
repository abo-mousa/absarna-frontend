import { useCallback, useEffect, useRef, useState } from 'react';

/** The handle never shrinks below this, so a long column still gives the hand something to hold. */
const MIN_THUMB = 40;

/**
 * The side column's scrollbar, drawn by us rather than by the browser: the gold double rule down
 * the column's inner edge is its track, and a gold handle carrying the logo's stars rides between
 * its lines (`.rail-track` / `.rail-thumb`, index.css).
 *
 * <p><b>Drawn, because Firefox cannot draw it.</b> A browser's own scrollbar can be styled only in
 * Chromium and Safari; Firefox allows two colours and a width, so the stars — the part that makes it
 * the platform's — were missing there. This is an ordinary element, identical in every browser.
 * The column's native scrollbar is hidden (`.rail-scroller`) and it still scrolls exactly as
 * before — wheel, trackpad, touch, keyboard, focus — this only mirrors that scroll and lets the
 * handle be dragged or the track clicked. It is `aria-hidden`: the scrolling itself is the
 * accessible part, and a second, fake scrollbar announced to a screen reader would only confuse.
 *
 * @param scrollerRef the column's scrolling element
 */
function RailScrollbar({ scrollerRef }) {
    const trackRef = useRef(null);
    const [thumb, setThumb] = useState({ size: 0, offset: 0 });
    const drag = useRef(null);

    const measure = useCallback(() => {
        const scroller = scrollerRef.current;
        const track = trackRef.current;
        if (!scroller || !track) return;
        const { scrollHeight, clientHeight, scrollTop } = scroller;
        const trackSize = track.clientHeight;
        if (scrollHeight <= clientHeight + 1 || trackSize <= 0) {
            setThumb({ size: 0, offset: 0 });
            return;
        }
        const size = Math.max(MIN_THUMB, Math.round(trackSize * (clientHeight / scrollHeight)));
        const offset = Math.round((scrollTop / (scrollHeight - clientHeight)) * (trackSize - size));
        setThumb((current) => (current.size === size && current.offset === offset ? current : { size, offset }));
    }, [scrollerRef]);

    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return undefined;
        measure();
        scroller.addEventListener('scroll', measure, { passive: true });
        // The column's own size (the window) and its content's (a list loading its next page)
        // both move the handle.
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
        if (observer) {
            observer.observe(scroller);
            Array.from(scroller.children).forEach((child) => observer.observe(child));
        }
        return () => {
            scroller.removeEventListener('scroll', measure);
            observer?.disconnect();
        };
    }, [scrollerRef, measure]);

    // Dragging the handle: pointer movement along the track maps to the scroll range.
    const onThumbDown = (event) => {
        const scroller = scrollerRef.current;
        const track = trackRef.current;
        if (!scroller || !track) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        drag.current = {
            startY: event.clientY,
            startScroll: scroller.scrollTop,
            ratio: (scroller.scrollHeight - scroller.clientHeight) / Math.max(1, track.clientHeight - thumb.size),
        };
    };
    const onThumbMove = (event) => {
        const scroller = scrollerRef.current;
        if (!drag.current || !scroller) return;
        scroller.scrollTop = drag.current.startScroll + (event.clientY - drag.current.startY) * drag.current.ratio;
    };
    const onThumbUp = (event) => {
        drag.current = null;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
    };

    // A click on the track pages towards it, as a browser's own track does.
    const onTrackDown = (event) => {
        const scroller = scrollerRef.current;
        const track = trackRef.current;
        if (!scroller || !track || thumb.size === 0) return;
        const clickY = event.clientY - track.getBoundingClientRect().top;
        const direction = clickY < thumb.offset ? -1 : 1;
        scroller.scrollBy({ top: direction * scroller.clientHeight * 0.9, behavior: 'smooth' });
    };

    return (
        <div
            ref={trackRef}
            aria-hidden="true"
            onPointerDown={onTrackDown}
            className="rail-track absolute inset-y-0 end-0 w-[12px]"
        >
            {thumb.size > 0 && (
                <div
                    onPointerDown={onThumbDown}
                    onPointerMove={onThumbMove}
                    onPointerUp={onThumbUp}
                    onPointerCancel={onThumbUp}
                    className="rail-thumb absolute inset-x-px touch-none"
                    style={{ height: `${thumb.size}px`, transform: `translateY(${thumb.offset}px)` }}
                />
            )}
        </div>
    );
}

export default RailScrollbar;
