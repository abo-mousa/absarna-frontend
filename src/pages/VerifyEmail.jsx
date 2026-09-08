import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { verifyEmail } from '@/lib/api/auth';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { Button, Spinner } from '../components/ui';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';

function VerifyEmail() {
    usePageMeta({ title: t('auth.verifyEmail.title') });
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { token: authToken, refreshUser } = useAuth();
    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [errorMessage, setErrorMessage] = useState('');
    const ranOnce = useRef(false);

    useEffect(() => {
        if (ranOnce.current) return;
        ranOnce.current = true;

        if (!token) {
            setStatus('error');
            setErrorMessage(t('auth.verifyEmail.invalidLink'));
            return;
        }

        verifyEmail(token)
            .then(async () => {
                setStatus('success');
                // If the browser also happens to be logged in as this user, refresh the
                // cached profile so emailVerified flips without needing to log out/in.
                if (authToken) await refreshUser();
            })
            .catch((err) => {
                setStatus('error');
                setErrorMessage(err.response?.data?.message || t('auth.verifyEmail.expiredLink'));
            });
    }, [token, authToken, refreshUser]);

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[400px] mx-auto my-10 sm:my-16 p-6 sm:p-8 bg-surface rounded-lg shadow-md border border-border-light text-center">
                {status === 'verifying' && (
                    <>
                        <Spinner />
                        <p className="text-text-secondary mt-4">{t('auth.verifyEmail.verifying')}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 className="mx-auto text-primary" size={48} />
                        <h2 className="text-xl font-bold mt-4">{t('auth.verifyEmail.successHeading')}</h2>
                        <p className="text-text-muted mt-2">{t('auth.verifyEmail.successBody')}</p>
                        <Link to="/" className="block mt-6">
                            <Button fullWidth>{t('common.backHome')}</Button>
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="mx-auto text-red-600 dark:text-red-400" size={48} />
                        <h2 className="text-xl font-bold mt-4">{t('auth.verifyEmail.failedHeading')}</h2>
                        <p className="text-text-muted mt-2">{errorMessage}</p>
                        <Link to="/login" className="block mt-6">
                            <Button variant="outline" fullWidth>{t('auth.verifyEmail.loginLink')}</Button>
                        </Link>
                    </>
                )}
            </div>
        </PageShell>
    );
}

export default VerifyEmail;
