import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { verifyEmail } from '@/lib/api/auth';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { Button, Spinner } from '../components/ui';
import { usePageMeta } from '../hooks/usePageMeta';

function VerifyEmail() {
    usePageMeta({ title: 'توثيق البريد الإلكتروني' });
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
            setErrorMessage('رابط التوثيق غير صالح');
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
                setErrorMessage(err.response?.data?.message || 'انتهت صلاحية رابط التوثيق أو أنه غير صالح');
            });
    }, [token, authToken, refreshUser]);

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[400px] mx-auto my-10 sm:my-16 p-6 sm:p-8 bg-surface rounded-lg shadow-md border border-border-light text-center">
                {status === 'verifying' && (
                    <>
                        <Spinner />
                        <p className="text-text-secondary mt-4">جاري توثيق بريدك الإلكتروني...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 className="mx-auto text-primary" size={48} />
                        <h2 className="text-xl font-bold mt-4">تم توثيق بريدك الإلكتروني بنجاح</h2>
                        <p className="text-text-muted mt-2">يمكنك الآن التعليق وإنشاء قناة.</p>
                        <Link to="/" className="block mt-6">
                            <Button fullWidth>العودة للرئيسية</Button>
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="mx-auto text-red-600 dark:text-red-400" size={48} />
                        <h2 className="text-xl font-bold mt-4">تعذر التوثيق</h2>
                        <p className="text-text-muted mt-2">{errorMessage}</p>
                        <Link to="/login" className="block mt-6">
                            <Button variant="outline" fullWidth>تسجيل الدخول</Button>
                        </Link>
                    </>
                )}
            </div>
        </PageShell>
    );
}

export default VerifyEmail;
