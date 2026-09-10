import { useCallback, useEffect, useRef, useState } from 'react';
import { Airplay, Loader2, Maximize, Minimize, Pause, Play, Volume1, Volume2, VolumeX } from 'lucide-react';
import { safeStorage } from '@/lib/safeStorage';
import { t } from '@/i18n';
import PlayerSettingsMenu from './PlayerSettingsMenu';

/**
 * The player's control bar — ours, not the browser's.
 *
 * <p><b>Why replace something every browser gives for free.</b> A browser renders only the
 * fullscreen element's own subtree, so any control that is a sibling of the `<video>` — a quality
 * selector, a settings menu — does not exist while the `<video>` is fullscreen. That cannot be
 * fixed from outside the bar: the native fullscreen button targets the element itself, re-pointing
 * the request at our wrapper needs a *second* fullscreen request that the browser is free to
 * refuse, and Safari's button does not use that API at all — it puts the element into its own
 * presentation mode, where there is nothing to re-point. Nor can a button be added to the native
 * bar: it lives in a closed shadow root. So `controls` is off and this is the bar, which also
 * settles button order, RTL, and one look in every browser.
 *
 * <p><b>The timeline is left-to-right, in an app that is otherwise entirely RTL.</b> Time flows
 * left to right regardless of language — that is how every clock, every progress bar and YouTube
 * in Arabic read it — so only the *button order* mirrors: the bar declares `dir="ltr"` and the
 * settings panel re-asserts `rtl` for its prose. Arrow keys follow the timeline, not the document:
 * Right seeks forward.
 *
 * <p><b>Element state is read here, not in `VideoPlayer`.</b> `timeupdate` fires several times a
 * second; holding the playhead in the player's own state would re-render the `<video>`, the hls.js
 * wiring and the whole settings tree on every tick. This component subscribes to the element
 * directly and re-renders alone.
 *
 * @param videoRef  the `<video>` — a ref rather than the node, since it does not exist on the
 *                  renders before the signed URL arrives
 * @param mediaKey  changes when the element's source does (a rung swap), to re-read its state
 * @param durationHint  the catalogue's `VideoDTO.duration` string, shown until the element itself
 *                  knows the length — which on the HLS path is not until the first play
 * @param visible   whether the bar is showing; it fades on idle like the bar it replaces
 * @param isFullscreen / onToggleFullscreen  owned by `VideoPlayer`, which holds the wrapper that
 *                  actually goes fullscreen
 * @param groups / toggles  passed straight through to `PlayerSettingsMenu`
 * @param onInteract  any use of the bar counts as activity, so it does not fade mid-drag
 * @param onMenuOpenChange  the bar must stay up while the settings panel is open
 */

// Volume survives the video, like playback speed: a viewer who watches lectures quietly should
// not re-set it on every one. Through safeStorage because bare localStorage *throws* where a
// browser blocks site data.
const VOLUME_STORAGE_KEY = 'playerVolume';
const MUTED_STORAGE_KEY = 'playerMuted';

/** How far one arrow-key press seeks, and how much it moves the volume. */
export const SEEK_STEP_SECONDS = 5;
export const VOLUME_STEP = 0.1;

/**
 * A duration as a viewer reads it: `12:04`, and `1:04:22` once there is an hour to show.
 *
 * <p>Latin digits by construction, like every other number in this app (`lib/numbers.js`) — a
 * timeline reading «١٢:٠٤» beside a «45» view count is the inconsistency the counts already had.
 * Hours are omitted entirely rather than shown as `0:12:04`, and minutes are not zero-padded at
 * the front, so a short clip reads `4:07` rather than `04:07`.
 *
 * <p>Exported and tested because every edge here is reachable and none of them is visible in a
 * happy-path browser check: `duration` is `NaN` before metadata arrives, `Infinity` for a stream
 * whose length the server never states, and a hair under a whole number for most files — where
 * rounding rather than flooring would show a video ending at `45:00` as `45:00` while the playhead
 * still reads `44:59`.
 */
