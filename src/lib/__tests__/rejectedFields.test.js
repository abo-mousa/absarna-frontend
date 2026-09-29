import { describe, expect, it } from 'vitest';
import { fieldErrorMessage, fieldMessagesOf, rejectedFieldsOf } from '@/lib/rejectedFields';
import { t } from '@/i18n';

const failure = (data) => ({ response: { status: 400, data } });

describe('rejectedFieldsOf', () => {
    it('reads the refused field names from a VALIDATION_FAILED', () => {
        expect([...rejectedFieldsOf(failure({ reason: 'VALIDATION_FAILED', fields: ['title', 'logoUrl'] }))])
            .toEqual(['title', 'logoUrl']);
    });

    it('marks nothing for any other failure, or none at all', () => {
        expect(rejectedFieldsOf(failure({ reason: 'CHANNEL_NOT_FOUND' })).size).toBe(0);
        expect(rejectedFieldsOf(failure({ reason: 'VALIDATION_FAILED' })).size).toBe(0);
        expect(rejectedFieldsOf({ code: 'ERR_NETWORK' }).size).toBe(0);
        expect(rejectedFieldsOf(null).size).toBe(0);
    });

    it('ignores entries that are not field names', () => {
        expect([...rejectedFieldsOf(failure({ reason: 'VALIDATION_FAILED', fields: ['title', '', 7, null] }))])
            .toEqual(['title']);
    });
});

describe('fieldMessagesOf', () => {
    it('says which rule each field broke, not only that it was refused', () => {
        const messages = fieldMessagesOf(failure({
            reason: 'VALIDATION_FAILED',
            fields: ['slug', 'name', 'logoUrl'],
            fieldErrors: [
                { field: 'slug', code: 'Pattern' },
                { field: 'name', code: 'Size', max: 255 },
                { field: 'logoUrl', code: 'URL' },
            ],
        }));
        expect(messages.get('slug')).toBe(t('errors.fieldRules.byField.slug.Pattern'));
        expect(messages.get('name')).toBe(t('errors.fieldRules.sizeMax', { max: 255 }));
        expect(messages.get('logoUrl')).toBe(t('errors.fieldRules.URL'));
    });

    it('words the first rule a field broke, once', () => {
        const messages = fieldMessagesOf(failure({
            reason: 'VALIDATION_FAILED',
            fieldErrors: [{ field: 'slug', code: 'NotBlank' }, { field: 'slug', code: 'Pattern' }],
        }));
        expect([...messages.values()]).toEqual([t('errors.fieldRules.NotBlank')]);
    });

    it('still marks a field from a backend that sends names only', () => {
        const messages = fieldMessagesOf(failure({ reason: 'VALIDATION_FAILED', fields: ['title'] }));
        expect(messages.get('title')).toBe(t('errors.fieldRules.Invalid'));
    });

    it('puts a field-shaped business refusal under its field', () => {
        const messages = fieldMessagesOf(failure({ reason: 'CHANNEL_SLUG_TAKEN' }));
        expect(messages.get('slug')).toBe(t('errors.reasons.CHANNEL_SLUG_TAKEN'));
    });

    it('falls back to a plain sentence for a rule it has no wording for, never the server text', () => {
        expect(fieldErrorMessage({ field: 'x', code: 'SomethingNew' })).toBe(t('errors.fieldRules.Invalid'));
        expect(fieldErrorMessage({ field: 'x', code: 'Size', min: 2, max: 10 }))
            .toBe(t('errors.fieldRules.sizeBetween', { min: 2, max: 10 }));
        expect(fieldErrorMessage({ field: 'x', code: 'Min', value: 1 })).toBe(t('errors.fieldRules.min', { value: 1 }));
    });
});
