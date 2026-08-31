import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api/client';
import Navbar from '../components/layout/Navbar';
import { Input, Button } from '../components/ui';

function CreateChannel() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', slug: '', description: '', primaryColor: '#0D6B4D' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSlugChange = (value) => {
        const slug = value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        setForm({ ...form, slug });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/channels', form);
            alert('تم إنشاء القناة! ستظهر بعد موافقة الإدارة.');
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'فشل في إنشاء القناة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div dir="rtl" className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-[500px] mx-auto my-8 sm:my-10 px-4">
                <div className="bg-surface p-6 sm:p-8 rounded-lg shadow-sm border border-border-light">
                    <h1 className="text-xl font-bold mb-2">إنشاء قناة جديدة</h1>
                    <p className="text-text-muted text-sm mb-6">سيتم مراجعة قناتك من قبل الإدارة قبل النشر</p>

                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <Input
                            label="اسم القناة *"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            onBlur={(e) => { if (!form.slug) handleSlugChange(e.target.value); }}
                            required
                            placeholder="مثال: محمد إلهامي"
                        />

                        <div>
                            <Input
                                label="المعرف (Slug) *"
                                value={form.slug}
                                onChange={(e) => handleSlugChange(e.target.value)}
                                required
                                dir="ltr"
                                placeholder="my-channel"
                            />
                            <p className="text-xs text-text-muted mt-1">أحرف صغيرة وأرقام وشرطات فقط</p>
                        </div>

                        <Input
                            label="الوصف"
                            textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="وصف القناة..."
                        />

                        <div>
                            <label className="block mb-1.5 font-semibold text-sm text-text-secondary">اللون الرئيسي</label>
                            <input
                                type="color"
                                value={form.primaryColor}
                                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                                className="w-[60px] h-10 cursor-pointer"
                            />
                        </div>

                        {error && <p className="text-red-600 text-sm bg-red-100 p-2.5 rounded-md">{error}</p>}

                        <Button type="submit" disabled={loading} fullWidth>
                            {loading ? 'جاري الإنشاء...' : 'إنشاء القناة'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateChannel;
