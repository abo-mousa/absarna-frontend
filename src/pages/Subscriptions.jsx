import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { QueryState, Avatar } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { useSubscriptions, useUnsubscribe } from '../hooks/useChannels';

function Subscriptions() {
    usePageMeta({ title: 'اشتراكاتي' });
    const { showToast } = useToast();
    const { data: subscriptions = [], isLoading, isError } = useSubscriptions();
    const unsubscribe = useUnsubscribe();

    const handleUnsubscribe = (channelId) => {
        if (!window.confirm('هل تريد إلغاء الاشتراك؟')) return;
        unsubscribe.mutate(channelId, { onError: () => showToast('فشل في إلغاء الاشتراك', 'error') });
    };

    return (
        <PageShell contentClassName="p-4 sm:p-6">
            <h1 className="text-xl font-bold mb-6">اشتراكاتي</h1>

            <QueryState
                isLoading={isLoading}
                isError={isError}
                isEmpty={subscriptions.length === 0}
                errorTitle="فشل في تحميل الاشتراكات"
                emptyIcon="🔔"
                emptyTitle="لا توجد اشتراكات"
                emptyDescription="اشترك في القنوات لمتابعة محتواها"
            >
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
            </QueryState>
        </PageShell>
    );
}

export default Subscriptions;