export const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const total = Math.floor(seconds);
    const pad = (value) => String(value).padStart(2, '0');
    const secs = total % 60;
    const mins = Math.floor(total / 60) % 60;
    const hours = Math.floor(total / 3600);
    return hours > 0 ? `${hours}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
};

/**
 * The catalogue's own duration string — `"11:20"`, `"1:04:22"` — as seconds.
 *
 * <p><b>Why the bar needs this at all.</b> On the HLS path the element does not know how long the
 * video is until the *level* playlist is loaded, and `autoStartLoad: false` (see VideoPlayer)
 * deliberately defers that until the first play — the master manifest is parsed, which is where
 * the quality list comes from, but nothing else is fetched. So the clock read `--:--` until
 * playback began, on a page that had the answer all along: `VideoDTO.duration` is right there next
 * to the title. Rather than fetch a playlist to learn something the API already said, the string
 * is parsed and shown until the element knows better. (A progressive MP4 never had this problem —
 * `preload="metadata"` gives it a duration before play.)
 *
 * <p>Exported and tested because it parses a value formatted by another service: anything
 * unexpected must read as "unknown", which the bar already renders as `--:--`, rather than become
 * a `NaN` that ends up in a width or an ARIA value.
 */
export const parseDuration = (value) => {
    if (typeof value !== 'string') return NaN;
    const parts = value.trim().split(':');
    if (parts.length < 2 || parts.length > 3) return NaN;
    let seconds = 0;
    for (const part of parts) {
        // Two digits, or three for an hours field that has run away — never a sign, a decimal or
        // an empty segment, all of which `Number` would happily accept.
        if (!/^\d{1,3}$/.test(part)) return NaN;
        seconds = seconds * 60 + Number(part);
    }
    return seconds;
};

/**
 * Where along the timeline a pointer is, as 0…1.
 *
 * <p>Exported and tested because it is the arithmetic behind every scrub, and its failures are
 * silent: a click on the very edge of the track, a drag that continues outside the player (pointer
 * capture keeps sending moves from anywhere on screen, including negative coordinates), and a
 * zero-width track during the first layout pass — which would otherwise divide by zero and seek to
 * `NaN`, an assignment the element rejects, leaving a dead timeline with nothing logged.
 */
export const ratioFromPointer = (clientX, rect) => {
    if (!rect || !rect.width) return 0;
    const ratio = (clientX - rect.left) / rect.width;
    return Math.min(1, Math.max(0, ratio));
};

/**
 * The keyboard map, as data.
 *
 * <p>Exported and tested because it is the part of the bar a mouse never exercises: the shortcuts
 * are the only controls with no visible affordance, so a missing case is invisible until someone
 * presses the key. Space is deliberately included alongside `k`, `f` and `m` — the keys every
 * video player has trained people to expect — and Right is *forward* because the timeline runs
 * left to right even here (see above).
 */
export const keyboardAction = (key) => {
    switch (key) {
        case ' ':
        case 'k':
            return 'toggle-play';
        case 'ArrowRight':
            return 'seek-forward';
        case 'ArrowLeft':
            return 'seek-back';
        case 'ArrowUp':
            return 'volume-up';
        case 'ArrowDown':
            return 'volume-down';
        case 'f':
            return 'toggle-fullscreen';
        case 'm':
            return 'toggle-mute';
        default:
            return null;
    }
};

/** The volume icon has three states, because "on" and "quiet" are worth telling apart. */
const VolumeIcon = ({ muted, volume }) => {
    if (muted || volume === 0) return <VolumeX size={18} />;
    return volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />;
};

export default function VideoControlBar({
    videoRef,
    mediaKey,
    durationHint,
    visible = true,
    isFullscreen = false,
    onToggleFullscreen,
    groups = [],
    toggles = [],
    onInteract,
    onMenuOpenChange,
}) {
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(NaN);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [airplayAvailable, setAirplayAvailable] = useState(false);
    // Stalled waiting for data. The native bar drew a spinner for this and a hand-built one has
    // to as well: on the hls.js path a press of play fetches a manifest and two segments before
    // anything moves, and a player that shows a frozen frame with no spinner reads as broken
    // rather than as loading.
    const [buffering, setBuffering] = useState(false);
    // While dragging, the timeline shows where the pointer is and the video does not move: an HLS
    // seek per pointer-move would ask the network for a segment the viewer is already scrubbing
    // past. The seek is committed once, on release.
    const [scrubTime, setScrubTime] = useState(null);
    const trackRef = useRef(null);
    // Volume is applied to the element once per element, not per bind: `mediaKey` re-binds these
    // listeners on a rung swap, but volume and muted survive a source change on their own, and
    // re-applying the stored value would undo a change the viewer made in between.
    const volumeAppliedRef = useRef(false);

    /**
     * Mirrors the element into state.
     *
     * <p>Everything here is read from the element rather than assumed, because plenty of it
     * happens without us: the media keys and the OS media panel play and pause, a rung swap
     * reloads the source, and `loadedmetadata` restores a deep-linked position.
     */
    useEffect(() => {
        const el = videoRef.current;
        if (!el || !mediaKey) return undefined;

        if (!volumeAppliedRef.current) {
            volumeAppliedRef.current = true;
            const stored = Number(safeStorage.getItem(VOLUME_STORAGE_KEY));
            if (Number.isFinite(stored) && stored >= 0 && stored <= 1) el.volume = stored;
            if (safeStorage.getItem(MUTED_STORAGE_KEY) === 'true') el.muted = true;
        }

        const syncPlayState = () => setPlaying(!el.paused && !el.ended);
        const syncTime = () => setCurrentTime(el.currentTime);
        const syncDuration = () => setDuration(el.duration);
        const syncVolume = () => {
            setVolume(el.volume);
            setMuted(el.muted);
        };
        const syncBuffered = () => {
            // The range the playhead is inside, not the last one: a viewer who has jumped around
            // leaves several disjoint buffered ranges behind, and painting the furthest of them
            // would claim the gap in between is ready to play.
            let ahead = el.currentTime;
            for (let i = 0; i < el.buffered.length; i += 1) {
                if (el.buffered.start(i) <= el.currentTime && el.buffered.end(i) >= el.currentTime) {
                    ahead = el.buffered.end(i);
                    break;
                }
            }
            setBuffered(ahead);
        };

        syncPlayState();
        syncTime();
        syncDuration();
        syncVolume();

        const events = [
            ['play', syncPlayState],
            ['pause', syncPlayState],
            ['ended', syncPlayState],
            ['timeupdate', syncTime],
            ['seeked', syncTime],
            ['durationchange', syncDuration],
            ['loadedmetadata', syncDuration],
            ['progress', syncBuffered],
            ['timeupdate', syncBuffered],
            ['volumechange', syncVolume],
            ['waiting', () => setBuffering(true)],
            ['seeking', () => setBuffering(true)],
            ['stalled', () => setBuffering(true)],
            ['playing', () => setBuffering(false)],
            ['canplay', () => setBuffering(false)],
            ['seeked', () => setBuffering(false)],
            ['pause', () => setBuffering(false)],
            ['error', () => setBuffering(false)],
        ];
        for (const [event, handler] of events) el.addEventListener(event, handler);
        return () => {
            for (const [event, handler] of events) el.removeEventListener(event, handler);
        };
    }, [videoRef, mediaKey]);

    /**
     * AirPlay, offered only once the browser says a receiver is there.
     *
     * <p>This is the one thing the native bar gave for free that a custom bar has to earn back, and
     * it matters for this catalogue: a lecture is exactly the kind of thing someone sends to a
     * television. The availability event is Safari-only and fires again whenever a receiver
     * appears or goes away, so the button comes and goes with it rather than being a dead control
     * on every other browser.
     */
    useEffect(() => {
        const el = videoRef.current;
        if (!el || !mediaKey || !window.WebKitPlaybackTargetAvailabilityEvent) return undefined;
        const sync = (e) => setAirplayAvailable(e.availability === 'available');
        el.addEventListener('webkitplaybacktargetavailabilitychanged', sync);
        return () => el.removeEventListener('webkitplaybacktargetavailabilitychanged', sync);
    }, [videoRef, mediaKey]);

    const togglePlay = () => {
        const el = videoRef.current;
        if (!el) return;
        // Ignored rather than surfaced: autoplay policy can refuse a play(), and the viewer
        // pressing the button again is a perfectly good outcome.
        if (el.paused || el.ended) el.play().catch(() => {});
        else el.pause();
    };

    const seekTo = (seconds) => {
        const el = videoRef.current;
        if (!el || !Number.isFinite(el.duration)) return;
        el.currentTime = Math.min(el.duration, Math.max(0, seconds));
    };

    const changeVolume = (value) => {
        const el = videoRef.current;
        if (!el) return;
        const next = Math.min(1, Math.max(0, value));
        el.volume = next;
        // Moving the slider off zero is also how a viewer un-mutes: leaving `muted` set would
        // make the slider look like it does nothing.
        if (next > 0 && el.muted) el.muted = false;
        safeStorage.setItem(VOLUME_STORAGE_KEY, String(next));
        safeStorage.setItem(MUTED_STORAGE_KEY, String(el.muted));
    };

    const toggleMute = () => {
        const el = videoRef.current;
        if (!el) return;
        el.muted = !el.muted;
        safeStorage.setItem(MUTED_STORAGE_KEY, String(el.muted));
    };

    // --- Scrubbing. Pointer capture, so a drag that leaves the player (or the window) keeps
    // controlling the timeline instead of stopping wherever the pointer crossed the edge.
    const handleTrackPointerDown = (e) => {
        if (!Number.isFinite(duration)) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setScrubTime(ratioFromPointer(e.clientX, trackRef.current?.getBoundingClientRect()) * duration);
        onInteract?.();
    };

    const handleTrackPointerMove = (e) => {
        if (scrubTime === null) return;
        setScrubTime(ratioFromPointer(e.clientX, trackRef.current?.getBoundingClientRect()) * duration);
        onInteract?.();
    };

    const handleTrackPointerUp = (e) => {
        if (scrubTime === null) return;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        seekTo(scrubTime);
        setScrubTime(null);
    };

    // The slider's own arrows, kept from also reaching the player's shortcut handler and seeking
    // twice.
    const handleTrackKeyDown = (e) => {
        const action = keyboardAction(e.key);
        if (action !== 'seek-forward' && action !== 'seek-back') return;
        e.preventDefault();
        e.stopPropagation();
        seekTo(currentTime + (action === 'seek-forward' ? SEEK_STEP_SECONDS : -SEEK_STEP_SECONDS));
    };

    const handleMenuOpenChange = useCallback((open) => onMenuOpenChange?.(open), [onMenuOpenChange]);

    const shownTime = scrubTime ?? currentTime;
    // What the viewer is told, versus what the element will actually accept a seek against. The
    // hint is good enough to print and to announce; it is NOT good enough to seek by, so every
    // interaction below still gates on the element's own `duration` (a scrub that moved the handle
    // and then did nothing on release is worse than one that never moved).
    const hintedDuration = parseDuration(durationHint);
    const knowsDuration = Number.isFinite(duration) && duration > 0;
    const shownDuration = knowsDuration ? duration : hintedDuration;
    const scale = Number.isFinite(shownDuration) && shownDuration > 0 ? shownDuration : 0;
    const playedRatio = scale ? shownTime / scale : 0;
    const bufferedRatio = scale ? buffered / scale : 0;
    // The gradient stop below, as a whole number: a slider at 0.35 must paint 35% of the track.
    const volumePercent = Math.round((muted ? 0 : volume) * 100);
    const iconButtonClass = `flex items-center justify-center w-8 h-8 rounded-full text-white
        transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2
        focus-visible:ring-white`;

    return (
        <>
            {buffering && (
                <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    role="status"
                    aria-label={t('video.controls.buffering')}
                >
                    <Loader2 size={40} className="animate-spin text-white/90" />
                </div>
            )}

            <div
                // `dir="ltr"`: only the button ORDER mirrors, not the timeline — see the note above.
                dir="ltr"
                // `pointer-events-none` on the wrapper with the row re-enabling them, so the scrim over
                // the bottom of the picture never swallows a click meant for the video.
                className={`absolute inset-x-0 bottom-0 z-10 pointer-events-none transition-opacity
                    duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
                onPointerMove={onInteract}
            >
                {/* A scrim, because white controls over a bright frame are unreadable, and a solid bar
                    would cover picture the viewer is watching. */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <div className="relative flex flex-col gap-0.5 px-2 pb-1.5 pt-6 pointer-events-auto sm:px-3 sm:pb-2">
                    <div
                        ref={trackRef}
                        role="slider"
                        tabIndex={0}
                        aria-label={t('video.controls.seek')}
                        aria-valuemin={0}
                        aria-valuemax={Number.isFinite(shownDuration) ? Math.floor(shownDuration) : 0}
                    // The length is known but the media is not loaded yet: honest about the fact
                    // that this cannot be dragged until playback starts.
                    aria-disabled={!knowsDuration}
                        aria-valuenow={Math.floor(shownTime)}
                        // A screen reader reading "1263" for a position is useless; the two clock
                        // values are what a viewer would say out loud.
                        aria-valuetext={t('video.controls.timeOf', {
                            current: formatTime(shownTime),
                            total: formatTime(shownDuration),
                        })}
                        onPointerDown={handleTrackPointerDown}
                        onPointerMove={handleTrackPointerMove}
                        onPointerUp={handleTrackPointerUp}
                        onPointerCancel={handleTrackPointerUp}
                        onKeyDown={handleTrackKeyDown}
                        className="group relative flex h-4 cursor-pointer items-center touch-none
                            focus:outline-none"
                    >
                        <div className="relative h-1 w-full rounded-full bg-white/30 transition-[height]
                            group-hover:h-1.5 group-focus-visible:h-1.5">
                            {/* Buffered, then played on top of it, then the handle. */}
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-white/40"
                                style={{ width: `${Math.min(100, bufferedRatio * 100)}%` }}
                            />
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                                style={{ width: `${Math.min(100, playedRatio * 100)}%` }}
                            />
                            <div
                                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2
                                    rounded-full bg-primary opacity-0 transition-opacity
                                    group-hover:opacity-100 group-focus-visible:opacity-100"
                                style={{ left: `${Math.min(100, playedRatio * 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            type="button"
                            onClick={togglePlay}
                            aria-label={playing ? t('video.controls.pause') : t('video.controls.play')}
                            className={iconButtonClass}
                        >
                            {playing ? <Pause size={18} /> : <Play size={18} />}
                        </button>

                        {/* Tabular figures, or the whole row twitches sideways once a second as the
                            digits change width. */}
                        <span className="text-xs text-white/90 tabular-nums">
                            {formatTime(shownTime)} / {formatTime(shownDuration)}
                        </span>

                        <div className="flex-1" />

                        {/* The volume group: the slider is revealed by hover or focus, the way every
                            player does it, so a bar on a phone is not mostly slider. */}
                        <div className="group/volume flex items-center">
                            <button
                                type="button"
                                onClick={toggleMute}
                                aria-label={muted ? t('video.controls.unmute') : t('video.controls.mute')}
                                className={iconButtonClass}
                            >
                                <VolumeIcon muted={muted} volume={volume} />
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={muted ? 0 : volume}
                                onChange={(e) => changeVolume(Number(e.target.value))}
                                aria-label={t('video.controls.volume')}
                                // The filled part of the track, painted by hand. `appearance-none`
                                // is what stops the browser drawing its own slider — which is the
                                // point, since the native one cannot be made to look like the rest
                                // of this bar — but it also takes the *fill* with it, leaving a
                                // handle sliding along a uniform grey that says nothing about the
                                // level. `accent-color` cannot put it back either: it only tints
                                // what the browser draws itself, and never a track that has been
                                // given a background. Hence a gradient with a hard stop at the
                                // value, which is the one approach that renders the same in every
                                // browser. Inline because it is genuinely per-frame runtime data,
                                // the case Tailwind's JIT cannot see.
                                style={{
                                    backgroundImage: `linear-gradient(to right,
                                        rgb(255 255 255) ${volumePercent}%,
                                        rgb(255 255 255 / 0.3) ${volumePercent}%)`,
                                }}
                                // White rather than the brand colour, and small: the timeline is
                                // the important slider on this bar and keeps the accent to itself.
                                className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30
                                    opacity-0 transition-all group-hover/volume:w-16
                                    group-hover/volume:opacity-100 focus:w-16 focus:opacity-100
                                    focus:outline-none focus-visible:ring-2 focus-visible:ring-white
                                    [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:bg-white
                                    [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3
                                    [&::-moz-range-thumb]:border-0
                                    [&::-moz-range-thumb]:rounded-full
                                    [&::-moz-range-thumb]:bg-white"
                            />
                        </div>

                        <PlayerSettingsMenu
                            groups={groups}
                            toggles={toggles}
                            onOpenChange={handleMenuOpenChange}
                        />

                        {airplayAvailable && (
                            <button
                                type="button"
                                onClick={() => videoRef.current?.webkitShowPlaybackTargetPicker?.()}
                                aria-label={t('video.controls.airplay')}
                                className={iconButtonClass}
                            >
                                <Airplay size={18} />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onToggleFullscreen}
                            aria-label={isFullscreen
                                ? t('video.controls.exitFullscreen')
                                : t('video.controls.enterFullscreen')}
                            className={iconButtonClass}
                        >
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
