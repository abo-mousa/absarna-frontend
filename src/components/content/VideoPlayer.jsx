import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { safeExternalUrl, extractYouTubeId } from '@/lib/media';
import { useVideoPlaybackUrl } from '@/hooks/useMediaUrl';
import { PROGRESS_REPORT_INTERVAL_MS, playbackMode, supportsNativeHls, uploadPlayerSurface }
    from '@/lib/player/playback';
import { PLAYBACK_SPEEDS } from '@/lib/player/rate';
import {
    AUTO_OPTION,
    LEVEL_PREFIX,
    QUALITY_PREFIX,
    onAudioRung,
    qualityOptions,
} from '@/lib/player/quality';
import { useWatchProgress } from '@/hooks/player/useWatchProgress';
import { useYouTubeEmbed } from '@/hooks/player/useYouTubeEmbed';
import { useHlsPlayback } from '@/hooks/player/useHlsPlayback';
import { usePlaybackRate } from '@/hooks/player/usePlaybackRate';
import { useFullscreen } from '@/hooks/player/useFullscreen';
import { usePictureInPicture } from '@/hooks/player/usePictureInPicture';
import { useAutoHideControls } from '@/hooks/player/useAutoHideControls';
import { useDoubleTapSeek } from '@/hooks/player/useDoubleTapSeek';
import { useResumeAfterBackground } from '@/hooks/player/useResumeAfterBackground';
import { t } from '@/i18n';
import { Button } from '@/components/ui';
import { useConsent } from '@/contexts/ConsentContext';
import { PictureInPicture2, RotateCcw, RotateCw } from 'lucide-react';
import VideoControlBar, {
    SEEK_STEP_SECONDS,
    VOLUME_STEP,
    keyboardAction,
} from './VideoControlBar';

/**
 * One video, however it is hosted: an uploaded HLS ladder, a pre-migration progressive MP4, a
 * YouTube embed, or an external link.
 *
 * <p>The parts with real judgement in them live beside this file rather than inside it —
 * `lib/player/` for the pure rules (which playback path, which rungs to offer, what counts as a
 * watch) and `hooks/player/` for the browser machinery (hls.js, the YouTube API, fullscreen,
 * picture-in-picture, the fading control bar). What is left here is the wiring: which of them a
 * given source needs, and the element they all act on.
 *
 * <p>`ref` exposes `getCurrentTime()` and `seekTo()` so a parent can read or move the playhead
 * without this component re-rendering on every tick — the alternative (lifting `currentTime` into
 * state) would fire a render several times a second for something read at share-click time and
 * written a handful of times per review.
 */
