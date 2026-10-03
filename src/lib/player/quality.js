import { qualityLabel } from './playback';

/**
 * The worker's audio-only rung, which is a rung on the API and NOT a variant of master.m3u8.
 *
 * It is kept out of the manifest on purpose: anything listed there is something an ABR player may
 * switch down to on a weak signal, and a lecture that silently loses its picture in a lift looks
 * broken rather than considerate. So it is the one quality the viewer has to ask for, and the one
 * switch that still costs a reload.
 */
export const AUDIO_QUALITY = 'audio';

// Option ids for the quality group. Prefixed because the two kinds of switch are genuinely
// different operations — a manifest level swaps at the next segment boundary, an API rung means a
// new playlist and a reload — and a bare "720p" cannot say which one it is.
export const AUTO_OPTION = 'auto';
export const LEVEL_PREFIX = 'level:';
export const QUALITY_PREFIX = 'quality:';

/** Whether the viewer is on (or has been served) the sound-only rung. */
export const onAudioRung = (selectedQuality, servedQuality) =>
    selectedQuality === AUDIO_QUALITY || servedQuality === AUDIO_QUALITY;

/**
 * The rungs a viewer may choose from, and which one is active — one list across three playback
 * paths that each know a different amount about the ladder.
 *
 * The branching is invisible from any single browser, and getting it wrong offers a switch that
 * does nothing:
 *
 * - **hls-js** — the manifest is the authority. `levels` is what the player can switch between
 *   without reloading, so those are the options and `auto` (ABR) is the default. On the audio rung
 *   `levels` describes the *audio* playlist — a single synthesised pseudo-level — so it is
 *   suppressed there and `auto` is the way back to the picture.
 * - **hls-native** — Safari owns switching and exposes no list, so the only real choice left is
 *   sound-only.
 * - **progressive** — the pre-HLS `v1/` ladder, where there is no manifest and each rung is a
 *   separate file: the API's `qualities` is the only list there is, and every switch goes through
 *   `playback-url` again.
 *
 * The audio rung is appended from the API's ladder in every mode: the manifest can never offer it.
 */
/**
 * A recording with no picture: its ladder is the audio rung alone, and the master playlist serves
 * that same rung as its one variant. There is nothing to choose between, so the menu offers
 * nothing — `PlayerSettingsMenu` drops a group with a lone option.
 */
export const isRecording = (qualities = []) =>
    qualities.length === 1 && qualities[0] === AUDIO_QUALITY;

export const qualityOptions = ({
    mode,
    levels,
    qualities = [],
    selectedQuality = null,
    servedQuality = null,
    selectedLevel = -1,
}) => {
    if (isRecording(qualities)) {
        return { options: [{ id: AUTO_OPTION, label: qualityLabel(AUTO_OPTION) }], activeId: AUTO_OPTION };
    }
    const onAudio = onAudioRung(selectedQuality, servedQuality);
    const options = [{ id: AUTO_OPTION, label: qualityLabel(AUTO_OPTION) }];

    if (mode === 'hls-js' && !onAudio) {
        for (const level of levels ?? []) {
            options.push({ id: `${LEVEL_PREFIX}${level.index}`, label: level.label });
        }
    } else if (mode === 'progressive') {
        for (const quality of qualities) {
            if (quality === AUDIO_QUALITY) continue;
            options.push({ id: `${QUALITY_PREFIX}${quality}`, label: qualityLabel(quality) });
        }
    }

    if (qualities.includes(AUDIO_QUALITY)) {
        options.push({ id: `${QUALITY_PREFIX}${AUDIO_QUALITY}`, label: qualityLabel(AUDIO_QUALITY) });
    }

    let activeId = AUTO_OPTION;
    if (onAudio) {
        activeId = `${QUALITY_PREFIX}${AUDIO_QUALITY}`;
    } else if (mode === 'hls-js') {
        if (selectedLevel >= 0) activeId = `${LEVEL_PREFIX}${selectedLevel}`;
    } else if (selectedQuality) {
        activeId = `${QUALITY_PREFIX}${selectedQuality}`;
    }

    return { options, activeId };
};

/**
 * Whether hls.js should cap a ladder's rungs to the player's size — no, when its top rung is 720p
 * or smaller.
 *
 * The cap compares the element's size in DEVICE pixels, so on a 1× monitor an inline player some
 * 800 px wide is "smaller than 480p" and a 720p lecture played at 480p — on a 27-inch screen the
 * text on a slide was soft, and on a retina laptop beside it, at 2×, the same player got 720p.
 * The cap exists to stop a small player pulling 1080p; at 720p and below the top rung is cheap
 * (its ceiling is 2.5 Mbit/s), and for a catalogue of slides and text it is what makes them
 * readable. ABR still steps down on a slow connection — this removes a size cap, not that.
 *
 * Measured on the short side, the way the worker names rungs, so a portrait 720×1280 is a 720p.
 */
export const TOP_RUNG_ALWAYS_ALLOWED = 720;

export const capsToPlayerSize = (levels) => {
    const sides = (levels ?? [])
        .map((level) => Math.min(level.width || 0, level.height || 0))
        .filter((side) => side > 0);
    if (sides.length === 0) return true;
    return Math.max(...sides) > TOP_RUNG_ALWAYS_ALLOWED;
};
