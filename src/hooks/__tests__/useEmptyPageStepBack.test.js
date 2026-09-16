import { describe, expect, it } from 'vitest';
import { pageAfterEmpty } from '@/hooks/useEmptyPageStepBack';

/** Where a paged owner list goes when the page on screen comes back empty. */
describe('pageAfterEmpty', () => {
    it('steps back to the page that is now last after its last row is deleted', () => {
        // Was on page 3 (index 2) of 3; its only row went, so the server now reports 2 pages.
        expect(pageAfterEmpty(2, { content: [], totalPages: 2 })).toBe(1);
    });

    it('goes to the first page when the whole list is gone', () => {
        expect(pageAfterEmpty(4, { content: [], totalPages: 0 })).toBe(0);
    });

    it('stays put on a page with rows, on the first page, and before data arrives', () => {
        expect(pageAfterEmpty(2, { content: [{ id: 1 }], totalPages: 3 })).toBeNull();
        // An empty first page is simply an empty list — «لا يوجد محتوى بعد» is right there.
        expect(pageAfterEmpty(0, { content: [], totalPages: 0 })).toBeNull();
        expect(pageAfterEmpty(3, undefined)).toBeNull();
    });
});
