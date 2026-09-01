import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/layout/Navbar';
import { Input, Button } from '../components/ui';
import { getPasswordRules, getPasswordStrengthLabel, isPasswordValid, validateUsername } from '@/lib/validation';

function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [form, setForm] = useState({
        username: '', email: '', password: '', confirmPassword: '', fullName: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const passwordRules = getPasswordRules(form.password);
    const passedCount = passwordRules.filter((rule) => rule.valid).length;
    const strengthInfo = getPasswordStrengthLabel(passwordRules);
    const usernameError = form.username ? validateUsername(form.username) : '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const usernameValidationError = validateUsername(form.username);
        if (usernameValidationError) {
            setError(usernameValidationError);
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError('كلمتا المرور غير متطابقتين');
            return;
        }
        if (!isPasswordValid(form.password)) {
            setError('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل مع حرف كبير وحرف صغير ورقم ورمز خاص');
            return;
        }

        setLoading(true);
        const result = await register(form.username, form.email, form.password, form.fullName);
        if (result.success) {
            alert('تم إنشاء الحساب! أرسلنا رابط توثيق إلى بريدك الإلكتروني.');
            navigate('/');
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div dir="rtl" className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-[400px] mx-auto my-10 sm:my-16 p-6 sm:p-8 bg-surface rounded-lg shadow-md border border-border-light">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold">إنشاء حساب</h2>
                    <p className="text-text-muted mt-2">انضم إلى منارة</p>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div>
                        <Input
                            label="اسم المستخدم *"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                            placeholder="username"
                            dir="ltr"
                            className={usernameError ? '!border-red-600' : ''}
                        />
                        {usernameError && (
                            <p className="text-red-600 text-xs mt-1">{usernameError}</p>
                        )}
                    </div>

                    <Input
                        label="الاسم الكامل"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="محمد أحمد"
                    />

                    <Input
                        label="البريد الإلكتروني"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="email@example.com"
                        dir="ltr"
                    />

                    <div>
                        <Input
                            label="كلمة المرور *"
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            placeholder="••••••••"
                            dir="ltr"
                        />

                        {form.password && (
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
                            label="تأكيد كلمة المرور *"
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            required
                            placeholder="••••••••"
                            dir="ltr"
                            className={form.confirmPassword && form.confirmPassword !== form.password ? '!border-red-600' : ''}
                        />
                        {form.confirmPassword && form.confirmPassword !== form.password && (
                            <p className="text-red-600 text-xs mt-1">كلمتا المرور غير متطابقتين</p>
                        )}
                    </div>

                    {error && (
                        <p className="text-red-600 text-sm bg-red-100 p-2.5 rounded-md">{error}</p>
                    )}

                    <Button type="submit" disabled={loading} fullWidth>
                        {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
                    </Button>
                </form>

                <div className="text-center mt-5">
                    <p className="text-sm text-text-secondary">
                        لديك حساب بالفعل؟{' '}
                        <Link to="/login" className="text-primary font-semibold">تسجيل الدخول</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
