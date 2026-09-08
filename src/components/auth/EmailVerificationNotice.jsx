import { useState } from 'react';
import { resendVerification } from '@/lib/api/auth';
import { t } from '@/i18n';

// Shown wherever the backend rejects an action with 403 + emailVerificationRequired:true
// (currently: posting a comment, creating a channel) — see backend CLAUDE.md's
// "Content visibility"/security notes and content/comment + content/channel controllers.
function EmailVerificationNotice({ message }) {
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error

    const handleResend = async () => {
        setStatus('sending');
        try {
            await resendVerification();
            setStatus('sent');
        } catch {
            setStatus('error');
        }
    };

    return (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 text-sm p-3 rounded-md flex flex-wrap items-center justify-between gap-2">
            <span>{message || t('auth.verificationNotice.defaultMessage')}</span>

            {status === 'sent' ? (
                <span className="text-primary font-semibold">{t('auth.verificationNotice.sent')}</span>
            ) : (
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={status === 'sending'}
                    className="text-primary font-semibold underline disabled:opacity-60"
                >
                    {status === 'sending' ? t('common.sending') : t('auth.verificationNotice.resend')}
                </button>
            )}

            {status === 'error' && (
                <span className="text-red-600 dark:text-red-400 text-xs w-full">{t('auth.verificationNotice.failed')}</span>
            )}
        </div>
    );
}

export default EmailVerificationNotice;
