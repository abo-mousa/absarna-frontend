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
 * @param videoKey  identifies the VIDEO, not the source. Distinct from `mediaKey` on purpose: a
 *                  rung swap changes the source of the same video, and the poster-state overlay
 *                  below must not come back over the middle of a lecture because the viewer
 *                  switched to the audio rung
 * @param durationHint  the catalogue's `VideoDTO.duration` string, shown until the element itself
 *                  knows the length — which on the HLS path is not until the first play
 * @param visible   whether the bar is showing; it fades on idle like the bar it replaces. The
 *                  pointer's answer only — keyboard focus inside the bar keeps it up on its own
 * @param isFullscreen / onToggleFullscreen  owned by `VideoPlayer`, which holds the wrapper that
 *                  actually goes fullscreen
 * @param groups / toggles  passed straight through to `PlayerSettingsMenu`
 * @param onInteract  any use of the bar counts as activity, so it does not fade mid-drag
 * @param onMenuOpenChange  the bar must stay up while the settings panel is open
 * @param onSeekBeforeLoad  where to seek when the element has no timeline yet. On the hls.js path
 *                  `autoStartLoad: false` means nothing is fetched until the viewer asks, so the
 *                  element has no `duration` and no seekable range before the first play — the
 *                  player takes this position, starts loading THERE, and applies it on
 *                  `loadedmetadata`
 * @param onRequestFocus  hands keyboard focus back to the player. The centre overlay button is
 *                  the one control that DISAPPEARS when pressed, so without this the focus it
 *                  took on click falls to the body and the next Space scrolls the page instead
 *                  of pausing
 */

// Volume survives the video, like playback speed: a viewer who watches lectures quietly should
// not re-set it on every one. Through safeStorage because bare localStorage *throws* where a
// browser blocks site data.
const VOLUME_STORAGE_KEY = 'playerVolume';
const MUTED_STORAGE_KEY = 'playerMuted';

/**
 * How long a wait has to last before the spinner appears.
 *
 * <p>A seek into data that is already buffered completes in a frame or two, but `seeking` and
 * `seeked` are separate tasks, so React paints the spinner in between: every arrow key and every
 * scrub flashed a 40px spinner over the middle of the picture. The indicator is for a wait long
 * enough to wonder about, and under a quarter of a second is not one — below that the flash reads
 * as the player glitching rather than as loading.
 */
const BUFFERING_INDICATOR_DELAY_MS = 250;

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
 * The remembered volume, as a level in 0…1, or `null` for "no preference".
 *
 * <p><b>This is the difference between a video that plays and a video that plays silently.</b>
 * `safeStorage.getItem` returns `null` for a key nobody has written, `Number(null)` is `0`, and
 * `0` passes every check a level has to pass — finite, not negative, not above one. So the
 * restore read "no preference" as "silent" and set `volume = 0` on the element: every viewer who
 * had never touched the slider got a picture with no sound, a slider sitting at zero and a muted
 * icon, on a platform whose entire catalogue is people talking.
 *
 * <p>It survives a browser check because it cannot be reproduced in a browser that has ever used
 * the slider — one drag writes the key and the bug is gone for that profile for good. It is the
 * first visit, the private window and the cleared profile that get it.
 *
 * <p>Exported and tested for that reason, and `''` is in the tests beside `null`: a store that
 * round-trips an empty string is the other way `Number` produces a confident zero.
 */
export const storedVolume = (raw) => {
    if (raw === null || raw === undefined || raw === '') return null;
    const level = Number(raw);
    if (!Number.isFinite(level) || level < 0 || level > 1) return null;
    return level;
};

/**
 * Whether this platform lets a page set the volume at all.
 *
 * <p><b>iOS does not.</b> On an iPhone or an iPad, `HTMLMediaElement.volume` is read-only: the
 * assignment is accepted, silently ignored, and the property reads back unchanged. Volume there
 * belongs to the hardware buttons and to nothing else. (`muted` is a separate property and it
 * *is* settable, which is why the mute button beside the slider stays.)
 *
 * <p>So a volume slider on an iPhone is not a control, it is a picture of one: it drags, it
 * paints its fill from the level it is given, and the level never moves. Better to not offer it
 * than to offer a thing that does nothing — the mute button is the whole of what the page can
 * actually do to the sound on that platform.
 *
 * <p>Probed rather than sniffed for a user agent, because the rule is about an engine and not
 * about a brand: iPadOS reports itself as a Mac, every browser on iOS is Safari underneath
 * whatever name it wears, and a string test would answer the wrong question in both directions.
 *
 * <p>Takes the element to probe so this stays a pure function over something with a `volume`
 * property — call it with a DETACHED `<video>` (see `supportsVolumeControl`), never with the one
 * the viewer is listening to, since the probe writes a level and writing the real element's
 * level mid-playback is audible.
 */
