import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/layout/Navbar';
import { Input, Button } from '../components/ui';

function Login() {
    const navigate = useNavigate();
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
        if (result.success) navigate('/');
        else setError(result.message);
        setLoading(false);
    };

    return (
        <div dir="rtl" className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-[400px] mx-auto my-10 sm:my-16 p-6 sm:p-8 bg-surface rounded-lg shadow-md border border-border-light">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold">تسجيل الدخول</h2>
                    <p className="text-text-muted mt-2">مرحباً بعودتك!</p>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <Input
                        label="اسم المستخدم"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="username"
                        dir="ltr"
                    />

                    <Input
                        label="كلمة المرور"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        dir="ltr"
                    />

                    {error && (
                        <p className="text-red-600 text-sm bg-red-100 p-2.5 rounded-md">{error}</p>
                    )}

                    <Button type="submit" disabled={loading} fullWidth>
                        {loading ? 'جاري الدخول...' : 'دخول'}
                    </Button>
                </form>

                <div className="text-center mt-5">
                    <p className="text-sm text-text-secondary">
                        ليس لديك حساب؟{' '}
                        <Link to="/register" className="text-primary font-semibold">إنشاء حساب</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
