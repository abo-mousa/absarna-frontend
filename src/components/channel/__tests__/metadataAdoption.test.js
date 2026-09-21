import { describe, expect, it } from 'vitest';
import {
    adoptionRemainingLine,
    adoptionState,
    idsOnPage,
} from '@/components/channel/MetadataAdoptionView';
import { t } from '@/i18n';
import { formatCount } from '@/lib/numbers';

/**
 * What the metadata-confirmation screen decides before it renders anything.
 *
 * <p>Pure functions, like the rest of this repo's component tests (no jsdom) — and these three are
 * the whole of the screen's logic worth pinning. The ORDER of `adoptionState`'s branches is the
 * part that would break silently: every one of them returns a plausible-looking screen, so getting
 * it wrong shows an owner a state that is merely the wrong one rather than an error anybody would
 * report.
 */

describe('adoptionState', () => {
    it('reports a channel the owner has not proved before it reports it finished', () => {
        // The case the ordering exists for. An admin-linked channel has canAdopt false AND, very
        // often, nothing awaiting — because the owner has never been able to start. Testing
        // "finished" first would congratulate them on work they are locked out of.
        expect(adoptionState({ canAdopt: false, imported: 0, awaiting: 0 })).toBe('blocked');
        expect(adoptionState({ canAdopt: false, imported: 40, awaiting: 40 })).toBe('blocked');
    });

    it('separates a channel with nothing imported from one that is done', () => {
        // Both have zero awaiting and neither is an achievement, but only one of them should say
        // «تم تأكيد كل المحتوى» — on a channel that imported nothing that sentence is a lie.
        expect(adoptionState({ canAdopt: true, imported: 0, awaiting: 0 })).toBe('none');
        expect(adoptionState({ canAdopt: true, imported: 12, awaiting: 0 })).toBe('done');
    });

    it('is working while anything remains', () => {
        expect(adoptionState({ canAdopt: true, imported: 2000, awaiting: 1847 })).toBe('working');
        expect(adoptionState({ canAdopt: true, imported: 2000, awaiting: 1 })).toBe('working');
    });

    it('waits rather than guessing before the progress has arrived', () => {
        expect(adoptionState(undefined)).toBe('loading');
        expect(adoptionState(null)).toBe('loading');
    });
});

describe('adoptionRemainingLine', () => {
    it('counts what is left, not what is finished', () => {
        // The opposite of the import progress line directly above it on the panel, deliberately:
        // an import is the platform working for the owner, and this is the owner's own task.
        expect(adoptionRemainingLine({ imported: 2000, awaiting: 1847 })).toBe(
            t('youtube.adoption.remaining', {
                count: formatCount(1847),
                total: formatCount(2000),
            }),
        );
    });

    it('says so when the work is done', () => {
        expect(adoptionRemainingLine({ imported: 2000, awaiting: 0 })).toBe(
            t('youtube.adoption.allConfirmed', { count: formatCount(2000) }),
        );
    });

    it('says nothing about a channel with no imported content', () => {
        expect(adoptionRemainingLine({ imported: 0, awaiting: 0 })).toBeNull();
        expect(adoptionRemainingLine(undefined)).toBeNull();
        expect(adoptionRemainingLine({})).toBeNull();
    });
});

describe('idsOnPage', () => {
    it('takes the ids from the page that is on screen', () => {
        expect(idsOnPage({ content: [{ id: 3 }, { id: 9 }] })).toEqual([3, 9]);
    });

    it('is empty rather than throwing before a page has loaded', () => {
        // The confirm button is disabled on an empty list, so this must not be the thing that
        // fails — a page mid-load would otherwise crash the screen rather than wait for it.
        expect(idsOnPage(undefined)).toEqual([]);
        expect(idsOnPage({})).toEqual([]);
        expect(idsOnPage({ content: null })).toEqual([]);
    });
});
