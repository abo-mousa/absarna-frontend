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
    const serverError = { response: { data: { message: 'boom' } }, message: 'Request failed' };

    it('tells an upload-backed publish that it is still working, not that it failed', () => {
        for (const type of ['videos', 'books']) {
            expect(publishFailureMessage(timeout, type, 'نشر'))
                .toBe(t('channelManage.publishSlow', { action: 'نشر' }));
        }
    });

    it('reports a timeout on a non-upload type as an ordinary failure', () => {
        for (const type of ['articles', 'posts']) {
            expect(publishFailureMessage(timeout, type, 'نشر'))
                .toBe(t('channelManage.publishFailed', { action: 'نشر', reason: timeout.message }));
        }
    });

    it('prefers the server’s own message over axios’s', () => {
        expect(publishFailureMessage(serverError, 'videos', 'نشر'))
            .toBe(t('channelManage.publishFailed', { action: 'نشر', reason: 'boom' }));
    });

    it('falls back to the axios message when the server sent no body', () => {
        expect(publishFailureMessage({ message: 'Network Error' }, 'books', 'نشر'))
            .toContain('Network Error');
    });
});
