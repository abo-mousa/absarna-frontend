import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '@/lib/api/client';
import Navbar from '../components/layout/Navbar';
import { Input, Button } from '../components/ui';

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
            </div>
        </div>
    );
}

export default UserProfile;
