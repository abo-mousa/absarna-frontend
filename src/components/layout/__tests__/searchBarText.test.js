import { describe, expect, it } from 'vitest';
import { searchTextForLocation } from '@/components/layout/SearchBar';

/**
 * The box used to empty itself the moment it was submitted, so the results page showed a search
 * whose words survived only in the heading — and the one control that could refine it started
 * blank. It mirrors the location instead: the results page's `?q=` while the results are up,
 * nothing anywhere else.
 */
describe('searchTextForLocation', () => {
    it('shows the query the results on screen answer', () => {
        expect(searchTextForLocation('/search', '?q=%D8%AA%D9%81%D8%B3%D9%8A%D8%B1')).toBe('تفسير');
    });

    it('empties on every other page, however it was reached', () => {
        expect(searchTextForLocation('/', '')).toBe('');
        expect(searchTextForLocation('/video/42', '?t=90')).toBe('');
        // A suggestion carries the visitor off to a video; the box does not follow them there.
        expect(searchTextForLocation('/channel/tafsir', '?q=leftover')).toBe('');
    });

    it('is empty for a results page with no query, rather than showing "null"', () => {
        expect(searchTextForLocation('/search', '')).toBe('');
        expect(searchTextForLocation('/search', '?page=2')).toBe('');
    });

    it('shows `q` as it stands, since the box is where it gets corrected', () => {
        // `goToSearch` trims before it navigates, but a hand-typed URL need not have.
        expect(searchTextForLocation('/search', '?q=+')).toBe(' ');
    });
});
