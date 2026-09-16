import { describe, expect, it } from 'vitest';
import {
    DEFAULT_TAB,
    MANAGE_SECTIONS,
    importIndicator,
    resolveTab,
} from '@/components/channel/ChannelManageNav';

/**
 * The dashboard's menu: which section a URL opens, and when the YouTube item carries a dot.
 *
 * <p>Pure-function tests, as elsewhere in this repo (no jsdom).
 */

describe('resolveTab', () => {
    it('opens the section the URL names', () => {
        expect(resolveTab('comments')).toBe('comments');
        expect(resolveTab('youtube')).toBe('youtube');
        expect(resolveTab('settings')).toBe('settings');
    });

    it('opens the first item for a missing or unknown section, never a blank page', () => {
        // «نظرة عامة» was `overview` before it became `settings`; a link saved then must still
        // land somewhere.
        expect(DEFAULT_TAB).toBe('videos');
        expect(resolveTab(null)).toBe('videos');
        expect(resolveTab('')).toBe('videos');
        expect(resolveTab('overview')).toBe('videos');
        // Series became part of the videos section; a saved ?tab=series link lands there.
        expect(resolveTab('series')).toBe('videos');
    });
});

describe('MANAGE_SECTIONS', () => {
    it('lists every section once, with the set-up-once ones last', () => {
        const ids = MANAGE_SECTIONS.flatMap((s) => s.items.map((i) => i.id));
        expect(new Set(ids).size).toBe(ids.length);
        expect(MANAGE_SECTIONS.at(-1).items.map((i) => i.id)).toEqual(['youtube', 'settings']);
    });
});

describe('importIndicator', () => {
    it('marks an import that is running or waiting on the owner', () => {
        expect(importIndicator({ importStatus: 'RUNNING' })).toBe('running');
        expect(importIndicator({ importStatus: 'PARTIAL' })).toBe('paused');
    });

    it('stays quiet once there is nothing to act on', () => {
        // A finished or failed import says so inside its own tab; a dot for either would never
        // go away.
        expect(importIndicator({ importStatus: 'SUCCESS' })).toBeNull();
        expect(importIndicator({ importStatus: 'FAILED' })).toBeNull();
        expect(importIndicator({ importStatus: null })).toBeNull();
        expect(importIndicator(undefined)).toBeNull();
    });
});
