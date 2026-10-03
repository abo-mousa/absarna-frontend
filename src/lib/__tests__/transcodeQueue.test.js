import { afterEach, describe, expect, it } from 'vitest';
import { setActiveLocale } from '@/i18n';
import { processingRefetchInterval, queueStatus, queueWait } from '@/lib/transcodeQueue';

afterEach(() => setActiveLocale('ar'));

describe('queueStatus', () => {
    it('is the plain processing row without a queue (a public row, or an older backend)', () => {
        expect(queueStatus(undefined)).toEqual({ waiting: false, detail: null });
        expect(queueStatus(null)).toEqual({ waiting: false, detail: null });
    });

    it('says what is left once nothing is in front', () => {
        setActiveLocale('en');
        expect(queueStatus({ ahead: 0, estimatedSeconds: 95 })).toEqual({ waiting: false, detail: 'about 2 minutes left' });
        expect(queueStatus({ ahead: 0, estimatedSeconds: null })).toEqual({ waiting: false, detail: null });
    });

    it('names the position and when it will be ready while it waits', () => {
        setActiveLocale('en');
        expect(queueStatus({ ahead: 1, estimatedSeconds: 1800 }))
            .toEqual({ waiting: true, detail: '1 video ahead of yours · ready in about 30 minutes' });
        expect(queueStatus({ ahead: 3, estimatedSeconds: 3 * 3600 }))
            .toEqual({ waiting: true, detail: '3 videos ahead of yours · ready in about 3 hours' });
    });

    it('keeps the position and drops the time when the estimate is unknown', () => {
        setActiveLocale('en');
        expect(queueStatus({ ahead: 2, estimatedSeconds: null })).toEqual({ waiting: true, detail: '2 videos ahead of yours' });
    });

    it('counts in Arabic\u2019s own forms', () => {
        setActiveLocale('ar');
        expect(queueStatus({ ahead: 2, estimatedSeconds: 120 }).detail).toBe('أمامه فيديوان · يجهز خلال نحو دقيقتين');
        expect(queueStatus({ ahead: 0, estimatedSeconds: 3 * 60 }).detail).toBe('بقي نحو ٣ دقائق');
    });
});

describe('queueWait', () => {
    it('rounds up, and never says zero', () => {
        setActiveLocale('en');
        expect(queueWait(20)).toBe('under a minute');
        expect(queueWait(61)).toBe('about 2 minutes');
        expect(queueWait(0)).toBeNull();
    });
});

describe('processingRefetchInterval', () => {
    it('polls only while a row on the page is processing', () => {
        expect(processingRefetchInterval({ content: [{ status: 'READY' }] })).toBe(false);
        expect(processingRefetchInterval({ content: [{ status: 'READY' }, { status: 'UPLOADED' }] })).toBe(30000);
        expect(processingRefetchInterval(undefined)).toBe(false);
    });
});
