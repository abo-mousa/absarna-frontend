import { describe, expect, it } from 'vitest';
import { redactItemUrls, withoutQuery } from '@/lib/telemetry';

/**
 * That no live credential leaves the browser inside a telemetry payload.
 *
 * <p>`/reset-password?token=…` is an account takeover for the token's whole hour and
 * `/verify-email?token=…` flips a flag on the account, and Grafana Faro's default `page` meta is
 * `location.href` — the whole href — on every event it sends, including a web vital measured on a
 * page nothing went wrong on. `pageMeta` is not asserted here because it reads `location`; the
 * trimming rule it is built from is, and so is the second path the SDK can reach a raw href by.
 */
describe('withoutQuery', () => {
    it('drops a query string', () => {
        expect(withoutQuery('https://absarna.com/reset-password?token=abc123'))
            .toBe('https://absarna.com/reset-password');
    });

    it('drops a fragment too', () => {
        // The other place a link-borne secret conventionally hides.
        expect(withoutQuery('https://absarna.com/verify-email#token=abc123'))
            .toBe('https://absarna.com/verify-email');
    });

    it('leaves a plain URL alone, and anything that is not a string', () => {
        expect(withoutQuery('https://absarna.com/video/42')).toBe('https://absarna.com/video/42');
        expect(withoutQuery(undefined)).toBeUndefined();
        expect(withoutQuery(null)).toBeNull();
    });
});

describe('redactItemUrls', () => {
    const frame = (filename) => ({ filename, function: 'handler', lineno: 1, colno: 2 });

    it('trims a stack frame that fell back to the page href', () => {
        // buildStackFrame uses `filename || document.location.href`, and that fallback is reached
        // by the empty-source "Script error." every browser reports for a cross-origin script.
        const item = {
            type: 'exception',
            payload: {
                type: 'Error',
                value: 'Script error.',
                stacktrace: { frames: [frame('https://absarna.com/reset-password?token=abc123')] },
            },
        };

        expect(redactItemUrls(item).payload.stacktrace.frames[0].filename)
            .toBe('https://absarna.com/reset-password');
    });

    it('keeps everything else on the frame and on the item', () => {
        const item = {
            type: 'exception',
            meta: { app: { name: 'absarna-frontend' } },
            payload: { value: 'boom', stacktrace: { frames: [frame('/assets/index-abc.js?x=1')] } },
        };
        const out = redactItemUrls(item);

        expect(out.type).toBe('exception');
        expect(out.meta).toEqual(item.meta);
        expect(out.payload.value).toBe('boom');
        expect(out.payload.stacktrace.frames[0]).toMatchObject({ function: 'handler', lineno: 1, colno: 2 });
    });

    it('passes through an item with no stack trace, and never drops one', () => {
        // Telemetry that discards reports is worse than telemetry that trims them — and a
        // beforeSend returning null would silently delete the event.
        const measurement = { type: 'measurement', payload: { values: { lcp: 1200 } } };
        expect(redactItemUrls(measurement)).toBe(measurement);
        expect(redactItemUrls(undefined)).toBeUndefined();
    });
});
