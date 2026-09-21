import { describe, expect, it } from 'vitest';
import { paragraphParts } from '@/components/layout/LegalDocument';
import { ar } from '@/i18n/ar';

/**
 * The legal pages' paragraph shape, and the two links YouTube's terms require us to display.
 *
 * <p>`paragraphParts` is trivial on its own; what these tests are really pinning is that the
 * REQUIRED LINKS ARE STILL THERE. III.A of the API Services Terms says our terms of use must
 * display a link to YouTube's terms, and our privacy policy must link to Google's — and the way
 * either disappears is not someone deleting it, it is someone rewriting a paragraph and
 * flattening an array back into a string. That reads as a tidy-up, renders as prose, and silently
 * puts us back in breach. Asserting the URLs is how that stops being invisible.
 */

const hrefsIn = (sections) =>
    sections.flatMap((section) => [
        ...(section.paragraphs ?? []),
        ...(section.bullets ?? []),
    ])
        .flatMap(paragraphParts)
        .filter((part) => typeof part === 'object' && part?.href)
        .map((part) => part.href);

describe('paragraphParts', () => {
    it('treats a plain string as a one-part paragraph', () => {
        // The overwhelming majority of the policy, and all of it written before links existed.
        // A format change underneath the person editing a policy is how it stops being edited.
        expect(paragraphParts('نص عادي')).toEqual(['نص عادي']);
    });

    it('passes a mixed paragraph through as its parts', () => {
        const paragraph = ['قبل ', { text: 'رابط', href: 'https://example.com' }, ' بعد'];
        expect(paragraphParts(paragraph)).toEqual(paragraph);
    });

    it('is empty rather than throwing on a missing paragraph', () => {
        expect(paragraphParts(undefined)).toEqual([]);
        expect(paragraphParts(null)).toEqual([]);
    });
});

describe('the disclosures YouTube requires', () => {
    it('links the terms of use to YouTube terms of service', () => {
        // III.A: our terms must DISPLAY a link to this, and say users agree to be bound by it.
        expect(hrefsIn(ar.legal.terms.sections)).toContain('https://www.youtube.com/t/terms');
    });

    it('links the privacy policy to Google privacy policy', () => {
        // III.A again, the other half — plus the revocation link Google requires once an OAuth
        // sign-in is offered at all.
        const hrefs = hrefsIn(ar.legal.privacy.sections);
        expect(hrefs).toContain('https://policies.google.com/privacy');
        expect(hrefs).toContain('https://myaccount.google.com/permissions');
    });

    it('no longer claims nothing about readers reaches Google', () => {
        // The sentence that was there said exactly this, and it was false on every page carrying
        // an imported video's thumbnail. Pinned as a string so a well-meaning restoration of the
        // "cleaner" wording fails here rather than in a regulator's letter.
        const text = JSON.stringify(ar.legal.privacy.sections);
        expect(text).not.toContain('ولا يُرسَل إلى يوتيوب ولا إلى جوجل شيء عن قرّاء المنصة');
    });
});
