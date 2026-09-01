import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '@/lib/api/client';
import { changePassword } from '@/lib/api/auth';
import Navbar from '../components/layout/Navbar';
import { Input, Button } from '../components/ui';
import { getPasswordRules, getPasswordStrengthLabel, isPasswordValid } from '@/lib/validation';
import { usePageMeta } from '../hooks/usePageMeta';

function ChangePasswordCard() {
    const { showToast } = useToast();
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [saving, setSaving] = useState(false);

    const passwordRules = getPasswordRules(form.newPassword);
    const passedCount = passwordRules.filter((rule) => rule.valid).length;
    const strengthInfo = getPasswordStrengthLabel(passwordRules);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.newPassword !== form.confirmPassword) {
            showToast('كلمتا المرور غير متطابقتين', 'error');
            return;
        }
        if (!isPasswordValid(form.newPassword)) {
            showToast('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل مع حرف كبير وحرف صغير ورقم ورمز خاص', 'error');
            return;
        }

        setSaving(true);
        try {
            await changePassword(form.currentPassword, form.newPassword);
            showToast('تم تغيير كلمة المرور بنجاح', 'success');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            showToast(err.response?.data?.error || 'فشل في تغيير كلمة المرور', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-surface p-6 sm:p-8 rounded-lg shadow-sm border border-border-light mt-6">
            <h2 className="text-lg font-bold mb-6">تغيير كلمة المرور</h2>

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
                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
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
    usePageMeta({ title: 'الملف الشخصي' });
    const { user } = useAuth();
    const { showToast } = useToast();
    const [form, setForm] = useState({ fullName: '', bio: '', email: '', profilePictureUrl: '' });
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

        try {
            await api.put('/user/profile', form);
            showToast('تم حفظ الملف الشخصي', 'success');
        } catch (err) {
            showToast('فشل في الحفظ', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-[500px] mx-auto my-8 sm:my-10 px-4">
                <div className="bg-surface p-6 sm:p-8 rounded-lg shadow-sm border border-border-light">
                    <h1 className="text-xl font-bold mb-6">الملف الشخصي</h1>

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
