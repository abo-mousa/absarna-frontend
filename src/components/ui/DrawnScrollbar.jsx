import { useCallback, useEffect, useRef, useState } from 'react';

/** The handle never shrinks below this, so a long page still gives the hand something to hold. */
const MIN_THUMB = 40;
/** How long the handle stays after the last scroll before it fades. */
const LINGER_MS = 900;

/**
 * The platform's scrollbar, drawn by us: a rounded gold handle carrying the logo's stars
 * (`.drawn-thumb`, index.css) that appears while something scrolls and fades a moment after.
 *
 * <p><b>Drawn, because browsers disagree about their own.</b> Whether a native bar is always there
 * or only while scrolling, which side it sits on, and whether it can carry stars at all differ by
 * browser and by the reader's system settings — Firefox allows two colours, Safari moved an Arabic
 * page's bar to the left. The product owner's rule (2026-09-26): the same in every browser, and
 * only while scrolling. The native bar of what this shadows is hidden, and the SCROLLING stays
 * native — wheel, trackpad, touch, keyboard, find-in-page, focus all behave as before; this only
 * mirrors the position, and lets the handle be dragged or the track clicked. It is `aria-hidden`:
 * the scrolling is the accessible part, and a fake scrollbar announced to a screen reader would
 * only confuse.
 *
 * @param target      'window' for the page, or a ref to a scrolling element
 * @param className   placement and look of the track (the side column's is its gold double rule)
 * @param trackAlways keep the track drawn when idle (the column's rule is part of its frame);
 *                    the handle still appears only while scrolling
 */
function DrawnScrollbar({ target, className = '', trackAlways = false }) {
    const trackRef = useRef(null);
    const drag = useRef(null);
    const hideTimer = useRef(null);
    const [thumb, setThumb] = useState({ size: 0, offset: 0 });
    const [active, setActive] = useState(false);
    const [held, setHeld] = useState(false);

    const isWindow = target === 'window';
    const metrics = useCallback(() => {
        if (isWindow) {
            const root = document.documentElement;
            return { scrollTop: window.scrollY, scrollHeight: root.scrollHeight, clientHeight: window.innerHeight };
        }
        const el = target?.current;
        return el ? { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight } : null;
    }, [isWindow, target]);

    const scrollTo = useCallback((top, smooth = false) => {
        const el = isWindow ? window : target?.current;
        el?.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    }, [isWindow, target]);

    const measure = useCallback(() => {
        const m = metrics();
        const track = trackRef.current;
        if (!m || !track) return;
        const trackSize = track.clientHeight;
        if (m.scrollHeight <= m.clientHeight + 1 || trackSize <= 0) {
            setThumb((current) => (current.size === 0 ? current : { size: 0, offset: 0 }));
            return;
        }
        const size = Math.max(MIN_THUMB, Math.round(trackSize * (m.clientHeight / m.scrollHeight)));
        const range = m.scrollHeight - m.clientHeight;
        const offset = Math.round((Math.min(Math.max(m.scrollTop, 0), range) / range) * (trackSize - size));
        setThumb((current) => (current.size === size && current.offset === offset ? current : { size, offset }));
    }, [metrics]);

    // A scroll shows the handle and restarts the countdown to hiding it. Measured right here:
    // browsers already deliver scroll at most once a frame, and `measure` sets state only when
    // the handle actually moved.
    const onScroll = useCallback(() => {
        measure();
        setActive(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setActive(false), LINGER_MS);
    }, [measure]);

    useEffect(() => {
        const source = isWindow ? window : target?.current;
        if (!source) return undefined;
        measure();
        source.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', measure);
        // Content growing (a list loading its next page) moves the handle too.
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
        if (observer) {
            if (isWindow) {
                observer.observe(document.body);
            } else {
                observer.observe(source);
                Array.from(source.children).forEach((child) => observer.observe(child));
            }
        }
        return () => {
            source.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', measure);
            observer?.disconnect();
            clearTimeout(hideTimer.current);
        };
    }, [isWindow, target, measure, onScroll]);

    // Dragging the handle: movement along the track maps onto the scroll range.
    const onThumbDown = (event) => {
        const m = metrics();
        const track = trackRef.current;
        if (!m || !track) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setHeld(true);
        drag.current = {
            startY: event.clientY,
            startScroll: m.scrollTop,
            ratio: (m.scrollHeight - m.clientHeight) / Math.max(1, track.clientHeight - thumb.size),
        };
    };
    const onThumbMove = (event) => {
        if (!drag.current) return;
        scrollTo(drag.current.startScroll + (event.clientY - drag.current.startY) * drag.current.ratio);
    };
    const onThumbUp = (event) => {
        drag.current = null;
        setHeld(false);
        event.currentTarget.releasePointerCapture?.(event.pointerId);
    };

    // A click on the track pages towards it, as a browser's own track does.
    const onTrackDown = (event) => {
        const m = metrics();
        const track = trackRef.current;
        if (!m || !track || thumb.size === 0) return;
        const clickY = event.clientY - track.getBoundingClientRect().top;
        const direction = clickY < thumb.offset ? -1 : 1;
        scrollTo(m.scrollTop + direction * m.clientHeight * 0.9, true);
    };

    // Shown while scrolling, while the pointer rests on the track, and while dragging.
    const shown = active || held;
    return (
        <div
            ref={trackRef}
            aria-hidden="true"
            onPointerDown={onTrackDown}
            onPointerEnter={() => {
                // Resting the pointer on the edge reveals the handle, as a system bar does.
                clearTimeout(hideTimer.current);
                if (thumb.size > 0) setActive(true);
            }}
            onPointerLeave={() => {
                clearTimeout(hideTimer.current);
                hideTimer.current = setTimeout(() => setActive(false), LINGER_MS);
            }}
            className={`drawn-track ${className} ${trackAlways || shown ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        >
            {thumb.size > 0 && (
                <div
                    onPointerDown={onThumbDown}
                    onPointerMove={onThumbMove}
                    onPointerUp={onThumbUp}
                    onPointerCancel={onThumbUp}
                    className={`drawn-thumb absolute inset-x-[2px] touch-none transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}
                    style={{ height: `${thumb.size}px`, transform: `translateY(${thumb.offset}px)` }}
                />
            )}
        </div>
    );
}

export default DrawnScrollbar;
