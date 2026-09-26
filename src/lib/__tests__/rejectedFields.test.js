import { describe, expect, it } from 'vitest';
import { rejectedFieldsOf } from '@/lib/rejectedFields';

const failure = (data) => ({ response: { status: 400, data } });

describe('rejectedFieldsOf', () => {
    it('reads the refused field names from a VALIDATION_FAILED', () => {
        expect([...rejectedFieldsOf(failure({ reason: 'VALIDATION_FAILED', fields: ['title', 'logoUrl'] }))])
            .toEqual(['title', 'logoUrl']);
    });

    it('marks nothing for any other failure, or none at all', () => {
        expect(rejectedFieldsOf(failure({ reason: 'CHANNEL_SLUG_TAKEN' })).size).toBe(0);
        expect(rejectedFieldsOf(failure({ reason: 'VALIDATION_FAILED' })).size).toBe(0);
        expect(rejectedFieldsOf({ code: 'ERR_NETWORK' }).size).toBe(0);
        expect(rejectedFieldsOf(null).size).toBe(0);
    });

    it('ignores entries that are not field names', () => {
        expect([...rejectedFieldsOf(failure({ reason: 'VALIDATION_FAILED', fields: ['title', '', 7, null] }))])
            .toEqual(['title']);
    });
});
