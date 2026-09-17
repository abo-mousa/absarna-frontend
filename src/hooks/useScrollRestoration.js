import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { safeSessionStorage } from '@/lib/safeStorage';

const STORAGE_KEY = 'absarna.scroll';
const MAX_ENTRIES = 50;
const RESTORE_TIMEOUT_MS = 4000;

/**
 * What to do with the window's scroll position when the location changes.
 *
 * <ul>
 *   <li><b>Back/forward (POP) to a place we have a position for</b> — restore it. Also covers a
 *       reload, which React Router reports as POP with the same history key.</li>
 *   <li><b>A new page (PUSH to another pathname)</b> — the top. The browser does not reset scroll
 *       on `pushState`, so a video opened from far down a list opened far down the video page.</li>
 *   <li><b>Anything else</b> — leave it. That includes REPLACE, which is how a channel's tab and the
 *       dashboard's tab are written into the URL: switching tabs must not jump the page.</li>
 * </ul>
 */
export function scrollPlan({ navigationType, pathChanged, saved }) {
    if (navigationType === 'POP') {
        return typeof saved === 'number' && saved > 0 ? { type: 'restore', y: saved } : { type: 'none' };
    }
    if (navigationType === 'PUSH' && pathChanged) return { type: 'top' };
    return { type: 'none' };
}

/**
 * The positions map with `key` set to `y`, keeping only the most recent `MAX_ENTRIES` — a long
 * session would otherwise grow sessionStorage without bound.
 */
export function withPosition(positions, key, y) {
    const next = { ...positions };
    delete next[key];
    next[key] = Math.round(y);
    const keys = Object.keys(next);
    for (const stale of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) delete next[stale];
    return next;
}

// Through safeSessionStorage, which falls back to memory when storage is blocked: a position that
// cannot be stored is a position that is not restored, never an error.
const readPositions = () => {
    try {
        const parsed = JSON.parse(safeSessionStorage.getItem(STORAGE_KEY));
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};
const writePositions = (positions) => {
    safeSessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
};

/**
 * Scrolls to `y` as soon as the page is tall enough to hold it.
 *
 * <p><b>Why waiting is the whole problem.</b> Coming back, the page is re-rendered from nothing: the
 * route chunk may still be loading, and its lists come out of the query cache a render later. A
 * scroll to 2,000px on a 900px-tall document lands at the bottom of what exists — which is why the
 * browser's own restoration, which runs once and at once, left a return from a series at the top of
 * the channel. Stops at the first sign the reader has started scrolling themselves.
 */
function restoreWhenReachable(y) {
    const deadline = performance.now() + RESTORE_TIMEOUT_MS;
    let frame = 0;
    const interrupts = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    const stop = () => {
        cancelAnimationFrame(frame);
        interrupts.forEach((type) => window.removeEventListener(type, stop));
    };
    const attempt = () => {
        const reachable = document.documentElement.scrollHeight - window.innerHeight;
        if (reachable >= y || performance.now() > deadline) {
            window.scrollTo(0, Math.min(y, Math.max(0, reachable)));
            stop();
            return;
        }
        frame = requestAnimationFrame(attempt);
    };
    interrupts.forEach((type) => window.addEventListener(type, stop, { passive: true }));
    attempt();
    return stop;
}

/**
 * Puts the window back where it was when the reader returns to a page — so Back from a series lands
 * on the series that was opened, not at the top of the channel. Mounted once, inside the router.
 */
export function useScrollRestoration() {
    const location = useLocation();
    const navigationType = useNavigationType();
    const previousPath = useRef(location.pathname);

    useEffect(() => {
        if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    }, []);

    // Layout effects, not effects, for both: a layout effect's cleanup runs in the same commit as
    // the route change, so the outgoing page's listener is gone before the new page's shorter
    // document can clamp the scroll and report that as where the old page was.
    useLayoutEffect(() => {
        const key = location.key;
        let frame = 0;
        const record = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                writePositions(withPosition(readPositions(), key, window.scrollY));
            });
        };
        window.addEventListener('scroll', record, { passive: true });
        return () => {
            window.removeEventListener('scroll', record);
            cancelAnimationFrame(frame);
        };
    }, [location.key]);

    useLayoutEffect(() => {
        const pathChanged = previousPath.current !== location.pathname;
        previousPath.current = location.pathname;
        const plan = scrollPlan({ navigationType, pathChanged, saved: readPositions()[location.key] });
        if (plan.type === 'top') window.scrollTo(0, 0);
        if (plan.type === 'restore') return restoreWhenReachable(plan.y);
        return undefined;
        // navigationType changes only together with the key.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.key]);
}
