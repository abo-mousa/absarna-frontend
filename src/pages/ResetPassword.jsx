import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { resetPassword } from '@/lib/api/auth';
import Navbar from '../components/layout/Navbar';
import { Input, Button } from '../components/ui';

function calculateStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.match(/[A-Z]/)) strength += 15;
    if (password.match(/[a-z]/)) strength += 15;
    if (password.match(/\d/)) strength += 20;
    if (password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)) strength += 20;
    return Math.min(strength, 100);
}

function getStrengthLabel(strength) {
    if (strength >= 80) return { text: 'قوية جداً', color: '#059669' };
    if (strength >= 60) return { text: 'قوية', color: '#10B981' };
    if (strength >= 40) return { text: 'متوسطة', color: '#D4AF37' };
    return { text: 'ضعيفة', color: '#DC2626' };
}

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('form'); // form | success | error

    const handlePasswordChange = (value) => {
        setPassword(value);
        setPasswordStrength(calculateStrength(value));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('رابط إعادة التعيين غير صالح');
            return;
        }
        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين');
            return;
        }
        if (passwordStrength < 60) {
            setError('كلمة المرور ضعيفة — استخدم 8 أحرف على الأقل مع أرقام ورموز');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setError(err.response?.data?.message || 'انتهت صلاحية الرابط أو أنه غير صالح');
        } finally {
            setLoading(false);
        }
    };

    const strengthInfo = getStrengthLabel(passwordStrength);

    return (
        <div dir="rtl" className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-[400px] mx-auto my-10 sm:my-16 p-6 sm:p-8 bg-surface rounded-lg shadow-md border border-border-light">
                {status === 'success' && (
                    <div className="text-center">
                        <CheckCircle2 className="mx-auto text-primary" size={48} />
                        <h2 className="text-xl font-bold mt-4">تم إعادة تعيين كلمة المرور</h2>
                        <p className="text-text-muted mt-2">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
                        <Link to="/login" className="block mt-6">
                            <Button fullWidth>تسجيل الدخول</Button>
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <XCircle className="mx-auto text-red-600" size={48} />
                        <h2 className="text-xl font-bold mt-4">تعذرت إعادة التعيين</h2>
                        <p className="text-text-muted mt-2">{error}</p>
                        <Link to="/forgot-password" className="block mt-6">
                            <Button variant="outline" fullWidth>طلب رابط جديد</Button>
                        </Link>
                    </div>
                )}

                {status === 'form' && (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold">إعادة تعيين كلمة المرور</h2>
                            <p className="text-text-muted mt-2">أدخل كلمة المرور الجديدة</p>
                        </div>

                        {!token ? (
                            <p className="text-red-600 text-sm bg-red-100 p-2.5 rounded-md text-center">
                                رابط إعادة التعيين غير صالح
                            </p>
                        ) : (
                            <form onSubmit={handleSubmit} className="grid gap-4">
                                <div>
                                    <Input
                                        label="كلمة المرور الجديدة *"
                                        type="password"
                                        value={password}
                                        onChange={(e) => handlePasswordChange(e.target.value)}
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
                                                            background: passwordStrength >= level * 20 ? strengthInfo.color : '#E5E7EB',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs" style={{ color: strengthInfo.color }}>
                                                {strengthInfo.text}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Input
                                        label="تأكيد كلمة المرور *"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        dir="ltr"
                                        className={confirmPassword && confirmPassword !== password ? '!border-red-600' : ''}
                                    />
                                    {confirmPassword && confirmPassword !== password && (
                                        <p className="text-red-600 text-xs mt-1">كلمتا المرور غير متطابقتين</p>
                                    )}
                                </div>

                                {error && (
                                    <p className="text-red-600 text-sm bg-red-100 p-2.5 rounded-md">{error}</p>
                                )}

                                <Button type="submit" disabled={loading} fullWidth>
                                    {loading ? 'جاري الحفظ...' : 'إعادة تعيين كلمة المرور'}
                                </Button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;
