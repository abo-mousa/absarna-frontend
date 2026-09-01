import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { forgotPassword } from '@/lib/api/auth';
import Navbar from '../components/layout/Navbar';
import { Input, Button } from '../components/ui';

function ForgotPassword() {
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
            setError(err.response?.data?.message || 'حدث خطأ ما، يرجى المحاولة لاحقاً');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div dir="rtl" className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-[400px] mx-auto my-10 sm:my-16 p-6 sm:p-8 bg-surface rounded-lg shadow-md border border-border-light">
                {sent ? (
                    <div className="text-center">
                        <MailCheck className="mx-auto text-primary" size={48} />
                        <h2 className="text-xl font-bold mt-4">تحقق من بريدك الإلكتروني</h2>
                        <p className="text-text-muted mt-2">
                            إذا كان البريد الإلكتروني مسجلاً لدينا، فسيتم إرسال رابط إعادة تعيين كلمة المرور إليه.
                        </p>
                        <Link to="/login" className="block mt-6">
                            <Button variant="outline" fullWidth>العودة لتسجيل الدخول</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold">نسيت كلمة المرور؟</h2>
                            <p className="text-text-muted mt-2">
                                أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="grid gap-4">
                            <Input
                                label="البريد الإلكتروني"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="email@example.com"
                                dir="ltr"
                            />

                            {error && (
                                <p className="text-red-600 text-sm bg-red-100 p-2.5 rounded-md">{error}</p>
                            )}

                            <Button type="submit" disabled={loading} fullWidth>
                                {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
                            </Button>
                        </form>

                        <div className="text-center mt-5">
                            <p className="text-sm text-text-secondary">
                                تذكرت كلمة المرور؟{' '}
                                <Link to="/login" className="text-primary font-semibold">تسجيل الدخول</Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
