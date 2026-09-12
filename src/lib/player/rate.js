/**
 * The speeds offered in the settings menu.
 *
 * Nothing below 0.5 or above 2: the catalogue is hour-long recorded lectures, where the useful
 * range is "a bit slower to follow a difficult passage" to "twice as fast through material already
 * known", and a rate outside that either garbles Arabic recitation or is unintelligible.
 *
 * Latin digits in the labels, like every other number this app shows (`lib/numbers.js`) — a menu
 * that reads «١٫٥×» next to a «1:04:22» timeline is the same inconsistency the counts had.
 */
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// The chosen speed outlives the video, on purpose: someone who watches lectures at 1.5× wants
// 1.5×, not to re-pick it on every video. Through safeStorage because bare localStorage *throws*
// when a browser blocks site data, and this one is read during the first render.
export const RATE_STORAGE_KEY = 'playbackRate';

// The element's own limits are wider than PLAYBACK_SPEEDS, and deliberately respected: Chrome's
// and Safari's native control menus can set a rate we never offer, and the browser is allowed to.
const MIN_RATE = 0.25;
const MAX_RATE = 4;

/**
 * A stored (or browser-reported) playback rate, made safe to assign to a `<video>`.
 *
 * Every input to it is outside this app's control: the value comes from `localStorage`, where a
 * previous version, another tab, or a person with devtools may have left anything at all, and
 * assigning a non-finite or out-of-range rate throws `NotSupportedError` — mid-render, from a
 * setter, on a player that had nothing else wrong with it. Anything unusable reads as "normal
 * speed" rather than as a broken page.
 *
 * It accepts any rate *within* range rather than only the offered speeds, so a 0.9 set through the
 * browser's own control menu survives a reload instead of being quietly reset to 1.
 */
export const sanitizeRate = (raw) => {
    const rate = Number(raw);
    if (!Number.isFinite(rate) || rate < MIN_RATE || rate > MAX_RATE) return 1;
    return rate;
};
