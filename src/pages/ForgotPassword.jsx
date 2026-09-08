import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { forgotPassword } from '@/lib/api/auth';
import PageShell from '../components/layout/PageShell';
import { Input, Button } from '../components/ui';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';

function ForgotPassword() {
    usePageMeta({ title: t('auth.forgotPassword.title') });
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await forgotPassword(email);
            // The backend always returns success here regardless of whether the email is
            // registered, so this branch is the only outcome on a network success.
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.message || t('auth.forgotPassword.genericError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[400px] mx-auto my-10 sm:my-16 p-6 sm:p-8 bg-surface rounded-lg shadow-md border border-border-light">
                {sent ? (
                    <div className="text-center">
                        <MailCheck className="mx-auto text-primary" size={48} />
                        <h2 className="text-xl font-bold mt-4">{t('auth.forgotPassword.sentHeading')}</h2>
                        <p className="text-text-muted mt-2">
                            {t('auth.forgotPassword.sentBody')}
                        </p>
                        <Link to="/login" className="block mt-6">
                            <Button variant="outline" fullWidth>{t('auth.forgotPassword.backToLogin')}</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold">{t('auth.forgotPassword.heading')}</h2>
                            <p className="text-text-muted mt-2">
                                {t('auth.forgotPassword.instructions')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="grid gap-4">
                            <Input
                                label={t('fields.email')}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="email@example.com"
                                dir="ltr"
                            />

                            {error && (
                                <p className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-950/40 p-2.5 rounded-md">{error}</p>
                            )}

                            <Button type="submit" disabled={loading} fullWidth>
                                {loading ? t('common.sending') : t('auth.forgotPassword.submit')}
                            </Button>
                        </form>

                        <div className="text-center mt-5">
                            <p className="text-sm text-text-secondary">
                                {t('auth.forgotPassword.rememberedIt')}{' '}
                                <Link to="/login" className="text-primary font-semibold">{t('auth.forgotPassword.loginLink')}</Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </PageShell>
    );
}

export default ForgotPassword;
