import { describe, expect, it } from 'vitest';
import { PLAYBACK_SPEEDS, qualityOptions, sanitizeRate } from '@/components/content/VideoPlayer';

/**
 * What the player's settings menu offers, and what it accepts back.
 *
 * <p>Both pieces are pinned here for the same reason `playbackMode` is: the branching is invisible
 * from any one browser. The quality list is assembled from a different source on each of the three
 * playback paths — the hls.js manifest, the API's ladder, or nothing at all in Safari — and
 * offering the wrong one produces a menu that looks right and does nothing when used. `sanitizeRate`
 * guards the one value in the player that arrives from outside the app entirely.
 */
describe('qualityOptions', () => {
    const levels = [
        { index: 2, height: 1080, label: '1080p' },
        { index: 1, height: 720, label: '720p' },
        { index: 0, height: 480, label: '480p' },
    ];

    it('offers the manifest levels, not the API ladder, on the hls.js path', () => {
        // The manifest is what the player can actually switch between without reloading. Building
        // the menu from the API's `qualities` instead risks offering a rung this playlist has not
        // got, which fails as a switch that visibly does nothing.
        const { options, activeId } = qualityOptions({
            mode: 'hls-js',
            levels,
            qualities: ['1080p', '720p', '480p', 'audio'],
        });

        expect(options.map((option) => option.id)).toEqual([
            'auto',
            'level:2',
            'level:1',
            'level:0',
            'quality:audio',
        ]);
        // -1 is hls.js's "decide for me", and ABR is the whole point of the ladder.
        expect(activeId).toBe('auto');
    });

    it('marks the chosen level, and only that one, as active', () => {
        const { activeId } = qualityOptions({ mode: 'hls-js', levels, selectedLevel: 1 });
        expect(activeId).toBe('level:1');
    });

    it('suppresses the levels while the audio rung is playing', () => {
        // On the audio rung `levels` describes the AUDIO playlist — a media playlist, from which
        // hls.js synthesises a single pseudo-level. Offering it would put a bare bitrate in the
        // menu whose only effect is to return the viewer to the video ladder, which "auto" says
        // far better.
        const { options, activeId } = qualityOptions({
            mode: 'hls-js',
            levels: [{ index: 0, height: 0, label: '64k' }],
            qualities: ['720p', 'audio'],
            selectedQuality: 'audio',
        });

        expect(options.map((option) => option.id)).toEqual(['auto', 'quality:audio']);
        expect(activeId).toBe('quality:audio');
    });

    it('reads the audio rung off the served quality too', () => {
        // A viewer can land on it without having chosen it in this session: `quality` is the rung
        // the backend actually served, which is not necessarily the one that was asked for.
        const { activeId } = qualityOptions({
            mode: 'hls-js',
            levels,
            qualities: ['720p', 'audio'],
            servedQuality: 'audio',
        });
        expect(activeId).toBe('quality:audio');
    });

    it('offers sound only in Safari, which owns its own switching', () => {
        // Native HLS exposes no level list at all, so the ladder is not ours to offer there —
        // the audio rung is the one choice left, and it comes from the API.
        const { options } = qualityOptions({
            mode: 'hls-native',
            levels: null,
            qualities: ['1080p', '720p', 'audio'],
        });
        expect(options.map((option) => option.id)).toEqual(['auto', 'quality:audio']);
    });

    it('offers the API ladder on the pre-HLS progressive path', () => {
        // A `v1/` video has no manifest and each rung is a separate file, so `qualities` is the
        // only list there is and every switch goes back through playback-url.
        const { options, activeId } = qualityOptions({
            mode: 'progressive',
            levels: null,
            qualities: ['1080p', '720p', 'audio'],
            selectedQuality: '720p',
        });

        expect(options.map((option) => option.id)).toEqual([
            'auto',
            'quality:1080p',
            'quality:720p',
            'quality:audio',
        ]);
        expect(activeId).toBe('quality:720p');
    });

    it('keeps the audio rung last and named, wherever it comes from', () => {
        // It sorts last on the API (null height, NULLS LAST) and is the one rung with a catalog
        // label, because its name is an identifier rather than a measurement.
        const { options } = qualityOptions({
            mode: 'progressive',
            qualities: ['audio', '720p'],
        });
        const last = options[options.length - 1];
        expect(last.id).toBe('quality:audio');
        expect(last.label).not.toBe('audio');
        // "720p" is not a word and is shown exactly as the worker produced it.
        expect(options[1].label).toBe('720p');
    });

    it('offers nothing but auto for a single-rung video', () => {
        // The caller hides a group with one option: a source smaller than 480p produces one rung,
        // and a lone choice is clutter.
        const { options } = qualityOptions({ mode: 'progressive', qualities: ['480p'] });
        expect(options).toHaveLength(2);
        expect(qualityOptions({ mode: 'hls-native', qualities: [] }).options).toHaveLength(1);
    });
});

describe('sanitizeRate', () => {
    it('accepts every speed the menu offers', () => {
        for (const rate of PLAYBACK_SPEEDS) {
            expect(sanitizeRate(String(rate))).toBe(rate);
        }
    });

    it('accepts a rate the browser set that the menu does not list', () => {
        // Chrome's and Safari's own control menus can set a speed we never offer, and they are
        // allowed to — mirroring it is what keeps our menu from fighting theirs.
        expect(sanitizeRate(0.9)).toBe(0.9);
    });

    it('falls back to normal speed for anything unusable', () => {
        // Every one of these is reachable: the value comes from localStorage, where a previous
        // version, another tab, or a person with devtools may have left anything at all. Assigning
        // a non-finite or out-of-range rate to a <video> throws NotSupportedError mid-render, on a
        // player with nothing else wrong with it.
        expect(sanitizeRate(null)).toBe(1);
        expect(sanitizeRate(undefined)).toBe(1);
        expect(sanitizeRate('')).toBe(1);
        expect(sanitizeRate('fast')).toBe(1);
        expect(sanitizeRate(NaN)).toBe(1);
        expect(sanitizeRate(Infinity)).toBe(1);
        expect(sanitizeRate(0)).toBe(1);
        expect(sanitizeRate(-1.5)).toBe(1);
        expect(sanitizeRate(16)).toBe(1);
    });
});
