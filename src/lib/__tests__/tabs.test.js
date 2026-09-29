import { describe, expect, it } from 'vitest';
import { activeTab, readSection, READ_SECTIONS, TABS } from '@/lib/tabs';

/**
 * Where the reader is, for both bars. The cases worth pinning: a detail page belongs to its
 * list's tab, «اقرأ» holds books, articles and posts, and a page under no tab highlights nothing
 * rather than the wrong one.
 */
describe('activeTab', () => {
    it('knows each list', () => {
        expect(activeTab('/')).toBe('today');
        expect(activeTab('/watch')).toBe('discover');
        expect(activeTab('/discover')).toBe('discover');
        expect(activeTab('/channels')).toBe('channels');
        expect(activeTab('/journey')).toBe('journey');
    });

    it('puts books, articles and posts under «اقرأ», each its own section', () => {
        for (const path of ['/books', '/books/12', '/articles/3', '/posts']) expect(activeTab(path)).toBe('read');
        expect(readSection('/books/12')).toBe('books');
        expect(readSection('/articles/3')).toBe('articles');
        expect(readSection('/posts')).toBe('posts');
        expect(readSection('/channels')).toBeNull();
    });

    it('puts a detail page under the tab its list lives in', () => {
        expect(activeTab('/channel/midad')).toBe('channels');
        expect(activeTab('/series/9')).toBe('channels');
        expect(activeTab('/journey/goals/4')).toBe('journey');
        expect(activeTab('/history')).toBe('journey');
    });

    it('highlights nothing for a page under no tab, and is not fooled by a shared prefix', () => {
        expect(activeTab('/video/5')).toBeNull();
        expect(activeTab('/profile')).toBeNull();
        expect(activeTab('/booksmith')).toBeNull();
        expect(activeTab('/journeyman')).toBeNull();
    });

    it('offers the same five places at every width, every one of them reachable', () => {
        expect(TABS.map((tab) => tab.key)).toEqual(['today', 'discover', 'read', 'channels', 'journey']);
        for (const tab of TABS) expect(activeTab(tab.to)).toBe(tab.key);
        for (const section of READ_SECTIONS) expect(readSection(section.to)).toBe(section.key);
    });
});
