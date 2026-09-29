import { useState } from 'react';
import { Bell } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';
import { Link } from 'react-router-dom';
import PageShell, { LIST_COLUMN } from '../components/layout/PageShell';
import { QueryState, Avatar, ConfirmDialog } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { useSubscriptions, useUnsubscribe } from '../hooks/useChannels';
import { t } from '@/i18n';

function Subscriptions() {
    usePageMeta({ title: t('subscriptions.title') });
    const { showToast } = useToast();
    const { data: subscriptions = [], isLoading, isError, error, refetch } = useSubscriptions();
    const unsubscribe = useUnsubscribe();

    // The platform's own dialog, not window.confirm: the browser's ignores the page's direction
    // and answers «OK / Cancel» in the phone's language under an Arabic question.
    const [confirming, setConfirming] = useState(null);
    const handleUnsubscribe = (channelId) => setConfirming(channelId);
    const confirmUnsubscribe = () => {
        const channelId = confirming;
        setConfirming(null);
        unsubscribe.mutate(channelId, { onError: () => showToast(t('subscriptions.unsubscribeFailed'), 'error') });
    };

    return (
        <PageShell contentClassName={LIST_COLUMN}>
            <h1 className="text-xl font-bold mb-6">{t('subscriptions.title')}</h1>
            <ConfirmDialog
                open={confirming !== null}
                title={t('subscriptions.unsubscribeConfirm')}
                danger
                onConfirm={confirmUnsubscribe}
                onClose={() => setConfirming(null)}
            />

            <QueryState
                isLoading={isLoading}
                isError={isError}
                error={error}
                onRetry={refetch}
                isEmpty={subscriptions.length === 0}
                errorTitle={t('subscriptions.loadFailed')}
                emptyIcon={Bell}
                emptyTitle={t('subscriptions.empty')}
                emptyDescription={t('subscriptions.emptyDescription')}
            >
                <div className="grid gap-4">
                    {subscriptions.map((sub) => (
                        <div key={sub.subscriptionId} className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border-light shadow-sm flex-wrap">
                            <Avatar src={resolveMediaUrl(sub.channelLogoUrl)} name={sub.channelName || t('subscriptions.avatarFallback')} size="lg" />

                            <div className="flex-1 min-w-0">
                                <h3 dir="auto" className="font-semibold">{sub.channelName}</h3>
                                <p className="text-sm text-text-muted">@{sub.channelSlug}</p>
                                {sub.channelDescription && (
                                    <p dir="auto" className="text-sm text-text-muted truncate">{sub.channelDescription}</p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    to={`/channel/${sub.channelSlug}`}
                                    className="px-4 py-2 bg-primary text-white rounded-md font-semibold text-sm whitespace-nowrap"
                                >
                                    {t('subscriptions.visit')}
                                </Link>
                                <button
                                    onClick={() => handleUnsubscribe(sub.channelId)}
                                    className="px-4 py-2 bg-surface-hover text-text-secondary border border-border rounded-md font-semibold text-sm whitespace-nowrap"
                                >
                                    {t('subscriptions.unsubscribe')}
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
