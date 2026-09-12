import { useCallback, useEffect, useState } from 'react';
import { safeStorage } from '@/lib/safeStorage';
import { RATE_STORAGE_KEY, sanitizeRate } from '@/lib/player/rate';

/**
 * The playback speed, kept across videos and across source swaps.
 *
 * <p>Restored from the last video watched rather than reset per video: someone who watches
 * lectures at 1.5× wants 1.5×, not to re-pick it every time.
 *
 * <p>Two things fight it and both are handled here. The media load algorithm resets
 * `playbackRate` to `defaultPlaybackRate` on every new source, and a rung swap IS a new source —
 * so both properties are assigned together. And Chrome and Safari offer speed in their own control
 * menus, so a rate the *browser* changed is mirrored back rather than overwritten on the next
 * render.
 *
 * @param ready false while the <video> does not exist yet — before the signed URL arrives
 */
export function usePlaybackRate(videoRef, ready) {
    const [playbackRate, setPlaybackRate] = useState(
        () => sanitizeRate(safeStorage.getItem(RATE_STORAGE_KEY)),
    );

    const remember = useCallback((raw) => {
        const rate = sanitizeRate(raw);
        setPlaybackRate(rate);
        safeStorage.setItem(RATE_STORAGE_KEY, String(rate));
    }, []);

    useEffect(() => {
        const el = videoRef.current;
        if (!el || !ready) return;
        el.defaultPlaybackRate = playbackRate;
        el.playbackRate = playbackRate;
    }, [playbackRate, ready, videoRef]);

    /** Re-applied on every source load, which is what makes the rate survive a rung swap. */
    const applyTo = useCallback((el) => {
        el.playbackRate = playbackRate;
    }, [playbackRate]);

    return { playbackRate, selectRate: remember, mirrorBrowserRate: remember, applyTo };
}
