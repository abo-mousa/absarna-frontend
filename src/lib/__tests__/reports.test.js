import { describe, expect, it } from 'vitest';
import {
    NOTE_MAX_LENGTH,
    REPORT_DECISIONS,
    REPORT_REASONS,
    REPORT_TARGET_TYPE,
    corroboration,
    reasonHint,
    reasonLabel,
    statusLabel,
    targetPath,
    targetTypeLabel,
    targetTypeOf,
} from '@/lib/reports';
import { ar } from '@/i18n/ar';

describe('targetTypeOf', () => {
    it('maps the app\'s own type words to the wire enum', () => {
        expect(targetTypeOf('video')).toBe('VIDEO');
        expect(targetTypeOf('comment')).toBe('COMMENT');
    });

    /**
     * The one that matters: a caller passing something unreportable must not produce a request to
     * `/reports/undefined/7`. The hooks gate their `enabled` on this being non-null.
     */
    it('answers null for anything not reportable', () => {
        expect(targetTypeOf('series')).toBeNull();
        expect(targetTypeOf(undefined)).toBeNull();
    });
});

describe('REPORT_REASONS', () => {
    /**
     * MISATTRIBUTION first is the editorial decision this whole feature turns on: on a platform
     * publishing religious teaching, content credited to a scholar who did not say it is the most
     * consequential error there is, and it is the one reason on the list no detector will ever
     * have an opinion about. A list copied from a general-purpose platform would not carry it at
     * all; one that carried it eighth would bury it under the reasons automated review covers.
     */
    it('puts misattribution where it will be read, and OTHER last', () => {
        expect(REPORT_REASONS[0]).toBe('MISATTRIBUTION');
        expect(REPORT_REASONS[REPORT_REASONS.length - 1]).toBe('OTHER');
    });

    it('matches the backend enum exactly — no more, no fewer', () => {
        // Sorted, because the ORDER is this side's decision and the SET is the backend's.
        expect([...REPORT_REASONS].sort()).toEqual([
            'COPYRIGHT', 'HATE_OR_ABUSE', 'MISATTRIBUTION', 'MISINFORMATION',
            'OTHER', 'SEXUAL_CONTENT', 'SPAM_OR_SCAM', 'VIOLENCE',
        ]);
    });

    it('has Arabic wording for every one of them', () => {
        // The labels are looked up through a template literal, so the i18n test that walks the
        // source for literal catalog keys cannot see them — a template one is a runtime lookup
        // and is deliberately allowed to miss there. This is the coverage that replaces it.
        // (Written without an example key on purpose: that walker would match the example.)
        const missing = REPORT_REASONS.filter((code) => reasonLabel(code) === code);
        expect(missing).toEqual([]);
        expect(REPORT_REASONS.every((code) => typeof reasonHint(code) === 'string')).toBe(true);
    });
});

describe('open-set labels', () => {
    /**
     * Every one of these lookups is keyed by a value that came from the BACKEND, so a code added
     * there before this repo learns a word for it must render as itself rather than as a dotted
     * key in the middle of an Arabic screen. `t()` would return the key; these use `tOptional`.
     */
    it('falls back to the raw value rather than rendering a catalog key', () => {
        expect(reasonLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
        expect(statusLabel('ESCALATED')).toBe('ESCALATED');
        expect(targetTypeLabel('SERIES')).toBe('SERIES');
    });

    it('words the ones it does know', () => {
        expect(statusLabel('OPEN')).toBe(ar.adminReports.statuses.open);
        expect(targetTypeLabel('VIDEO')).toBe(ar.adminReports.targetTypes.video);
        expect(reasonLabel('MISATTRIBUTION')).toBe(ar.report.reasons.MISATTRIBUTION.label);
    });

    it('survives a null without throwing or printing "null"', () => {
        expect(statusLabel(null)).toBe('');
        expect(targetTypeLabel(undefined)).toBe('');
    });
});

describe('targetPath', () => {
    it('routes the three types that have a page of their own', () => {
        expect(targetPath('VIDEO', 7)).toBe('/video/7');
        expect(targetPath('BOOK', 7)).toBe('/books/7');
        expect(targetPath('ARTICLE', 7)).toBe('/articles/7');
    });

    /**
     * A post is a card inside its channel's page and a comment lives under whatever it was written
     * on — neither has a route. Returning null is what makes the moderation screen fall back to
     * the channel, which is somewhere a moderator can actually act; a fabricated `/posts/7` would
     * 404 and teach them the link is broken.
     */
    it('answers null for the two with no page, rather than guessing one', () => {
        expect(targetPath('POST', 7)).toBeNull();
        expect(targetPath('COMMENT', 7)).toBeNull();
        expect(targetPath('VIDEO', null)).toBeNull();
    });
});

describe('corroboration', () => {
    /**
     * The number is worth rendering exactly when it is more than one: that is the moment a queue
     * of individual objections becomes "ten people said this". A «1» on every row would make the
     * interesting rows harder to spot, not easier.
     */
    it('is null for the ordinary single complaint', () => {
        expect(corroboration(1)).toBeNull();
        expect(corroboration(0)).toBeNull();
    });

    it('is the count once more than one person has said it', () => {
        expect(corroboration(10)).toBe(10);
    });

    it('tolerates a missing or unparseable field', () => {
        expect(corroboration(undefined)).toBeNull();
        expect(corroboration('lots')).toBeNull();
    });
});

describe('the contract constants', () => {
    it('matches ReportRequest\'s @Size(max = 1000), which matches the column', () => {
        expect(NOTE_MAX_LENGTH).toBe(1000);
    });

    /**
     * OPEN is absent on purpose — the backend answers 400 for it. Re-opening a decided report is
     * not a decision, and the queue's meaning depends on a decided row staying decided.
     */
    it('offers only the two decisions the backend accepts', () => {
        expect(REPORT_DECISIONS).toEqual(['ACTIONED', 'DISMISSED']);
        expect(REPORT_DECISIONS).not.toContain('OPEN');
    });

    it('covers every reportable target type the backend names', () => {
        expect(Object.values(REPORT_TARGET_TYPE))
            .toEqual(['VIDEO', 'BOOK', 'ARTICLE', 'POST', 'COMMENT']);
    });
});