export const volumeIsSettable = (probe) => {
    if (!probe) return true;
    try {
        const original = probe.volume;
        // Somewhere the element is not already, in both directions, so a starting level of either
        // 0 or 1 is still a real change to look for.
        const target = original > 0.5 ? 0.25 : 0.75;
        probe.volume = target;
        const settable = Math.abs(probe.volume - target) < 0.001;
        probe.volume = original;
        return settable;
    } catch {
        // A throwing setter is a refusal too, and a louder one than iOS's.
        return false;
    }
};

/**
 * `volumeIsSettable` against a throwaway `<video>`, answered once per page.
 *
 * <p>Lazy, not module scope: this runs `document.createElement` and a module that touches the DOM
 * while it is being imported is the failure `lib/safeStorage.js` exists to prevent — one throw
 * there is a blank page rather than one broken control.
 */
let volumeControlSupport = null;

const supportsVolumeControl = () => {
    if (volumeControlSupport === null) {
        volumeControlSupport = typeof document === 'undefined'
            ? true
            : volumeIsSettable(document.createElement('video'));
    }
    return volumeControlSupport;
};

/**
 * What the timeline is scaled by — and therefore what can be dragged against it — in seconds, or
 * `0` when nothing knows how long the video is.
 *
 * <p><b>This is the rule that decides whether the bar can be scrubbed before the first play.</b>
 * It used to be the element's `duration` alone, which on the hls.js path does not exist until
 * playback starts (`autoStartLoad: false` fetches the master manifest and nothing else) — so the
 * timeline was dead on arrival for exactly the videos this app is made of, on a page that had the
 * length printed next to the title all along. The catalogue's own string stands in until the
 * element knows better; `seekTo` is where the two are told apart.
 *
 * <p>Exported and tested because every input here is reachable and none announces itself: `NaN`
 * before metadata, `Infinity` for a stream whose length the server never states, `0` for a source
 * that failed to load, and a hint that is absent or malformed — each of which must read as "not
 * draggable" rather than become a scale that maps every pointer position to `NaN`.
 */
