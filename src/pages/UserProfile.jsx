import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '@/lib/api/client';
import { changePassword } from '@/lib/api/auth';
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

function ChangePasswordCard() {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    const handleNewPasswordChange = (value) => {
        setForm({ ...form, newPassword: value });
        setPasswordStrength(calculateStrength(value));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (form.newPassword !== form.confirmPassword) {
            setMessage('error:كلمتا المرور غير متطابقتين');
            return;
        }
        if (passwordStrength < 60) {
            setMessage('error:كلمة المرور ضعيفة — استخدم 8 أحرف على الأقل مع أرقام ورموز');
            return;
        }

        setSaving(true);
        try {
            await changePassword(form.currentPassword, form.newPassword);
            setMessage('success:تم تغيير كلمة المرور بنجاح');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordStrength(0);
        } catch (err) {
            setMessage(`error:${err.response?.data?.error || 'فشل في تغيير كلمة المرور'}`);
        } finally {
            setSaving(false);
        }
    };

    const isSuccess = message.startsWith('success:');
    const strengthInfo = getStrengthLabel(passwordStrength);

    return (
        <div className="bg-surface p-6 sm:p-8 rounded-lg shadow-sm border border-border-light mt-6">
            <h2 className="text-lg font-bold mb-6">تغيير كلمة المرور</h2>

            {message && (
                <p className={`p-2.5 rounded-md mb-4 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {message.split(':').slice(1).join(':')}
                </p>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4">
                <Input
                    label="كلمة المرور الحالية"
                    type="password"
                    value={form.currentPassword}
                    onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                />

                <div>
                    <Input
                        label="كلمة المرور الجديدة"
                        type="password"
                        value={form.newPassword}
                        onChange={(e) => handleNewPasswordChange(e.target.value)}
                        required
                        placeholder="••••••••"
                        dir="ltr"
                    />

                    {form.newPassword && (
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

                <Input
                    label="تأكيد كلمة المرور الجديدة"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className={form.confirmPassword && form.confirmPassword !== form.newPassword ? '!border-red-600' : ''}
                />

                <Button type="submit" disabled={saving} fullWidth>
                    {saving ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
                </Button>
            </form>
        </div>
    );
}

function UserProfile() {
    const { user } = useAuth();
    const [form, setForm] = useState({ fullName: '', bio: '', email: '', profilePictureUrl: '' });
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setForm({
                fullName: user.fullName || '',
                bio: user.bio || '',
                email: user.email || '',
                profilePictureUrl: user.profilePictureUrl || '',
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            await api.put('/user/profile', form);
            setMessage('success:تم حفظ الملف الشخصي');
        } catch (err) {
            setMessage('error:فشل في الحفظ');
        } finally {
            setSaving(false);
        }
    };

    const isSuccess = message.startsWith('success:');

    return (
        <div dir="rtl" className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-[500px] mx-auto my-8 sm:my-10 px-4">
                <div className="bg-surface p-6 sm:p-8 rounded-lg shadow-sm border border-border-light">
                    <h1 className="text-xl font-bold mb-6">الملف الشخصي</h1>

                    {message && (
                        <p className={`p-2.5 rounded-md mb-4 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {message.split(':')[1]}
                        </p>
                    )}

                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <Input label="اسم المستخدم" value={user?.username || ''} dir="ltr" disabled />
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
                            dir="ltr"
                            placeholder="email@example.com"
                        />
                        <Input
                            label="نبذة عنك"
                            textarea
                            rows={3}
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                            placeholder="اكتب نبذة قصيرة..."
                        />

                        <Button type="submit" disabled={saving} fullWidth>
                            {saving ? 'جاري الحفظ...' : 'حفظ'}
                        </Button>
                    </form>
                </div>

                <ChangePasswordCard />
            </div>
        </div>
    );
}

export default UserProfile;
