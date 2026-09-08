import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { resetPassword } from '@/lib/api/auth';
import PageShell from '../components/layout/PageShell';
import { Input, Button } from '../components/ui';
import { getPasswordRules, getPasswordStrengthLabel, isPasswordValid } from '@/lib/validation';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';

function ResetPassword() {
    usePageMeta({ title: t('auth.resetPassword.title') });
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('form'); // form | success | error

    const passwordRules = getPasswordRules(password);
    const passedCount = passwordRules.filter((rule) => rule.valid).length;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError(t('auth.resetPassword.invalidLink'));
            return;
        }
        if (password !== confirmPassword) {
            setError(t('auth.passwordMismatch'));
            return;
        }
        if (!isPasswordValid(password)) {
            setError(t('auth.passwordTooWeak'));
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setError(err.response?.data?.message || t('auth.resetPassword.expiredLink'));
        } finally {
            setLoading(false);
        }
    };

    const strengthInfo = getPasswordStrengthLabel(passwordRules);

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[400px] mx-auto my-10 sm:my-16 p-6 sm:p-8 bg-surface rounded-lg shadow-md border border-border-light">
                {status === 'success' && (
                    <div className="text-center">
                        <CheckCircle2 className="mx-auto text-primary" size={48} />
                        <h2 className="text-xl font-bold mt-4">{t('auth.resetPassword.doneHeading')}</h2>
                        <p className="text-text-muted mt-2">{t('auth.resetPassword.doneBody')}</p>
                        <Link to="/login" className="block mt-6">
                            <Button fullWidth>{t('auth.resetPassword.loginLink')}</Button>
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <XCircle className="mx-auto text-red-600 dark:text-red-400" size={48} />
                        <h2 className="text-xl font-bold mt-4">{t('auth.resetPassword.failedHeading')}</h2>
                        <p className="text-text-muted mt-2">{error}</p>
                        <Link to="/forgot-password" className="block mt-6">
                            <Button variant="outline" fullWidth>{t('auth.resetPassword.requestNewLink')}</Button>
                        </Link>
                    </div>
                )}

                {status === 'form' && (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold">{t('auth.resetPassword.heading')}</h2>
                            <p className="text-text-muted mt-2">{t('auth.resetPassword.instructions')}</p>
                        </div>

                        {!token ? (
                            <p className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-950/40 p-2.5 rounded-md text-center">
                                {t('auth.resetPassword.invalidLink')}
                            </p>
                        ) : (
                            <form onSubmit={handleSubmit} className="grid gap-4">
                                <div>
                                    <Input
                                        label={t('auth.resetPassword.newPassword')}
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        dir="ltr"
                                    />

                                    {password && (
                                        <div className="mt-2">
                                            <div className="flex gap-1 mb-1">
                                                {[1, 2, 3, 4, 5].map((level) => (
                                                    <div
                                                        key={level}
                                                        className="flex-1 h-1.5 rounded-full"
                                                        style={{
                                                            background: passedCount >= level ? strengthInfo.color : '#E5E7EB',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs" style={{ color: strengthInfo.color }}>
                                                {strengthInfo.text}
                                            </span>
                                            <ul className="mt-1.5 grid grid-cols-1 xs:grid-cols-2 gap-x-3 gap-y-0.5">
                                                {passwordRules.map((rule) => (
                                                    <li
                                                        key={rule.key}
                                                        className={`text-xs ${rule.valid ? 'text-primary' : 'text-text-muted'}`}
                                                    >
                                                        {rule.valid ? '✓' : '○'} {rule.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Input
                                        label={t('fields.confirmPassword')}
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        dir="ltr"
                                        className={confirmPassword && confirmPassword !== password ? '!border-red-600 dark:!border-red-500' : ''}
                                    />
                                    {confirmPassword && confirmPassword !== password && (
                                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">{t('auth.passwordMismatch')}</p>
                                    )}
                                </div>

                                {error && (
                                    <p className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-950/40 p-2.5 rounded-md">{error}</p>
                                )}

                                <Button type="submit" disabled={loading} fullWidth>
                                    {loading ? t('common.saving') : t('auth.resetPassword.submit')}
                                </Button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </PageShell>
    );
}

export default ResetPassword;
