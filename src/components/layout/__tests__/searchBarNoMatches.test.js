import { describe, expect, it } from 'vitest';
import { shouldShowNoMatches } from '@/components/layout/SearchBar';

/**
 * The dropdown's "nothing matches X" line is a claim about what the user typed, and it was made
 * from data that answered an earlier keystroke: the query is debounced by 200ms, and isFetching
 * is false for that whole window, so between keystrokes the message quoted the current text on
 * the strength of a search for the previous one.
 */
describe('shouldShowNoMatches', () => {
    const base = { open: true, input: 'tafsir', settled: 'tafsir', isFetching: false, isError: false, count: 0 };

    it('shows when a settled search for this exact text found nothing', () => {
        expect(shouldShowNoMatches(base)).toBe(true);
    });

    it('stays silent while the data still answers an earlier query', () => {
        // The user has typed on; "taf" found nothing but says nothing about "tafsir".
        expect(shouldShowNoMatches({ ...base, settled: 'taf' })).toBe(false);
    });

    it('stays silent while a request is in flight', () => {
        expect(shouldShowNoMatches({ ...base, isFetching: true })).toBe(false);
    });

    it('does not report a failed request as an empty result', () => {
        expect(shouldShowNoMatches({ ...base, isError: true })).toBe(false);
    });

    it('stays silent when there are suggestions, or the dropdown is closed', () => {
        expect(shouldShowNoMatches({ ...base, count: 3 })).toBe(false);
        expect(shouldShowNoMatches({ ...base, open: false })).toBe(false);
    });

    it('says nothing about an empty box — that is the "before you type" list, not a miss', () => {
        expect(shouldShowNoMatches({ ...base, input: '', settled: '' })).toBe(false);
        expect(shouldShowNoMatches({ ...base, input: '   ', settled: '' })).toBe(false);
    });

    it('compares trimmed text, since that is what is searched', () => {
        expect(shouldShowNoMatches({ ...base, input: '  tafsir  ' })).toBe(true);
    });
});
