import { describe, expect, it } from 'vitest';
import { describeError, reasonMessage, serverMessage } from '@/lib/describeError';
import { t } from '@/i18n';

/**
 * Which sentence a failed request puts on the screen.
 *
 * <p>The case this exists for: a channel awaiting approval is refused an import with
 * `403 {"error":"غير مصرح لك"}`, and every part of that body was discarded — only 429 ever looked
 * at one — so the owner was shown «ليس لديك صلاحية لهذا الإجراء» at best and, in the panel that
 * reported it, nothing at all.
 *
 * <p>The half that is easy to get wrong in the other direction is the reason these assert English
 * bodies too. The backend uses `error` for <b>two different things</b>: the HTTP reason phrase in
 * `GlobalExceptionHandler.buildResponse`, and the user's own sentence in a controller's ad-hoc
 * `forbidden()`. A fix that simply preferred `error` would have printed <b>"Forbidden"</b> at an
 * Arabic reader on every 403 the global handler answered — a regression that looks like a feature
 * in review, because the body really was being used.
 */

/** An axios-shaped rejection. */
const failure = (status, data) => ({ response: { status, data } });

describe('reasonMessage', () => {
    it('words a business reason the backend named', () => {
        // The reported case: an owner presses import on a channel awaiting review. What made this
        // unanswerable before is that the status alone cannot express it — the caller IS the
        // owner and IS authorised, so every sentence keyed off 403 is simply false.
        expect(reasonMessage(failure(403, { reason: 'CHANNEL_REJECTED' })))
            .toBe(t('errors.reasons.CHANNEL_REJECTED'));
    });

    it('reads a reason at any status, including 5xx', () => {
        // A code selects a sentence we wrote, so it cannot leak internals the way a 5xx body can.
        // And «حدث خلل في الخادم» is the wrong answer for an unconfigured deployment: nothing
        // will change by waiting.
        expect(reasonMessage(failure(503, { reason: 'YOUTUBE_NOT_CONFIGURED' })))
            .toBe(t('errors.reasons.YOUTUBE_NOT_CONFIGURED'));
    });

    it('returns null for a code this build has no sentence for', () => {
        // The property that lets the two repos deploy separately: a code added on the backend
        // before its catalog entry exists degrades to the generic sentence, and never renders the
        // raw code or an English message. `tOptional`, so it does not warn either — absence is
        // the expected answer here, not a typo.
        expect(reasonMessage(failure(403, { reason: 'SOME_FUTURE_REASON' }))).toBeNull();
        expect(describeError(failure(403, { reason: 'SOME_FUTURE_REASON' })))
            .toBe(t('errors.forbidden'));
    });

    it('ignores a body with no reason at all', () => {
        expect(reasonMessage(failure(403, { error: 'غير مصرح لك' }))).toBeNull();
        expect(reasonMessage(failure(403, {}))).toBeNull();
        expect(reasonMessage(failure(403, { reason: '' }))).toBeNull();
        expect(reasonMessage(failure(403, { reason: 42 }))).toBeNull();
    });

    it('never resolves to a catalog namespace or a stray path', () => {
        // `errors.reasons.reasons` is an object, not a string — tOptional has to reject it rather
        // than hand back "[object Object]".
        expect(reasonMessage(failure(403, { reason: 'reasons' }))).toBeNull();
    });
});

