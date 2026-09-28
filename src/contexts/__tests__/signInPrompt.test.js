import { describe, expect, it } from 'vitest';
import { SIGN_IN_ACTIONS, signInHeadlineKey, signInReasonKey } from '@/contexts/SignInPromptContext';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';

const lookup = (catalog, key) => key.split('.').reduce((node, part) => node?.[part], catalog);

describe('signInReasonKey', () => {
    it('gives every action a sentence of its own in both languages', () => {
        for (const action of SIGN_IN_ACTIONS) {
            const key = signInReasonKey(action);
            expect(key).toBe(`signInPrompt.reason.${action}`);
            expect(typeof lookup(ar, key)).toBe('string');
            expect(typeof lookup(en, key)).toBe('string');
            expect(typeof lookup(ar, signInHeadlineKey(action))).toBe('string');
            expect(typeof lookup(en, signInHeadlineKey(action))).toBe('string');
        }
    });

    it('falls back to the generic sentence for an action it does not know', () => {
        // The popup is opened as `promptSignIn()` with no argument too, and must never render a key.
        expect(signInReasonKey(undefined)).toBe('signInPrompt.reason.generic');
        expect(signInReasonKey('somethingNew')).toBe('signInPrompt.reason.generic');
        expect(signInHeadlineKey('somethingNew')).toBe('signInPrompt.headline.generic');
        expect(typeof lookup(ar, 'signInPrompt.reason.generic')).toBe('string');
    });
});
