import { describe, expect, it } from 'vitest';
import { activeTab, PHONE_TABS, TABS } from '@/lib/tabs';

/**
 * Where the reader is, for both bars. The cases worth pinning: a detail page belongs to its
 * list's tab, the phone folds Books and Articles into one, and a page under no tab highlights
 * nothing rather than the wrong one.
 */
describe('activeTab', () => {
    it('knows each list', () => {
        expect(activeTab('/')).toBe('today');
        expect(activeTab('/discover')).toBe('discover');
        expect(activeTab('/posts')).toBe('posts');
        expect(activeTab('/channels')).toBe('channels');
    });

    it('puts a detail page under the tab its list lives in', () => {
        expect(activeTab('/books/12')).toBe('books');
        expect(activeTab('/articles/3')).toBe('articles');
        expect(activeTab('/channel/midad')).toBe('channels');
        expect(activeTab('/series/9')).toBe('channels');
    });

    it('folds books and articles into «read» on a phone', () => {
        expect(activeTab('/books', { phone: true })).toBe('read');
        expect(activeTab('/articles/3', { phone: true })).toBe('read');
    });

    it('highlights nothing for a page under no tab, and is not fooled by a shared prefix', () => {
        expect(activeTab('/video/5')).toBeNull();
        expect(activeTab('/profile')).toBeNull();
        expect(activeTab('/booksmith')).toBeNull();
    });

    it('offers six places on a wide screen and five on a phone, every one of them reachable', () => {
        expect(TABS).toHaveLength(6);
        expect(PHONE_TABS).toHaveLength(5);
        for (const tab of [...TABS]) expect(activeTab(tab.to)).toBe(tab.key);
        for (const tab of PHONE_TABS) expect(activeTab(tab.to, { phone: true })).toBe(tab.key);
    });
});