describe('serverMessage', () => {
    it('takes `error` when it is the only key, which is the ad-hoc forbidden() shape', () => {
        // The three controller forbidden() helpers write exactly this and no `message` at all.
        expect(serverMessage(failure(403, { error: 'غير مصرح لك' }))).toBe('غير مصرح لك');
    });

    it('prefers `message` over `error`, because that is where the Arabic is when both exist', () => {
        // RateLimitFilter's 429 body, verbatim.
        expect(serverMessage(failure(429, {
            error: 'Too many requests',
            message: 'يرجى المحاولة لاحقاً',
        }))).toBe('يرجى المحاولة لاحقاً');
    });

    it('refuses an English body, whichever key it arrived in', () => {
        // GlobalExceptionHandler.buildResponse — `error` is the HTTP reason phrase and `message`
        // is internal detail. Neither was written for a reader.
        expect(serverMessage(failure(403, { error: 'Forbidden', message: 'Access denied' }))).toBeNull();
        expect(serverMessage(failure(404, { error: 'Not Found', message: 'Channel not found' }))).toBeNull();
        expect(serverMessage(failure(400, { message: 'Validation failed' }))).toBeNull();
    });

    it('survives every body shape that is not an object of strings', () => {
        expect(serverMessage(failure(500, undefined))).toBeNull();
        expect(serverMessage(failure(500, 'plain text body'))).toBeNull();
        expect(serverMessage(failure(500, { message: { nested: 'x' } }))).toBeNull();
        expect(serverMessage(undefined)).toBeNull();
    });
});

describe('describeError', () => {
    it('shows the server sentence on a 403 it wrote in Arabic', () => {
        // The reported bug: pressing import on a PENDING channel.
        expect(describeError(failure(403, { error: 'غير مصرح لك' }))).toBe('غير مصرح لك');
    });

    it('beats the caller fallback, since only the server knows why', () => {
        expect(describeError(failure(403, { error: 'غير مصرح لك' }), 'فشل الاستيراد'))
            .toBe('غير مصرح لك');
    });

    it('falls back to our own copy when the body is English', () => {
        expect(describeError(failure(403, { error: 'Forbidden', message: 'Access denied' })))
            .toBe(t('errors.forbidden'));
        expect(describeError(failure(404, { error: 'Not Found', message: 'Channel not found' })))
            .toBe(t('errors.notFound'));
    });

    it('never shows a 5xx body, however it is written', () => {
        // A 500 means the server knows only that it broke. Anything it says about that is ours to
        // keep off the screen — and an Arabic 5xx body must not become an exception to that.
        expect(describeError(failure(500, { message: 'Internal server error' })))
            .toBe(t('errors.server'));
        expect(describeError(failure(503, { message: 'حدث شيء ما في الخادم' })))
            .toBe(t('errors.server'));
    });

    it('keeps the 429 behaviour it had before', () => {
        expect(describeError(failure(429, {
            error: 'Too many requests',
            message: 'يرجى المحاولة لاحقاً',
        }))).toBe('يرجى المحاولة لاحقاً');
        // No body: still the rate-limit sentence, not the caller's fallback — what to do next is
        // different, which is the whole reason 429 overrides.
        expect(describeError(failure(429, {}), 'فشل حذف التعليق')).toBe(t('errors.rateLimited'));
    });

    it('prefers a named reason over the server sentence and the caller fallback alike', () => {
        // All three present. The reason is the only one that can say *why*, so it wins — the
        // other two are progressively less specific restatements of the status.
        expect(describeError(
            failure(403, { reason: 'CHANNEL_SUSPENDED', error: 'غير مصرح لك' }),
            'فشل الاستيراد',
        )).toBe(t('errors.reasons.CHANNEL_SUSPENDED'));
    });

    it('gives the two YouTube verification states different sentences', () => {
        // Not cosmetic: one is "put the token in your description", the other is "an admin linked
        // this and only you can license hosting the file". Collapsing them tells an owner to redo
        // a step that would not help.
        const notVerified = describeError(failure(400, { reason: 'YOUTUBE_NOT_VERIFIED' }));
        const needsOwner = describeError(failure(400, { reason: 'YOUTUBE_NEEDS_OWNER_VERIFICATION' }));
        expect(notVerified).not.toBe(needsOwner);
        expect(notVerified).toBe(t('errors.reasons.YOUTUBE_NOT_VERIFIED'));
    });

    it('still reports a request that never got an answer', () => {
        expect(describeError({ code: 'ECONNABORTED' })).toBe(t('errors.timeout'));
        expect(describeError({})).toBe(t('errors.offline'));
    });
});
