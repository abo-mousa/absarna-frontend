import { describe, expect, it } from 'vitest';
import {
    autoUpdateIntro,
    importButtonLabel,
    importProgress,
    importReasonText,
    lastCheckedWhen,
    refreshFailureText,
    refreshSummary,
} from '@/components/channel/YouTubeImportPanel';
import { t } from '@/i18n';
import dayjs from '@/lib/datetime';

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
            .toBe(t('youtube.progressOfTotal', { count: '٢٥٬٠٠٠', total: '١٣٧٬٤١٢' }));
    });

    it('reads as a bare count before the total is known', () => {
        // `importTotalEstimate` is null before the first page comes back and again once the import
        // finishes, so the shape has to work without a denominator.
        expect(importProgress({ importedVideos: 50, importTotalEstimate: null }))
            .toBe(t('youtube.progress', { count: '٥٠' }));
        expect(importProgress({ importedVideos: 50 }))
            .toBe(t('youtube.progress', { count: '٥٠' }));
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
        // Grouped with «٬», the Arabic thousands separator — `formatCount` asks Intl for the
        // locale's own grouping rather than mapping digits onto a Latin comma.
        expect(importProgress({ importedVideos: 137412 })).toContain('١٣٧٬٤١٢');
    });
});

describe('importReasonText', () => {
    it('words the codes the backend sends about a run', () => {
        // The pause that used to read «السبب: I/O error on GET request for …: Read timed out».
        expect(importReasonText({ importReason: 'YOUTUBE_UNREACHABLE' }))
            .toBe(t('youtube.importReasons.YOUTUBE_UNREACHABLE'));
        expect(importReasonText({ importReason: 'YOUTUBE_RETRYING' }))
            .toBe(t('youtube.importReasons.YOUTUBE_RETRYING'));
        expect(importReasonText({ importReason: 'YOUTUBE_QUOTA_EXHAUSTED' }))
            .toBe(t('youtube.importReasons.YOUTUBE_QUOTA_EXHAUSTED'));
    });

    it('returns null for a code this build does not know, so importMessage can stand in', () => {
        // A code added on the backend first must not render as its own key — t() would print
        // "youtube.importReasons.SOMETHING_NEW" on screen.
        expect(importReasonText({ importReason: 'SOMETHING_NEW' })).toBeNull();
    });

    it('returns null when there is no code', () => {
        expect(importReasonText({ importReason: null })).toBeNull();
        expect(importReasonText({})).toBeNull();
        expect(importReasonText(undefined)).toBeNull();
    });
});


/**
 * The daily catch-up's only surface.
 *
 * <p>It has no button, no progress bar and nothing to poll, so if these lines are wrong there is no
 * second place an owner could look. The case worth pinning hardest is a check that found NOTHING:
 * that is the answer on almost every day, and rendering nothing for it would leave an owner unable
 * to tell a daily check that is working from one that stopped weeks ago.
 */
describe('autoUpdateIntro', () => {
    it('says the rotation is live once a check has actually happened', () => {
        // A check having run is the only proof the channel is in the rotation — everything else is
        // this side guessing at the backend's eligibility rule.
        expect(autoUpdateIntro({ refreshRanAt: '2026-09-20T10:45:00' }))
            .toBe(t('youtube.autoUpdate.active'));
    });

    it('points at the admin while the import review is pending', () => {
        // The one case where the owner is waiting on somebody else rather than on us, so it beats
        // the "within a day" sentence even though the import itself succeeded.
        expect(autoUpdateIntro({ importStatus: 'SUCCESS', importReview: 'PENDING' }))
            .toBe(t('youtube.autoUpdate.afterApproval'));
    });

    it('promises a first check within a day once the import is approved and done', () => {
        expect(autoUpdateIntro({ importStatus: 'SUCCESS', importReview: 'APPROVED' }))
            .toBe(t('youtube.autoUpdate.soon'));
    });

    it('waits for the import to finish before promising anything', () => {
        // A refresh reads the NEWEST page, so running one against a catalogue still being walked
        // would be starting from the wrong end. PARTIAL is the ordinary multi-day case.
        expect(autoUpdateIntro({ importStatus: 'PARTIAL' }))
            .toBe(t('youtube.autoUpdate.afterImport'));
        expect(autoUpdateIntro({ importStatus: 'RUNNING' }))
            .toBe(t('youtube.autoUpdate.afterImport'));
        expect(autoUpdateIntro({ importStatus: 'FAILED' }))
            .toBe(t('youtube.autoUpdate.afterImport'));
    });
});

