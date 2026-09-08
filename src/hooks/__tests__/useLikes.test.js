import { describe, expect, it } from 'vitest';
import { nextLikeState } from '@/hooks/useLikes';

/**
 * The like toggle updates its count optimistically, because the number sits directly beside the
 * button that changes it — a press that does nothing visible until the round trip lands reads as
 * broken, and refetching instead shows a stale count for the same window.
 */
describe('nextLikeState', () => {
    it('increments when liking', () => {
        expect(nextLikeState({ liked: false, likeCount: 4 }, false))
            .toEqual({ liked: true, likeCount: 5 });
    });

    it('decrements when unliking', () => {
        expect(nextLikeState({ liked: true, likeCount: 4 }, true))
            .toEqual({ liked: false, likeCount: 3 });
    });

    /**
     * The case that actually bites: nothing is cached until the status query resolves, so an
     * early press has no count to work from. Unclamped this renders "-1 إعجاب" until the
     * refetch corrects it.
     */
    it('never goes below zero, and tolerates no cached status at all', () => {
        expect(nextLikeState(undefined, true)).toEqual({ liked: false, likeCount: 0 });
        expect(nextLikeState({ liked: true, likeCount: 0 }, true))
            .toEqual({ liked: false, likeCount: 0 });
    });

    it('counts up from nothing when the first press is a like', () => {
        expect(nextLikeState(undefined, false)).toEqual({ liked: true, likeCount: 1 });
    });
});
