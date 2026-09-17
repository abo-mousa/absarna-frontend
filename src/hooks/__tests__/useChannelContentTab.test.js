import { describe, expect, it } from 'vitest';
import { publishFailureMessage } from '../useChannelContentTab';
import { t } from '@/i18n';

/**
 * The rule pinned here is the one with a real cost when it is wrong in either direction.
 *
 * <p>Saying "failed" after a timed-out video publish tells the user to re-upload several
 * gigabytes they do not need to re-upload — the create call is idempotent on the upload session,
 * so one more click finishes it. Saying "try again shortly" after a timed-out *article* publish
 * invites a duplicate, because there is no session for the server to recognise the retry by.
 */
describe('publishFailureMessage', () => {
    const timeout = Object.assign(new Error('timeout of 300000ms exceeded'), { code: 'ECONNABORTED' });
    const failed = (action, reason) => t('channelManage.publishFailed', { action, reason });

    it('tells an upload-backed publish that it is still working, not that it failed', () => {
        for (const type of ['videos', 'books']) {
            expect(publishFailureMessage(timeout, type, 'نشر'))
                .toBe(t('channelManage.publishSlow', { action: 'نشر' }));
        }
    });

    it('reports a timeout on a non-upload type as an ordinary failure', () => {
        for (const type of ['articles', 'posts']) {
            expect(publishFailureMessage(timeout, type, 'نشر'))
                .toBe(failed('نشر', t('errors.timeout')));
        }
    });

    it('words the refusal from its reason code, not from the English body beside it', () => {
        // What the server sends for a rejected channel: the code is the only part written to be
        // read, and `message` is for a log. The whole sentence has to reach the owner in Arabic —
        // «فشل في نشر: Channel is not approved» is half a sentence.
        const refused = {
            response: { status: 403, data: { reason: 'CHANNEL_REJECTED', message: 'Channel is not approved' } },
            message: 'Request failed with status code 403',
        };
        expect(publishFailureMessage(refused, 'videos', 'نشر'))
            .toBe(failed('نشر', t('errors.reasons.CHANNEL_REJECTED')));
    });

    it('never puts the backend\u2019s English on the screen', () => {
        // The reported case: «File exceeds the maximum size of 500 MB» and «Channel slug already
        // exists: foo» were interpolated verbatim into an Arabic sentence.
        const english = {
            response: { status: 400, data: { message: 'File exceeds the maximum size of 500 MB' } },
            message: 'Request failed with status code 400',
        };
        const shown = publishFailureMessage(english, 'videos', 'نشر');
        expect(shown).not.toContain('File exceeds');
        expect(shown).toBe(failed('نشر', t('errors.generic')));
    });

    it('keeps the server\u2019s own sentence when it wrote one for the reader', () => {
        const arabic = { response: { status: 429, data: { error: 'Too many requests', message: 'يرجى المحاولة لاحقاً' } } };
        expect(publishFailureMessage(arabic, 'articles', 'نشر'))
            .toBe(failed('نشر', 'يرجى المحاولة لاحقاً'));
    });

    it('says the network is down only when it is', () => {
        expect(publishFailureMessage({ message: 'Network Error', request: {} }, 'books', 'نشر'))
            .toBe(failed('نشر', t('errors.offline')));
    });
});
