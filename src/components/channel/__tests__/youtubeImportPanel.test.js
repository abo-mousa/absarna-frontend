import { describe, expect, it } from 'vitest';
import { importButtonLabel, importProgress } from '@/components/channel/YouTubeImportPanel';
import { t } from '@/i18n';

/**
 * What the import panel offers, and what it says it has done.
 *
 * <p>`PARTIAL` had no branch anywhere in this app: it fell through every condition, so a paused
 * import rendered the «الاستيراد» heading with <b>nothing under it and no button</b> — the owner
 * had no way to continue, and no way to tell a paused import from a broken page. On a catalogue
 * larger than the platform's shared daily YouTube quota that is the ordinary path, not an edge
 * case, so the state that reads as broken is the one that happens most.
 *
 * <p>Asserted here rather than through the rendered panel because this repo's tests are
 * pure-function (no jsdom) — see `watchThreshold` in VideoPlayer for the same shape.
 */

describe('importButtonLabel', () => {
    it('offers a start when nothing has run', () => {
        expect(importButtonLabel(undefined)).toBe(t('youtube.startImport'));
        expect(importButtonLabel(null)).toBe(t('youtube.startImport'));
    });

    it('offers a resume on PARTIAL, and not a retry', () => {
        // The distinction is the point: PARTIAL means the quota ran out and the backend saved a
        // resume point, so «أعد المحاولة» would tell an owner their import broke when it did not.
        expect(importButtonLabel('PARTIAL')).toBe(t('youtube.resumeImport'));
        expect(importButtonLabel('PARTIAL')).not.toBe(t('youtube.retryImport'));
    });

    it('offers a retry on FAILED', () => {
        expect(importButtonLabel('FAILED')).toBe(t('youtube.retryImport'));
    });

    it('offers no button at all while running, or once finished', () => {
        // A second walk of a large catalogue costs the whole platform its daily quota, so neither
        // of these may be one click from starting one.
        expect(importButtonLabel('RUNNING')).toBeNull();
        expect(importButtonLabel('SUCCESS')).toBeNull();
    });
});

describe('importProgress', () => {
    it('reads as a fraction once YouTube has told us the total', () => {
        expect(importProgress({ importedVideos: 25000, importTotalEstimate: 137412 }))
            .toBe(t('youtube.progressOfTotal', { count: '25,000', total: '137,412' }));
    });

    it('reads as a bare count before the total is known', () => {
        // `importTotalEstimate` is null before the first page comes back and again once the import
        // finishes, so the shape has to work without a denominator.
        expect(importProgress({ importedVideos: 50, importTotalEstimate: null }))
            .toBe(t('youtube.progress', { count: '50' }));
        expect(importProgress({ importedVideos: 50 }))
            .toBe(t('youtube.progress', { count: '50' }));
    });

    it('says nothing while there is nothing to report', () => {
        // A walk that has committed no page yet reports 0, and «تم استيراد 0 فيديو» beside a
        // spinner reads as a failure rather than as a start.
        expect(importProgress({ importedVideos: 0, importTotalEstimate: 137412 })).toBeNull();
        expect(importProgress({})).toBeNull();
        expect(importProgress(undefined)).toBeNull();
        expect(importProgress({ importedVideos: null })).toBeNull();
    });

    it('groups the digits, since the numbers this reports are five and six figures', () => {
        expect(importProgress({ importedVideos: 137412 })).toContain('137,412');
    });
});
