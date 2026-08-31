import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api/client';
import PageShell from '../components/layout/PageShell';
import { Spinner, EmptyState, Avatar } from '../components/ui';

function Subscriptions() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/user/subscriptions');
            setSubscriptions(res.data || []);
        } catch (err) {
            console.error('Failed to fetch subscriptions:', err);
            setError('فشل في تحميل الاشتراكات');
        } finally {
            setLoading(false);
        }
    };

    const handleUnsubscribe = async (channelId) => {
        if (!window.confirm('هل تريد إلغاء الاشتراك؟')) return;

        try {
            await api.delete(`/channels/${channelId}/subscribe`);
            setSubscriptions((prev) => prev.filter((sub) => sub.channelId !== channelId));
        } catch (err) {
            console.error('Failed to unsubscribe:', err);
            alert('فشل في إلغاء الاشتراك');
        }
    };

    return (
        <PageShell contentClassName="p-4 sm:p-6">
            <h1 className="text-xl font-bold mb-6">اشتراكاتي</h1>

            {loading ? (
                <Spinner />
            ) : error ? (
                <p className="text-red-600 p-3 bg-red-100 rounded-md">{error}</p>
            ) : subscriptions.length === 0 ? (
                <EmptyState icon="🔔" title="لا توجد اشتراكات" description="اشترك في القنوات لمتابعة محتواها" />
            ) : (
                <div className="grid gap-4">
                    {subscriptions.map((sub) => (
                        <div key={sub.subscriptionId} className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border-light shadow-sm flex-wrap">
                            <Avatar name={sub.channelName || 'ق'} color={sub.channelColor} size="lg" />

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold">{sub.channelName}</h3>
                                <p className="text-sm text-text-muted">@{sub.channelSlug}</p>
                                {sub.channelDescription && (
                                    <p className="text-sm text-text-muted truncate">{sub.channelDescription}</p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    to={`/channel/${sub.channelSlug}`}
                                    className="px-4 py-2 bg-primary text-white rounded-md font-semibold text-sm whitespace-nowrap"
                                >
                                    زيارة
                                </Link>
                                <button
                                    onClick={() => handleUnsubscribe(sub.channelId)}
                                    className="px-4 py-2 bg-surface-hover text-text-secondary border border-border rounded-md font-semibold text-sm whitespace-nowrap"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageShell>
    );
}

export default Subscriptions;