export const timelineScale = (elementDuration, durationHint) => {
    if (Number.isFinite(elementDuration) && elementDuration > 0) return elementDuration;
    const hinted = parseDuration(durationHint);
    return Number.isFinite(hinted) && hinted > 0 ? hinted : 0;
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
    videoKey,
    durationHint,
    visible = true,
    isFullscreen = false,
    onToggleFullscreen,
    groups = [],
    toggles = [],
    onInteract,
    onMenuOpenChange,
    onSeekBeforeLoad,
    onRequestFocus,
}) {
    const [playing, setPlaying] = useState(false);
    // Ended is tracked apart from `playing` (which is false for both a pause and an end) because
    // only one of the two wants the big button back: after the last frame the next action is
    // "start again", which is the same offer the poster makes.
    const [ended, setEnded] = useState(false);
    // Which video has been played, rather than a boolean — so it resets itself when the viewer
    // opens a different video without the player unmounting (a related-video click keeps this
    // component mounted), and does NOT reset on a rung swap, which changes `mediaKey` alone.
    const [startedFor, setStartedFor] = useState(null);
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
    // Whether the keyboard is inside the bar. The fade is driven by the POINTER — it hides on a
    // timer whenever the video is playing — and it has no idea a viewer has tabbed onto the gear
    // or the timeline. Without this the settings button a keyboard viewer is standing on fades out
    // from under them while still focused and still operable: they press Enter on something they
    // can no longer see.
    const [focusInside, setFocusInside] = useState(false);
    const trackRef = useRef(null);
    // Volume is applied to the element once per element, not per bind: `mediaKey` re-binds these
    // listeners on a rung swap, but volume and muted survive a source change on their own, and
    // re-applying the stored value would undo a change the viewer made in between.
    const volumeAppliedRef = useRef(false);
    // Held across re-binds, so a swap mid-wait cannot leave a spinner scheduled by an element
    // that is gone.
    const bufferingTimerRef = useRef(null);
    // Where un-muting goes when the slider is at zero. Starts at full, which is where an element
    // starts, and follows the viewer from there.
    const lastAudibleVolumeRef = useRef(1);

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
            const stored = storedVolume(safeStorage.getItem(VOLUME_STORAGE_KEY));
            if (stored !== null) el.volume = stored;
            if (safeStorage.getItem(MUTED_STORAGE_KEY) === 'true') el.muted = true;
        }

        const syncPlayState = () => {
            setPlaying(!el.paused && !el.ended);
            setEnded(el.ended);
        };
        // On the event only, never from the element's state at bind time. A rung swap does not
        // need it — `videoKey` is unchanged, so the value set by the original play still matches
        // and the centre button stays away — while reading it at bind time gets the CROSS-VIDEO
        // case wrong: opening a related video keeps this component mounted and re-binds against
        // an element still playing the previous one, which would mark the new video as started
        // and leave it with no button on its poster.
        const markStarted = () => setStartedFor(videoKey);
        const syncTime = () => setCurrentTime(el.currentTime);
        const syncDuration = () => setDuration(el.duration);
        const syncVolume = () => {
            setVolume(el.volume);
            setMuted(el.muted);
            // What to come back to when the viewer un-mutes a slider they had dragged to zero.
            if (el.volume > 0 && !el.muted) lastAudibleVolumeRef.current = el.volume;
            // Persisted here rather than in the slider's own handler, because the slider is not
            // the only way the level changes: the player's ↑/↓ shortcuts write `el.volume`
            // directly, and so do the media keys and the picture-in-picture window. None of them
            // passes through this component, so a volume set by keyboard was forgotten on the
            // next video while one set by dragging was remembered.
            safeStorage.setItem(VOLUME_STORAGE_KEY, String(el.volume));
            safeStorage.setItem(MUTED_STORAGE_KEY, String(el.muted));
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

        // Delayed on the way in, immediate on the way out — a spinner that lingers after the
        // picture has moved is worse than one that arrives late.
        const showBuffering = () => {
            clearTimeout(bufferingTimerRef.current);
            bufferingTimerRef.current = setTimeout(
                () => setBuffering(true), BUFFERING_INDICATOR_DELAY_MS);
        };
        const hideBuffering = () => {
            clearTimeout(bufferingTimerRef.current);
            setBuffering(false);
        };

        const events = [
            ['play', syncPlayState],
            ['play', markStarted],
            ['pause', syncPlayState],
            ['ended', syncPlayState],
            ['timeupdate', syncTime],
            ['seeked', syncTime],
            // At the START of a seek as well as the end. The element reports the new position
            // immediately, and a seek can come from outside this bar — the player's own keyboard
            // shortcuts, the ref's seekTo(), the media keys, the picture-in-picture window — none
            // of which pass through `seekTo` above, so without this the handle stays at the old
            // position until the seek completes.
            ['seeking', syncTime],
            // Scrubbing back off the last frame clears `ended` on the element, and nothing else
            // here would notice: the video is still paused, so no play/pause event follows.
            ['seeked', syncPlayState],
            ['durationchange', syncDuration],
            ['loadedmetadata', syncDuration],
            ['progress', syncBuffered],
            ['timeupdate', syncBuffered],
            ['volumechange', syncVolume],
            ['waiting', showBuffering],
            ['seeking', showBuffering],
            ['stalled', showBuffering],
            ['playing', hideBuffering],
            ['canplay', hideBuffering],
            ['seeked', hideBuffering],
            ['pause', hideBuffering],
            ['error', hideBuffering],
        ];
        for (const [event, handler] of events) el.addEventListener(event, handler);
        return () => {
            for (const [event, handler] of events) el.removeEventListener(event, handler);
            clearTimeout(bufferingTimerRef.current);
        };
    }, [videoRef, mediaKey, videoKey]);

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

    // What the timeline is scaled by, and what a scrub is clamped to. Hoisted above the handlers
    // because they seek against it, not just paint with it: the element's own duration once it
    // has one, and the catalogue's string until then.
    const knowsDuration = Number.isFinite(duration) && duration > 0;
    // What is printed, which may be nothing (`--:--`), versus what can be dragged against.
    const shownDuration = knowsDuration ? duration : parseDuration(durationHint);
    const scale = timelineScale(duration, durationHint);

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
        if (!el) return;
        let target = Math.max(0, Math.min(scale, seconds));
        if (Number.isFinite(el.duration) && el.duration > 0) {
            // Clamped again against the element itself: `scale` may be the catalogue's length,
            // which is not always the file's.
            target = Math.min(el.duration, target);
            el.currentTime = target;
        } else {
            // No timeline on the element yet, which on the hls.js path is the state a video sits
            // in until someone presses play — `autoStartLoad: false` has fetched the master
            // manifest and nothing else. Dropping the seek here is what made the bar read as
            // broken before the first play: the handle moved under the pointer and sprang back on
            // release. The player knows how to start loading at a position, so the position goes
            // to it.
            if (!scale || !onSeekBeforeLoad) return;
            onSeekBeforeLoad(target);
        }
        // Optimistic, and it matters on EVERY seek, not just the deferred one. `currentTime` here
        // is the last value an event reported, and the element reports a completed seek with
        // `seeked` — which on the hls.js path is a segment fetch away, up to a second or two.
        // Meanwhile `handleTrackPointerUp` clears `scrubTime` the moment the pointer lifts, so
        // without this the handle drops back to where the video still is, sits there, and jumps
        // forward when the data lands: a drag to 30:00 visibly bounces off 5:00 on the way. The
        // next event overwrites this with the truth.
        setCurrentTime(target);
    };

    const changeVolume = (value) => {
        const el = videoRef.current;
        if (!el) return;
        el.volume = Math.min(1, Math.max(0, value));
        // Moving the slider off zero is also how a viewer un-mutes: leaving `muted` set would
        // make the slider look like it does nothing.
        if (el.volume > 0 && el.muted) el.muted = false;
        // Read back off the element rather than from `value`: the property assignments above are
        // synchronous, the `volumechange` EVENT is not. This is a controlled input, so waiting for
        // the event means rendering one more frame with the old level in `value` — the thumb
        // stutters against the pointer mid-drag, the same lag the timeline had on a seek.
        setVolume(el.volume);
        setMuted(el.muted);
    };

    const toggleMute = () => {
        const el = videoRef.current;
        if (!el) return;
        const next = !el.muted;
        // Un-muting a slider sitting at zero has to put a level back, or the button reads as
        // broken: the icon changes, the aria-label changes, and nothing can be heard. Dragging to
        // zero and pressing the icon is how a viewer silences a lecture to read something, and it
        // is the obvious way back that has to work.
        if (!next && el.volume === 0) el.volume = lastAudibleVolumeRef.current;
        el.muted = next;
        setVolume(el.volume);
        setMuted(el.muted);
    };

    // --- Scrubbing. Pointer capture, so a drag that leaves the player (or the window) keeps
    // controlling the timeline instead of stopping wherever the pointer crossed the edge.
    // `scale` rather than the element's own duration: before the first play on the hls.js path
    // the only length anyone knows is the catalogue's, and it is enough to drag against — see
    // seekTo, which is where the difference between the two is actually settled.
    const handleTrackPointerDown = (e) => {
        if (!scale) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setScrubTime(ratioFromPointer(e.clientX, trackRef.current?.getBoundingClientRect()) * scale);
        onInteract?.();
    };

    const handleTrackPointerMove = (e) => {
        if (scrubTime === null) return;
        setScrubTime(ratioFromPointer(e.clientX, trackRef.current?.getBoundingClientRect()) * scale);
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

    // Focus is a kind of attention the fade timer cannot see, so it counts the same as a pointer.
    const shown = visible || focusInside;
    const shownTime = scrubTime ?? currentTime;
    const playedRatio = scale ? shownTime / scale : 0;
    const bufferedRatio = scale ? buffered / scale : 0;
    // The gradient stop below, as a whole number: a slider at 0.35 must paint 35% of the track.
    const volumePercent = Math.round((muted ? 0 : volume) * 100);
    // Cached after the first call, so this is a property read and not a probe per render.
    const volumeIsControllable = supportsVolumeControl();
    const iconButtonClass = `flex items-center justify-center w-8 h-8 rounded-full text-white
        transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2
        focus-visible:ring-white`;

    // The two moments where the next action is "start" rather than "resume": the poster, before
    // this video has been played at all, and the last frame after it has ended. Turning
    // `controls` off took the browser's big centre button with it, and the bar's own 32px one is
    // not the same offer — on a poster it is the difference between a page that invites a press
    // and a page that looks like a still image with a strip of chrome under it.
    //
    // Deliberately NOT shown on every pause, which is what most players do. A viewer who paused
    // a lecture usually paused to look at what is on screen — a slide, a line of text — and a
    // 64px disc in the middle of it is in the way. The bar is up whenever the video is paused
    // (see nudgeControls), so the small button is right there, and clicking the picture toggles
    // playback too. Suppressed while buffering, where the spinner is the honest answer.
    const showCentrePlay = !playing && !buffering && (startedFor !== videoKey || ended);

    return (
        <>
            {showCentrePlay && (
                // The wrapper takes no pointer events, so the picture around the disc keeps its
                // own click-to-play instead of being covered by a full-bleed hit target.
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <button
                        type="button"
                        onClick={() => {
                            togglePlay();
                            // This button is about to unmount — see onRequestFocus.
                            onRequestFocus?.();
                        }}
                        aria-label={ended ? t('video.controls.replay') : t('video.controls.play')}
                        className="pointer-events-auto flex h-16 w-16 items-center justify-center
                            rounded-full bg-black/60 text-white transition hover:bg-black/80
                            hover:scale-105 focus:outline-none focus-visible:ring-2
                            focus-visible:ring-white"
                    >
                        {/* Filled, unlike the bar's outline icons: this one is read as a target to
                            press rather than as a control in a row of controls. Nudged right
                            because a triangle's optical centre sits left of its bounding box, so
                            centring the box leaves it looking off-centre in the disc. */}
                        <Play size={30} fill="currentColor" className="translate-x-[2px]" />
                    </button>
                </div>
            )}

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
                    duration-200 ${shown ? 'opacity-100' : 'opacity-0'}`}
                onPointerMove={onInteract}
                // focus/blur rather than :focus-within, because the value is needed in JS. React
                // maps these to focusin/focusout, which bubble; the relatedTarget check is what
                // tells "left the bar" from "moved between two of its buttons".
                onFocus={() => setFocusInside(true)}
                onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) setFocusInside(false);
                }}
            >
                {/* A scrim, because white controls over a bright frame are unreadable, and a solid bar
                    would cover picture the viewer is watching. */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Inert while faded, which the corner picture-in-picture button already got right
                    and this row did not. An invisible control row still took clicks: on a mouse
                    the move that carries the pointer down there reveals the bar first, so nobody
                    saw it — but a TAP has no move before it, and the same tap that asks for the
                    controls was landing on whatever sits under the finger. At the bottom of the
                    picture that is the timeline, so tapping to see the controls seeked the video. */}
                <div className={`relative flex flex-col gap-0.5 px-2 pb-1.5 pt-6 sm:px-3 sm:pb-2
                    ${shown ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                    <div
                        ref={trackRef}
                        role="slider"
                        tabIndex={0}
                        aria-label={t('video.controls.seek')}
                        aria-valuemin={0}
                        aria-valuemax={Number.isFinite(shownDuration) ? Math.floor(shownDuration) : 0}
                        // Disabled only when nothing at all knows how long the video is — neither
                        // the element nor the catalogue — since that is the one case where a
                        // pointer position cannot be turned into a time. Not being loaded is no
                        // longer a reason: a scrub before the first play starts the load there.
                        aria-disabled={!scale}
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

                        {/* The volume group. Under a mouse the slider is revealed by hover or
                            focus, the way every player does it, so the bar is not mostly slider.
                            A finger has neither: see the two notes on the slider itself. */}
                        <div className="group/volume flex items-center">
                            <button
                                type="button"
                                onClick={toggleMute}
                                aria-label={muted ? t('video.controls.unmute') : t('video.controls.mute')}
                                className={iconButtonClass}
                            >
                                <VolumeIcon muted={muted} volume={volume} />
                            </button>
                            {/* Absent entirely where the platform owns the volume — iOS, where
                                `el.volume` is read-only and this would drag without being heard.
                                The mute button above it still works there, and is then the whole
                                of what the page can do to the sound. */}
                            {volumeIsControllable && (
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
                                    //
                                    // `[@media(hover:none)]` is the touch case, and it is not styling
                                    // for its own sake: `w-0` plus `opacity-0` is not a hidden control,
                                    // it is a control with no tap target, and a finger has no hover to
                                    // open it with. So where nothing can hover the slider is simply
                                    // always out. Done in CSS rather than from `primaryPointerCanHover`
                                    // because it is the same slider either way — there is no behaviour
                                    // to branch, and a media query costs no state and no re-render.
                                    // Laid out before first paint, so it does not animate open.
                                    //
                                    // It keeps its default `flex-shrink`: at `w-16` on a narrow phone
                                    // the row is close to full, and a slider that gives up a few pixels
                                    // is better than a bar that overflows.
                                    className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30
                                        opacity-0 transition-all group-hover/volume:w-16
                                        group-hover/volume:opacity-100 focus:w-16 focus:opacity-100
                                        [@media(hover:none)]:w-16 [@media(hover:none)]:opacity-100
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
                            )}
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
