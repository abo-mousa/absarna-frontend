import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { resendVerification } from '@/lib/api/auth';
import { describeError } from '@/lib/describeError';
import { t } from '@/i18n';

/** The address, kept left-to-right inside an Arabic sentence so its dots and @ stay put. */
const Address = ({ email }) => <bdi dir="ltr" className="font-semibold">{email}</bdi>;

/**
 * Shown wherever the backend rejects an action with 403 + emailVerificationRequired:true (posting
 * a comment, creating a channel…), as the banner over every page, and on the profile.
 *
 * <p><b>It names the address.</b> A reader who mistyped it at sign-up saw "open the link we
 * emailed you" and nothing to tell them where it went, so a typo looked exactly like slow mail.
 * With `showAddress`, the address is on the notice, with the way to change it beside it.
 *
 * <p><b>And it says when the address does not work.</b> When the provider reports that mail to
 * it bounced for good (`emailUndeliverable`, from the backend's Resend webhook), the notice turns
 * into that sentence, in red, and offers the change instead of a resend that would bounce again —
 * whatever the caller asked it to say, since nothing else is true until the address is fixed.
 */
function EmailVerificationNotice({ message, showAddress = false }) {
    const { user, refreshUser } = useAuth();
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error
    const [errorMessage, setErrorMessage] = useState('');
    const email = user?.email || '';

    if (user?.emailUndeliverable) {
        return (
            <div role="alert" className="bg-red-50 border border-red-300 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200 text-sm p-3 rounded-md flex flex-wrap items-center justify-between gap-2">
                <span>
                    {t('auth.verificationNotice.undeliverableBefore')}
                    {email && <Address email={email} />}
                    {t('auth.verificationNotice.undeliverableAfter')}
                </span>
                <Link to="/profile#email" className="font-semibold underline">{t('auth.verificationNotice.changeAddress')}</Link>
            </div>
        );
    }

    const handleResend = async () => {
        setStatus('sending');
        try {
            await resendVerification();
            setStatus('sent');
        } catch (err) {
            // describeError, so a named refusal (EMAIL_ADDRESS_MISSING: the account has no address
            // to send to) says what to do rather than "try again later", which would never work.
            setErrorMessage(describeError(err, t('auth.verificationNotice.failed')));
            setStatus('error');
            // The bounce arrived after this page loaded: read the account again, and the notice
            // becomes the sentence that says so.
            if (err?.response?.data?.reason === 'EMAIL_UNDELIVERABLE') refreshUser?.();
        }
    };

    return (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200 text-sm p-3 rounded-md flex flex-wrap items-center justify-between gap-2">
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

            {showAddress && email && (
                <span className="w-full text-xs">
                    {t('auth.verificationNotice.sentTo')}<Address email={email} />
                    {' · '}
                    <Link to="/profile#email" className="underline">{t('auth.verificationNotice.notYours')}</Link>
                </span>
            )}

            {status === 'error' && (
                <span className="text-red-600 dark:text-red-400 text-xs w-full">{errorMessage}</span>
            )}
        </div>
    );
}

export default EmailVerificationNotice;
