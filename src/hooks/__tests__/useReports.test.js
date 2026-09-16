import { describe, expect, it } from 'vitest';
import { reportQueueQuery } from '@/hooks/useReports';

/**
 * The moderation queue's query string.
 *
 * <p>Worth a test of its own for one reason: `status` repeats, and getting that wrong fails as a
 * 400 on a filter press rather than as anything that names the cause. The sibling review queue
 * comma-joins ITS multi-value parameter, so the wrong shape is one copy-paste away and looks
 * right in both places.
 */
describe('reportQueueQuery', () => {
    it('repeats `status` rather than comma-joining it', () => {
        const query = reportQueueQuery({ statuses: ['OPEN', 'ACTIONED'] });
        expect(query).toContain('status=OPEN');
        expect(query).toContain('status=ACTIONED');
        // The shape that would 400: one value that is not an enum constant.
        expect(query).not.toContain('OPEN%2CACTIONED');
    });

    it('always sends the page and the size, even at their defaults', () => {
        // So the request in a network tab is the request that was meant, rather than one leaning
        // on the server's idea of a page.
        expect(reportQueueQuery()).toBe('page=0&size=20');
    });

    it('omits the target filter entirely when there is none', () => {
        // Not `targetType=` empty: the backend binds that to an enum and answers 400.
        expect(reportQueueQuery({ targetType: '' })).not.toContain('targetType');
        expect(reportQueueQuery({ targetType: null })).not.toContain('targetType');
        expect(reportQueueQuery({ targetType: 'VIDEO' })).toContain('targetType=VIDEO');
    });

    it('sends no status at all when none are selected, leaving the backend its OPEN default', () => {
        expect(reportQueueQuery({ statuses: [] })).not.toContain('status');
        expect(reportQueueQuery({ statuses: null })).not.toContain('status');
    });

    it('pages', () => {
        expect(reportQueueQuery({ page: 3, size: 50 })).toBe('page=3&size=50');
    });
});