describe('refreshSummary', () => {
    it('reports a check that found nothing, rather than saying nothing', () => {
        // THE case. Zero is the ordinary answer, and silence here is indistinguishable from a
        // feature that has stopped running.
        expect(refreshSummary({ refreshRanAt: '2026-09-20T10:45:00', refreshNewVideos: 0 }, 'منذ ساعة'))
            .toBe(t('youtube.autoUpdate.lastCheckedNothing', { when: 'منذ ساعة' }));
    });

    it('words one video as one, since one is what a daily check usually finds', () => {
        expect(refreshSummary({ refreshRanAt: '2026-09-20T10:45:00', refreshNewVideos: 1 }, 'منذ ساعة'))
            .toBe(t('youtube.autoUpdate.lastCheckedAddedOne', { when: 'منذ ساعة' }));
    });

    it('counts anything more, with grouped digits', () => {
        expect(refreshSummary({ refreshRanAt: '2026-09-20T10:45:00', refreshNewVideos: 4 }, 'أمس'))
            .toBe(t('youtube.autoUpdate.lastCheckedAdded', { when: 'أمس', count: '٤' }));
        expect(refreshSummary({ refreshRanAt: '2026-09-20T10:45:00', refreshNewVideos: 1200 }, 'أمس'))
            .toContain('١٬٢٠٠');
    });

    it('says nothing before the first check', () => {
        // refreshRanAt is null until a sweep has reached this channel, which for an approved import
        // is within a day of it finishing. autoUpdateIntro covers that gap instead.
        expect(refreshSummary({ refreshNewVideos: 0 }, 'منذ ساعة')).toBeNull();
        expect(refreshSummary({}, 'منذ ساعة')).toBeNull();
        expect(refreshSummary(undefined, 'منذ ساعة')).toBeNull();
    });

    it('treats a missing or unreadable count as nothing new', () => {
        // The count is 0 on the overwhelmingly common day, so anything that is not a positive
        // number has to read as "nothing new" rather than as a broken sentence.
        expect(refreshSummary({ refreshRanAt: 'x', refreshNewVideos: null }, 'منذ ساعة'))
            .toBe(t('youtube.autoUpdate.lastCheckedNothing', { when: 'منذ ساعة' }));
        expect(refreshSummary({ refreshRanAt: 'x' }, 'منذ ساعة'))
            .toBe(t('youtube.autoUpdate.lastCheckedNothing', { when: 'منذ ساعة' }));
    });
});

describe('refreshFailureText', () => {
    it('words the codes the backend sends about a failed check', () => {
        expect(refreshFailureText({ refreshStatus: 'FAILED', refreshReason: 'YOUTUBE_UNREACHABLE' }))
            .toBe(t('youtube.autoUpdate.failedReason', {
                reason: t('youtube.autoUpdate.reasons.YOUTUBE_UNREACHABLE'),
            }));
    });

    it('falls back to the reasonless sentence for a code this build does not know', () => {
        // Without this, t() would print "youtube.autoUpdate.reasons.SOMETHING_NEW" on screen — and
        // the backend is deployed separately, so it will add a code first at some point.
        expect(refreshFailureText({ refreshStatus: 'FAILED', refreshReason: 'SOMETHING_NEW' }))
            .toBe(t('youtube.autoUpdate.failed'));
        expect(refreshFailureText({ refreshStatus: 'FAILED' }))
            .toBe(t('youtube.autoUpdate.failed'));
    });

    it('says nothing when the last check was fine', () => {
        expect(refreshFailureText({ refreshStatus: 'SUCCESS' })).toBeNull();
        expect(refreshFailureText({})).toBeNull();
        expect(refreshFailureText(undefined)).toBeNull();
    });
});


describe('lastCheckedWhen', () => {
    // The backend sends a zoneless LocalDateTime, read as UTC because the servers run UTC.
    const at = '2026-09-20T10:00:00';

    it('reads a past check as a relative time', () => {
        expect(lastCheckedWhen(at, dayjs('2026-09-20T13:00:00Z'))).toBe('منذ ٣ ساعات');
        // «منذ ٢ أيام», not the Arabic dual «منذ يومين»: this locale's `relativeTime` uses a
        // single `%d` form with the count inline rather than spelling out the dual, which is the
        // app-wide convention and not this line's to change. The digits are Arabic-Indic because
        // every number the app formats now is. Asserted exactly as it renders, so this test
        // documents both conventions rather than only checking the arithmetic.
        expect(lastCheckedWhen(at, dayjs('2026-09-22T10:00:00Z'))).toBe('منذ ٢ أيام');
    });

    it('never renders a check as happening in the FUTURE', () => {
        // Caught by rendering the panel against the real local database: the dev backend does not
        // run UTC, so its timestamp parsed two hours ahead and the line read «آخر تحقق بعد 39
        // دقائق» — last checked IN 39 minutes. In production the same thing happens to any clock
        // drift between the server's write and the reader's browser. A sentence that cannot be true
        // is worse on this line than anywhere else: its whole job is to reassure an owner that the
        // daily check is running.
        expect(lastCheckedWhen(at, dayjs('2026-09-20T09:21:00Z')))
            .toBe(t('youtube.autoUpdate.justNow'));
        // Exactly now counts as now, not as «بعد ثوانٍ».
        expect(lastCheckedWhen(at, dayjs('2026-09-20T10:00:00Z')))
            .toBe(t('youtube.autoUpdate.justNow'));
    });

    it('says nothing when there is no timestamp or it cannot be read', () => {
        expect(lastCheckedWhen(null)).toBeNull();
        expect(lastCheckedWhen(undefined)).toBeNull();
        expect(lastCheckedWhen('')).toBeNull();
        expect(lastCheckedWhen('not a date')).toBeNull();
    });
});
