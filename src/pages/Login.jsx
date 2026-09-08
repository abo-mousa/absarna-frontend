import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { Input, Button } from '../components/ui';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';
import { safeInternalPath } from '@/lib/navigation';

function Login() {
    usePageMeta({ title: t('auth.login.heading') });
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);
        if (result.success) {
            // Back to whatever bounced them here. ProtectedRoute and the session-expiry handler
            // both put it in router state; without this the visitor lands on the home page and
            // has to find their way back to the page they had already asked for. Validated
            // rather than trusted: safeInternalPath accepts only a same-origin root-relative
            // path, so this stays safe if the value ever comes from a query string instead.
            navigate(safeInternalPath(location.state?.from) || '/', { replace: true });
        } else setError(result.message);
        setLoading(false);
    };

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[400px] mx-auto my-10 sm:my-16 p-6 sm:p-8 bg-surface rounded-lg shadow-md border border-border-light">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold">{t('auth.login.heading')}</h2>
                    <p className="text-text-muted mt-2">{t('auth.login.welcomeBack')}</p>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <Input
                        label={t('fields.username')}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="username"
                        dir="ltr"
                    />

                    <div>
                        <Input
                            label={t('fields.password')}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            dir="ltr"
                        />
                        <div className="text-left mt-1.5">
                            <Link to="/forgot-password" className="text-sm text-primary font-semibold">
                                {t('auth.login.forgotPassword')}
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-950/40 p-2.5 rounded-md">{error}</p>
                    )}

                    <Button type="submit" disabled={loading} fullWidth>
                        {loading ? t('auth.login.submitting') : t('auth.login.submit')}
                    </Button>
                </form>

                <div className="text-center mt-5">
                    <p className="text-sm text-text-secondary">
                        {t('auth.login.noAccount')}{' '}
                        <Link to="/register" className="text-primary font-semibold">{t('auth.login.registerLink')}</Link>
                    </p>
                </div>
            </div>
        </PageShell>
    );
}

export default Login;
