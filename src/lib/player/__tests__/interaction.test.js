import { describe, expect, it } from 'vitest';
import { ownsShortcut, requestPlay, repeatTarget, toggleMediaMute } from '../interaction';

describe('player interaction regressions', () => {
    it('leaves Space and Enter on buttons to native activation', () => {
        const target = { closest: (selector) => selector.includes('button') ? {} : null };
        expect(ownsShortcut({ key: ' ', target })).toBe(false);
        expect(ownsShortcut({ key: 'Enter', target })).toBe(false);
        expect(ownsShortcut({ key: 'm', target })).toBe(true);
        expect(ownsShortcut({ key: 'f', ctrlKey: true })).toBe(false);
        expect(ownsShortcut({ key: ' ', defaultPrevented: true })).toBe(false);
    });
    it('restores audible volume with a single unmute from zero', () => {
        const media = { muted: false, volume: 0 };
        toggleMediaMute(media, 0.4);
        expect(media).toEqual({ muted: false, volume: 0.4 });
        toggleMediaMute(media);
        expect(media.muted).toBe(true);
    });
    it('surfaces failed playback, asks for a tap when blocked, ignores source-swap aborts', async () => {
        const media = new EventTarget();
        let failures = 0;
        let blocked = 0;
        media.addEventListener('playbackfailure', () => failures++);
        media.addEventListener('playblocked', () => blocked++);
        media.play = () => Promise.reject({ name: 'NotSupportedError' });
        requestPlay(media);
        await Promise.resolve();
        expect(failures).toBe(1);
        media.play = () => Promise.reject({ name: 'NotAllowedError' });
        requestPlay(media);
        await Promise.resolve();
        expect([failures, blocked]).toEqual([1, 1]);
        media.play = () => Promise.reject({ name: 'AbortError' });
        requestPlay(media);
        await Promise.resolve();
        expect([failures, blocked]).toEqual([1, 1]);
    });
    it('repeats only complete, valid intervals at their end', () => {
        expect(repeatTarget(20.1, { start: 10, end: 20 }, 19.8)).toBe(10);
        expect(repeatTarget(19, { start: 10, end: 20 }, 18.8)).toBe(null);
        expect(repeatTarget(25, { start: 10, end: null }, 19)).toBe(null);
        expect(repeatTarget(25, { start: 20, end: 10 }, 15)).toBe(null);
    });
    it('lets a seek past B stand', () => {
        // Straight after a seek there is no previous playback time.
        expect(repeatTarget(25, { start: 10, end: 20 }, null)).toBe(null);
        // Playing on from beyond B, or from before A, is not running into B.
        expect(repeatTarget(25.3, { start: 10, end: 20 }, 25)).toBe(null);
        expect(repeatTarget(20.2, { start: 10, end: 20 }, 5)).toBe(null);
    });
});