const VideoPlayer = forwardRef(function VideoPlayer(
    { videoId, sourceType, sourceUrl, title, poster, duration, startTime = 0 }, ref,
) {
    // Our own uploads are fetched through a URL the backend mints after running its visibility
    // check. Anything hosted elsewhere never touches this. The check runs on every playback, not
    // only for a hidden video: the object is private regardless.
    const isOwnUpload = sourceType === 'UPLOAD' || sourceType === 'LOCAL' || sourceType === 'STREAM';
    const { youtubeAllowed, grant: grantYouTube } = useConsent();
    const isYouTube = sourceType === 'YOUTUBE';
    const youtubeVideoId = isYouTube ? extractYouTubeId(sourceUrl) : '';

    // null means "whatever the backend picks". Kept as null rather than eagerly set to the served
    // quality, so a reload doesn't pin a choice the viewer never made.
    const [selectedQuality, setSelectedQuality] = useState(null);
    const { data: playback, isLoading: playbackUrlLoading, isError: playbackUrlFailed,
        refetch: refetchPlaybackUrl } = useVideoPlaybackUrl(videoId, isOwnUpload, selectedQuality);
    const playbackUrl = playback?.url;
    const qualities = playback?.qualities ?? [];
    const servedQuality = playback?.quality ?? null;
    // Three paths, decided in one place — see playbackMode for why that is the piece worth pinning
    // without a browser. The mode is kept, not just the hls.js answer: it also decides what the
    // quality menu can honestly offer (see qualityOptions).
    const mode = playbackMode(playback, supportsNativeHls());
    const usesHlsJs = mode === 'hls-js';

    // The player's box — and, deliberately, the element that goes fullscreen rather than the
    // <video> inside it, which is what keeps the settings overlay reachable there.
    const containerRef = useRef(null);
    const videoRef = useRef(null);
    const youtubePlayerRef = useRef(null);

    // Where to resume after a source swap, and whether to keep playing. Swapping a <video>'s source
    // always restarts it from zero, so the playhead has to be carried across by hand — otherwise
    // changing quality mid-lecture silently sends the viewer back to the beginning.
    const pendingSeekRef = useRef(null);
    const resumePlaybackRef = useRef(false);
    const lastReportedAtRef = useRef(0);

    /** The playhead, whichever of the two players is showing. */
    const playhead = useCallback(() => {
        if (isYouTube) return youtubePlayerRef.current?.getCurrentTime?.() ?? null;
        return videoRef.current?.currentTime ?? null;
    }, [isYouTube]);

    const { report, durationRef } = useWatchProgress(videoId, playhead);
    // NOTHING FROM GOOGLE UNTIL THE READER HAS AGREED. `enabled` false means the iframe API
    // script is never injected and no player is constructed, so a refusing reader's browser makes
    // no request at all — which is the requirement, since consent has to precede the loading
    // rather than follow it.
    const youtubeContainerId = useYouTubeEmbed({
        enabled: isYouTube && youtubeAllowed, youtubeVideoId, startTime, playerRef: youtubePlayerRef, report,
        durationRef,
    });

    const { controlsVisible, nudge, nudgeFromPointer, pin, hideNow } =
        useAutoHideControls(videoRef);
    const [menuOpen, setMenuOpen] = useState(false);
    // Repeat. Off by default and per-video: the reason it exists is memorisation — a short
    // recitation or a passage being learned by heart — which a viewer turns on for one clip, not
    // as a standing preference.
    const [loopEnabled, setLoopEnabled] = useState(false);

    const { playbackRate, selectRate, mirrorBrowserRate, applyTo: applyRateTo } =
        usePlaybackRate(videoRef, Boolean(playbackUrl));
    const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef, videoRef);
    const { pipSupported, pipActive, togglePip, attachVideo } =
        usePictureInPicture(videoRef, Boolean(playbackUrl));

    /** Snapshots the playhead so a source swap can put the viewer back where they were. */
    const rememberPosition = useCallback(() => {
        const el = videoRef.current;
        if (!el) return;
        pendingSeekRef.current = el.currentTime;
        resumePlaybackRef.current = !el.paused && !el.ended;
    }, []);

    const { levels, selectedLevel, selectLevel, startLoadAt, seekBeforeLoad: hlsSeekBeforeLoad,
        resumeLoading: resumeHlsLoading, unrecoverable: hlsGaveUp, retryPlayback } =
        useHlsPlayback({
            enabled: usesHlsJs, playbackUrl, videoId, videoRef, pendingSeekRef, rememberPosition,
        });

    /**
     * Putting playback back together after the page came back from the background — see
     * `lib/player/resume.js` for what actually breaks, and `useResumeAfterBackground` for how it
     * is noticed.
     *
     * <p>This is the half that knows which path owns the source, and the two are genuinely
     * different repairs. Under hls.js the element is a shell around a MediaSource the library
     * fills, so the fix is to tell the library to start filling it again from here — the element
     * keeps its buffer and its position and nothing visible reloads. On the progressive and Safari
     * paths the element owns its own source, and the only way back from a decoder the platform
     * took away is to load it again, which restarts it at zero — so the position and the
     * play/pause state go into the same two refs a quality switch uses, and
     * `handleLoadedMetadata` puts the viewer back.
     */
    const recoverPlayback = useCallback(({ position, resume }) => {
        const el = videoRef.current;
        if (!el) return;
        if (usesHlsJs) {
            resumeHlsLoading(position);
            if (resume) el.play().catch(() => {});
            return;
        }
        pendingSeekRef.current = position;
        resumePlaybackRef.current = resume;
        el.load();
    }, [usesHlsJs, resumeHlsLoading]);

    useResumeAfterBackground({
        videoRef, enabled: isOwnUpload && Boolean(playbackUrl), onRecover: recoverPlayback,
    });

    // Double-tap the sides of the picture to jump. Touch only, and it deliberately takes the side
    // zones away from tap-to-pause — see the hook.
    const { handlePointerUp: handleTapSeek, isTouchGesture, feedback: tapFeedback } =
        useDoubleTapSeek({ videoRef, enabled: isOwnUpload });

    /**
     * Seeking a video that has not been loaded yet.
     *
     * <p><b>Why the bar cannot just set `currentTime`.</b> On the hls.js path `autoStartLoad:
     * false` means that until the first play the master manifest has been parsed and nothing else:
     * the element has no duration, no seekable range, and an assignment to `currentTime` is
     * discarded. So a scrub before playback started moved the handle and sprang back, which read
     * as a broken timeline rather than as a deliberate deferral.
     *
     * <p>`pendingSeekRef` is set whatever the path: it is what `handleLoadedMetadata` applies once
     * the element has a timeline, it covers the progressive and Safari paths (where metadata may
     * simply not have arrived yet), and it covers the race where the scrub lands before
     * MANIFEST_PARSED — the manifest handler reads the same ref.
     *
     * <p>Playback is deliberately NOT started: the viewer moved the playhead, they did not press
     * play. `resumePlaybackRef` stays false, so the element seeks, shows that frame and waits.
     */
    const seekBeforeLoad = useCallback((seconds) => {
        pendingSeekRef.current = seconds;
        hlsSeekBeforeLoad(seconds);
    }, [hlsSeekBeforeLoad]);

    useImperativeHandle(ref, () => ({
        getCurrentTime: () => playhead() || 0,
        /**
         * Jump the playhead, for a caller that has somewhere specific to send it — the review
         * queue jumping to the start of a flagged span.
         *
         * <p>Imperative for the same reason `getCurrentTime` is. `startTime` cannot serve, because
         * it is read once at load and a reviewer jumps between spans repeatedly.
         *
         * <p>Plays after seeking. A reviewer clicking a timestamp is asking to hear that moment,
         * and a silent jump to a paused frame is a worse answer than an autoplay they did not ask
         * for — this is a deliberate action on an admin screen, not a page load.
         */
        seekTo: (seconds) => {
            const target = Math.max(0, Number(seconds) || 0);
            if (isYouTube) {
                youtubePlayerRef.current?.seekTo?.(target, true);
                youtubePlayerRef.current?.playVideo?.();
                return;
            }
            const element = videoRef.current;
            if (!element) return;
            if (Number.isFinite(element.duration) && element.duration > 0) {
                element.currentTime = target;
            } else {
                // Nothing is loaded yet, so this assignment would be discarded and the play() below
                // would start at the beginning — a reviewer who clicked a timestamp would be sent
                // to 0:00 with no sign anything went wrong.
                seekBeforeLoad(target);
            }
            // Ignored rather than surfaced: autoplay policies reject this in a tab that has never
            // been interacted with, and the seek has already succeeded, which is the part the
            // caller asked for.
            element.play?.().catch(() => {});
        },
    }), [isYouTube, playhead, seekBeforeLoad]);

    const handleTimeUpdate = (e) => {
        const now = Date.now();
        if (now - lastReportedAtRef.current < PROGRESS_REPORT_INTERVAL_MS) return;
        lastReportedAtRef.current = now;
        report(e.currentTarget.currentTime);
    };

    const handlePauseOrEnded = (e) => {
        lastReportedAtRef.current = Date.now();
        report(e.currentTarget.currentTime);
        pin();
    };

    // Seeking needs the element's duration/metadata loaded first — setting `currentTime` any
    // earlier is silently ignored by the browser.
    const handleLoadedMetadata = (e) => {
        durationRef.current = e.currentTarget.duration;
        // The media load algorithm resets playbackRate on every new source, and a rung swap IS a
        // new source. Re-applied here as well as in usePlaybackRate's effect because the hls.js
        // path can re-attach media without the URL changing (error recovery).
        applyRateTo(e.currentTarget);
        // A pending seek is a quality switch and takes precedence over `startTime`, which is the
        // deep-link/resume position and was already honoured on the first load.
        if (pendingSeekRef.current != null) {
            e.currentTarget.currentTime = pendingSeekRef.current;
            pendingSeekRef.current = null;
            if (resumePlaybackRef.current) {
                resumePlaybackRef.current = false;
                e.currentTarget.play().catch(() => {});
            }
            return;
        }
        if (startTime > 0) e.currentTarget.currentTime = startTime;
    };

    const handlePlay = () => {
        // Playback starting is what arms the fade — until then `nudge` leaves the cluster up,
        // because a paused player keeps its controls.
        nudge();
        startLoadAt(startTime);
    };

    /**
     * Switching to a different playlist entirely — which today means the audio-only rung.
     *
     * <p><b>The seek-restore machinery survives for exactly this transition.</b> Audio is
     * deliberately not a variant of master.m3u8, so reaching it means asking the backend for a
     * different playlist and handing the player a new source — which always restarts from zero.
     * Level switching needs none of this.
     */
    const changeQuality = (quality) => {
        rememberPosition();
        setSelectedQuality(quality);
    };

    /**
     * One menu, two mechanisms — the option's id says which (see qualityOptions).
     *
     * <p>`auto` means opposite things on the two paths and both are right: to hls.js it is "hand
     * the choice back to ABR", which is free; to the API it is "no `?quality=`, serve the default",
     * which is a new URL and therefore a reload. On the audio rung it is also the way back to the
     * picture, and that is always a playlist swap.
     */
    const handleQualityOption = (id) => {
        if (id === AUTO_OPTION) {
            if (usesHlsJs && !onAudioRung(selectedQuality, servedQuality)) selectLevel(-1);
            else changeQuality(null);
            return;
        }
        if (id.startsWith(LEVEL_PREFIX)) {
            selectLevel(Number(id.slice(LEVEL_PREFIX.length)));
            return;
        }
        changeQuality(id.slice(QUALITY_PREFIX.length));
    };

    /**
     * The keyboard shortcuts every video player has trained people to expect.
     *
     * <p>They exist because turning `controls` off took them away: the native bar brought space,
     * the arrows and the media keys with it. The map itself is `keyboardAction`, which is exported
     * and tested — shortcuts are the only controls with no visible affordance, so a missing case is
     * invisible until someone presses the key.
     */
    const handleShortcut = (e) => {
        const inChrome = e.target !== e.currentTarget;
        // Never steal a key from something the viewer is typing in, from the volume slider (an
        // <input>, whose arrows are its own), or from the settings menu, which navigates itself.
        if (inChrome && e.target.closest('input, textarea, [role="menu"]')) return;
        const action = keyboardAction(e.key);
        if (!action) return;
        // The timeline handles its own seeking, but only that: Space on a focused slider would
        // otherwise fall through to the browser and scroll the page instead of pausing.
        if (inChrome
            && e.target.closest('[role="slider"]')
            && (action === 'seek-forward' || action === 'seek-back')) {
            return;
        }
        const el = videoRef.current;
        if (!el) return;
        e.preventDefault();
        nudge();
        switch (action) {
            case 'toggle-play':
                if (el.paused || el.ended) el.play().catch(() => {});
                else el.pause();
                break;
            case 'seek-forward':
            case 'seek-back': {
                if (!Number.isFinite(el.duration)) break;
                const delta = action === 'seek-forward' ? SEEK_STEP_SECONDS : -SEEK_STEP_SECONDS;
                el.currentTime = Math.min(el.duration, Math.max(0, el.currentTime + delta));
                break;
            }
            case 'volume-up':
            case 'volume-down': {
                const delta = action === 'volume-up' ? VOLUME_STEP : -VOLUME_STEP;
                el.volume = Math.min(1, Math.max(0, el.volume + delta));
                if (el.volume > 0) el.muted = false;
                break;
            }
            case 'toggle-mute':
                el.muted = !el.muted;
                break;
            case 'toggle-fullscreen':
                toggleFullscreen();
                break;
            default:
                break;
        }
    };

    // Changing the `src` attribute does not itself reload the element — the browser keeps playing
    // the old source until load() is called. This is also what makes onLoadedMetadata fire again,
    // which is where the pending seek is applied.
    //
    // Only the paths where the element owns its own source: a progressive MP4, and HLS in Safari,
    // which plays an .m3u8 from `src` exactly like any other file. The hls.js path deliberately
    // leaves `src` unset and is driven by useHlsPlayback instead.
    useEffect(() => {
        const el = videoRef.current;
        if (usesHlsJs) return;
        if (el && playbackUrl && el.dataset.src !== playbackUrl) {
            el.dataset.src = playbackUrl;
            el.load();
        }
    }, [playbackUrl, usesHlsJs]);

    // An external URL is rendered as-is, so it goes through the scheme allowlist first — a stored
    // `javascript:` value would otherwise become a live href on a page holding the session token in
    // localStorage (React warns about it but renders it anyway).
    const externalUrl = safeExternalUrl(sourceUrl);

    if (isOwnUpload) {
        const surface = uploadPlayerSurface({
            urlFailed: playbackUrlFailed, hlsGaveUp, urlLoading: playbackUrlLoading, playbackUrl,
        });

        // Both routes to "this will not play and pressing things will not change that" get the one
        // panel — and a button, since the viewer is now the only one who can decide to try again.
        // Which route it was decides what the button does: a failed mint is re-asked, a destroyed
        // hls.js instance has to be rebuilt as well (see retryPlayback).
        if (surface === 'failed') {
            return (
                <div className="flex min-h-[300px] w-full flex-col items-center justify-center
                    gap-3 rounded-lg bg-black/80 px-4 py-10 text-center">
                    <p className="text-sm text-white/90">{t('video.playbackFailed')}</p>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => (playbackUrlFailed ? refetchPlaybackUrl() : retryPlayback())}
                    >
                        {t('common.retry')}
                    </Button>
                </div>
            );
        }

        // Rendering before the signed URL arrives would fire one unsigned request that 403s and
        // leave the player stuck showing an error for what is really just a pending fetch.
        if (surface === 'loading') {
            return <div className="w-full h-[300px] rounded-lg bg-black/80 animate-pulse" />;
        }

        const { options: qualityChoices, activeId: activeQuality } = qualityOptions({
            mode, levels, qualities, selectedQuality, servedQuality, selectedLevel,
        });

        // Two groups, because there are two genuinely different kinds of switch and collapsing them
        // would misrepresent one: a quality is a rung (instant under HLS, a reload for the audio
        // playlist), a speed is a property of the element. `PlayerSettingsMenu` drops a group that
        // has nothing to choose between — a source smaller than 480p produces a single rung, and a
        // lone option is clutter.
        const settingGroups = [
            {
                id: 'quality',
                title: t('video.quality'),
                options: qualityChoices,
                activeId: activeQuality,
                onSelect: handleQualityOption,
            },
            {
                id: 'speed',
                title: t('video.settings.speed'),
                options: PLAYBACK_SPEEDS.map((rate) => ({
                    id: String(rate),
                    // 1× is "normal" rather than a number: it is the absence of a choice, and
                    // reading it as a measurement invites the viewer to wonder what it is relative
                    // to.
                    label: rate === 1 ? t('video.settings.normalSpeed') : `${rate}×`,
                })),
                activeId: String(playbackRate),
                onSelect: selectRate,
            },
        ];

        const settingToggles = [
            {
                id: 'loop',
                label: t('video.settings.loop'),
                active: loopEnabled,
                onToggle: () => setLoopEnabled((on) => !on),
            },
        ];
        if (pipSupported) {
            settingToggles.push({
                id: 'pip',
                label: t('video.settings.pictureInPicture'),
                active: pipActive,
                onToggle: togglePip,
            });
        }

        return (
            // `relative` so the bar can position against the player, and the ref because THIS is
            // the element that goes fullscreen. In fullscreen it IS the screen, so it centres a
            // letterboxed video on black instead of stretching it.
            //
            // Focusable, because turning `controls` off also took the keyboard away: the native bar
            // was a focus stop that came with space, the arrows and the media keys. `tabIndex` plus
            // an explicit focus on pointer-down (Safari does not focus a div on click) is what puts
            // the shortcuts back.
            <div
                ref={containerRef}
                tabIndex={0}
                role="group"
                aria-label={t('video.controls.player')}
                onKeyDown={handleShortcut}
                // Pointer activity anywhere on the player brings the bar back, including the first
                // touch — `pointerdown` covers a tap, which is how a phone asks for the controls.
                //
                // `nudgeFromPointer` rather than `nudge`, and that difference is what lets the bar
                // fade at all: a browser dispatches a move at UNCHANGED coordinates whenever the
                // element under the cursor changes, which this player does to itself twice on
                // every fade. See the hook.
                //
                // One handler for the whole player, this one: React events bubble, so a move over
                // the bar or the disc arrives here too.
                onPointerMove={nudgeFromPointer}
                onPointerDown={(e) => {
                    nudge();
                    if (e.currentTarget === e.target) e.currentTarget.focus();
                }}
                // Only a pointer that STAYS somewhere can meaningfully leave. A finger leaves the
                // moment it lifts — the browser fires pointerleave right after pointerup for a
                // touch — so treating that as "the viewer is not reaching for a control" hid the
                // bar again at the end of the very tap that asked for it, and the centre pause
                // disc with it.
                onPointerLeave={(e) => {
                    if (e.pointerType !== 'touch') hideNow();
                }}
                className={`relative outline-none ${isFullscreen
                    ? 'flex h-full w-full items-center justify-center bg-black'
                    : ''}`}
            >
                <video
                    ref={attachVideo}
                    // Unset on the hls.js path: the library attaches a MediaSource to this element,
                    // and an .m3u8 in `src` alongside it makes the browser try to play the manifest
                    // as a media file and lose the race.
                    src={usesHlsJs ? undefined : playbackUrl}
                    // Without it the element is black until play: hls.js fetches nothing before
                    // then (autoStartLoad: false), and preload="metadata" yields no frame either.
                    poster={poster ?? undefined}
                    // No `controls`: the bar below is ours, and that is what lets the settings menu
                    // exist in fullscreen at all — see useFullscreen.
                    playsInline
                    loop={loopEnabled}
                    // Honoured by the element on the progressive and Safari paths. hls.js ignores it
                    // entirely and is held back by `autoStartLoad: false` plus onPlay below.
                    preload="metadata"
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={handlePlay}
                    onPause={handlePauseOrEnded}
                    onEnded={handlePauseOrEnded}
                    // Chrome and Safari both offer playback speed in their own control menus, and on
                    // the progressive path a viewer may well use it. Without mirroring it back, the
                    // settings menu would keep claiming 1× while the video played at 2×.
                    onRateChange={(e) => mirrorBrowserRate(e.currentTarget.playbackRate)}
                    // Double-tap the left or right third to jump. Touch only, and it claims the
                    // two synthesised events below for the window after a tap — see
                    // useDoubleTapSeek.
                    onPointerUp={handleTapSeek}
                    // Click to play and double-click for fullscreen, the two gestures the native bar
                    // brought with it. On the element rather than the wrapper, so a click on the
                    // bar's own buttons cannot also toggle playback.
                    onClick={() => {
                        // A tap that was part of a seek gesture must not also pause: the first tap
                        // of a double-tap has to be harmless, or every jump would stop the video
                        // and start it again on the way past.
                        if (isTouchGesture()) return;
                        const el = videoRef.current;
                        if (!el) return;
                        containerRef.current?.focus();
                        if (el.paused || el.ended) el.play().catch(() => {});
                        else el.pause();
                    }}
                    // The browser synthesises a dblclick from two quick taps as well as from two
                    // clicks, so without this guard a double-tap to seek would also throw the
                    // player into fullscreen.
                    onDoubleClick={() => {
                        if (isTouchGesture()) return;
                        toggleFullscreen();
                    }}
                    // `translateZ(0)` pins the element to its own composited layer for good, under
                    // a mouse only. Without it Chrome moves a video between a hardware overlay and
                    // ordinary compositing as the things drawn over it come and go — and the two
                    // paths do not tone-map identically, so the whole picture visibly lightens the
                    // moment the control bar fades and darkens again when it returns. Restricted
                    // to hover-capable pointers because the overlay path is the cheaper one for a
                    // battery, and this is a desktop compositing artefact.
                    className={`bg-black [@media(hover:hover)]:[transform:translateZ(0)]
                        ${isFullscreen
                        ? 'h-full w-full max-h-none rounded-none object-contain'
                        : 'w-full max-h-[500px] rounded-lg'}`}
                >
                    {t('video.unsupported')}
                </video>

                {/* What a double-tap did, because the gesture has no control to look at: the
                    viewer pressed nothing, so the only way they can tell it worked — and by how
                    much, on the third tap — is if the picture says so. Over the zone that was
                    tapped rather than in the middle, which is also how it teaches the gesture to
                    the next viewer who finds it by accident.

                    "Back" is on the STARTING side, because that is where this player's timeline
                    begins (see VideoControlBar) — the right of the picture under RTL, the left
                    under LTR, which `start-0` gives for free. `role="status"` so the jump is announced rather
                    than only drawn, and `pointer-events-none` so the flash never eats the tap that
                    follows it — a run of three taps is one gesture, and the second one must not
                    land on a box that appeared under the finger after the first. */}
                {tapFeedback && (
                    <div
                        role="status"
                        className={`pointer-events-none absolute inset-y-0 flex w-[30%] flex-col
                            items-center justify-center gap-1 bg-black/30 text-white
                            ${tapFeedback.zone === 'back' ? 'start-0' : 'end-0'}`}
                    >
                        {tapFeedback.zone === 'back'
                            ? <RotateCcw size={26} />
                            : <RotateCw size={26} />}
                        {/* Latin digits like every other figure in the app, and the two forms
                            because the Arabic numbers this produces straddle the break: ten
                            seconds is «10 ثوانٍ» and twenty is «20 ثانية». English needs one form
                            and `en.js` fills both entries with it. */}
                        <span className="text-xs font-semibold tabular-nums">
                            {tapFeedback.seconds <= 10
                                ? t('video.controls.seekSecondsFew', { seconds: tapFeedback.seconds })
                                : t('video.controls.seekSeconds', { seconds: tapFeedback.seconds })}
                        </span>
                    </div>
                )}

                {/* Picture-in-picture also gets a button of its own, in the corner, because it is
                    the one setting a viewer reaches for *while leaving* — the thought is "keep this
                    playing while I go and look at something else", and having to open a menu to say
                    so is a step in the wrong direction. It stays in the menu too, where it is
                    discoverable next to the other settings; both press the same toggle.

                    A corner rather than the bar: the bar is a row of controls for the video playing
                    here, and this one is about the video leaving. It fades with the bar, and comes
                    back on focus so a keyboard viewer can still reach it while faded.

                    The TRAILING top corner, with the rest of the player: the bar runs with the
                    text (see VideoControlBar), which puts the gear and the fullscreen button at
                    that end, and a lone corner control on the opposite side reads as belonging to
                    something else. It is also the corner nearest the settings menu's own
                    picture-in-picture row, which is the same toggle. */}
                {pipSupported && (
                    <button
                        type="button"
                        onClick={togglePip}
                        aria-pressed={pipActive}
                        aria-label={t('video.settings.pictureInPicture')}
                        className={`absolute end-2 top-2 z-10 flex h-9 w-9 items-center
                            justify-center rounded-full bg-black/60 text-white transition-opacity
                            duration-200 hover:bg-black/80 focus:opacity-100 focus:outline-none
                            focus-visible:ring-2 focus-visible:ring-white
                            ${controlsVisible || menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                        <PictureInPicture2 size={18} />
                    </button>
                )}

                <VideoControlBar
                    videoRef={videoRef}
                    mediaKey={playbackUrl}
                    // The catalogue knows how long the video is; on the HLS path the element does
                    // not, until the first play. See parseDuration.
                    durationHint={duration}
                    visible={controlsVisible || menuOpen}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                    groups={settingGroups}
                    toggles={settingToggles}
                    onInteract={nudge}
                    onMenuOpenChange={setMenuOpen}
                    onSeekBeforeLoad={seekBeforeLoad}
                    // The container is the focus stop that carries the keyboard shortcuts, and the
                    // bar's centre button unmounts on click — the same hop the picture's own
                    // click-to-play does.
                    onRequestFocus={() => containerRef.current?.focus()}
                />
            </div>
        );
    }

    // TELEGRAM is still an accepted `sourceType` on the backend — it is in
    // VideoUpdateRequest.SOURCE_TYPE_PATTERN, so an admin or owner can set it through the create and
    // update endpoints — but nothing writes it automatically and no such row exists today. It
    // therefore keeps a branch, and that branch is a LINK rather than a <video>: the SPA's own CSP
    // names `media-src 'self' blob: <bucket>` and nothing else, so a Telegram CDN URL in a <video>
    // is blocked by the browser with no error the page can see. A link is honest about where the
    // bytes live and works under the policy.
    if (sourceType === 'TELEGRAM') {
        if (!externalUrl) {
            return <p className="text-text-muted text-sm">{t('video.invalidUrl')}</p>;
        }
        return (
            <div className="rounded-lg border border-border bg-surface-hover p-4 text-sm">
                <p className="text-text-secondary mb-2">{t('video.externalSourceNotice')}</p>
                <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold"
                >
                    {t('video.openExternalSource')}
                </a>
            </div>
        );
    }

    if (isYouTube) {
        if (!youtubeVideoId) {
            if (!externalUrl) {
                return <p className="text-text-muted text-sm">{t('video.invalidUrl')}</p>;
            }
            return (
                <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold">
                    {t('video.watchOnYouTube')}
                </a>
            );
        }

        // THE PLACEHOLDER IS ALSO THE CONSENT POINT, and that is the design rather than a
        // fallback. A reader who has refused site-wide, or not yet answered, still came here to
        // watch one lecture — and a refusal that means "you may never watch anything" is a
        // refusal nobody will make freely, which would undermine the banner's own validity.
        //
        // Pressing this is consent in the strongest form the rules describe: specific (one named
        // recipient, one named purpose), informed (the sentence above the button says what
        // happens), unambiguous (a deliberate press, not a scroll or a dismissal) and in context
        // (they are looking at the thing it applies to). It grants generally rather than for this
        // video alone, which the wording says plainly — a per-video grant would mean asking again
        // on the next lecture, and a question re-asked until it is answered the way we want is
        // exactly what the policy forbids.
        if (!youtubeAllowed) {
            return (
                <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden border border-border bg-surface-hover">
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center">
                        <p className="text-sm text-text-secondary leading-loose max-w-prose" dir="auto">
                            {t('consent.playerBody')}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <Button onClick={grantYouTube}>{t('consent.playerAllow')}</Button>
                            {/* The way out that involves us in nothing: YouTube's own page, in a
                                new tab. A reader who will not have Google on this site may still
                                be perfectly willing to visit Google. */}
                            {externalUrl && (
                                <a
                                    href={externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-5 py-2.5 text-[0.95rem] rounded-md border border-border text-text-secondary hover:bg-surface-hover"
                                >
                                    {t('video.watchOnYouTube')}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden border-0">
                <div id={youtubeContainerId} title={title} className="absolute inset-0 w-full h-full" />
            </div>
        );
    }

    if (!externalUrl) {
        return <p className="text-text-muted text-sm">{t('video.invalidUrl')}</p>;
    }

    return (
        <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold">
            {t('video.watchVideo')}
        </a>
    );
});

export default VideoPlayer;
