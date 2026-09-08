import { useState } from 'react';
import { Check, X, Pause, Trash2 } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { QueryState, Avatar, Badge, Button, Modal, Input } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import {
    usePendingChannels,
    useAllAdminChannels,
    useApproveChannel,
    useRejectChannel,
    useSuspendChannel,
    useDeleteChannel,
} from '../hooks/useChannels';
import { t } from '@/i18n';

const STATUS_VARIANT = {
    PENDING: 'featured',
    ACTIVE: 'success',
    REJECTED: 'danger',
    SUSPENDED: 'muted',
};

const STATUS_LABEL = {
    PENDING: t('admin.channelStatus.PENDING'),
    ACTIVE: t('admin.channelStatus.ACTIVE'),
    REJECTED: t('admin.channelStatus.REJECTED'),
    SUSPENDED: t('admin.channelStatus.SUSPENDED'),
};

function AdminChannels() {
    usePageMeta({ title: t('admin.manageChannels') });
    const { showToast } = useToast();
    const { data: pendingChannels = [], isLoading: pendingLoading } = usePendingChannels();
    const { data: allChannels = [], isLoading: allLoading } = useAllAdminChannels();
    const approveChannel = useApproveChannel();
    const rejectChannel = useRejectChannel();
    const suspendChannel = useSuspendChannel();
    const deleteChannel = useDeleteChannel();

    // The channel awaiting a typed confirmation, and what has been typed so far.
    const [deleting, setDeleting] = useState(null);
    const [typedSlug, setTypedSlug] = useState('');

    const loading = pendingLoading || allLoading;

    const handleApprove = (id) => {
        approveChannel.mutate(id, { onError: () => showToast(t('admin.approveFailed'), 'error') });
    };

    const handleReject = (id) => {
        rejectChannel.mutate(id, { onError: () => showToast(t('admin.rejectFailed'), 'error') });
    };

    /**
     * Deletion is guarded by typing the slug, not by a confirm dialog.
     *
     * <p>The delete cascades in SQL through every video, book, article and post, and through the
     * comments, bookmarks and watch history hanging off them — thousands of rows for a channel
     * that has imported a back catalogue, none of it recoverable. A click-through confirm is the
     * wrong weight for that; suspending is the reversible option and the dialog says so.
     */
    const confirmDelete = () => {
        if (typedSlug.trim() !== deleting.slug) return;
        deleteChannel.mutate(deleting.id, {
            onSuccess: () => {
                showToast(t('admin.deleted'), 'success');
                setDeleting(null);
                setTypedSlug('');
            },
            onError: () => showToast(t('admin.deleteFailed'), 'error'),
        });
    };

    const handleSuspend = (id) => {
        suspendChannel.mutate(id, { onError: () => showToast(t('admin.suspendFailed'), 'error') });
    };

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">
                <h1 className="text-xl font-bold mb-6">{t('admin.manageChannels')}</h1>

                <QueryState isLoading={loading}>
                    <h2 className="text-base font-bold mb-3">{t('admin.pendingCount', { count: pendingChannels.length })}</h2>

                    {pendingChannels.length === 0 ? (
                        <p className="text-text-muted mb-8">{t('admin.pendingEmpty')}</p>
                    ) : (
                        <div className="grid gap-3 mb-8">
                            {pendingChannels.map((channel) => (
                                <div key={channel.id} className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border-light flex-wrap">
                                    <Avatar name={channel.name} color={channel.primaryColor} />
                                    <div className="flex-1 min-w-[150px]">
                                        <strong>{channel.name}</strong>
                                        <p className="text-sm text-text-muted">@{channel.slug}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleApprove(channel.id)} icon={<Check size={14} />}>{t('admin.approve')}</Button>
                                        <Button variant="danger" size="sm" onClick={() => handleReject(channel.id)} icon={<X size={14} />}>{t('admin.reject')}</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <h2 className="text-base font-bold mb-3">{t('admin.allChannelsCount', { count: allChannels.length })}</h2>

                    <div className="grid gap-3">
                        {allChannels.map((channel) => (
                            <div key={channel.id} className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border-light flex-wrap">
                                <Avatar name={channel.name} color={channel.primaryColor} />
                                <div className="flex-1 min-w-[150px]">
                                    <strong>{channel.name}</strong>
                                    <p className="text-sm text-text-muted">@{channel.slug}</p>
                                </div>
                                <Badge variant={STATUS_VARIANT[channel.status]}>{STATUS_LABEL[channel.status]}</Badge>
                                {channel.status === 'ACTIVE' && (
                                    <Button size="sm" onClick={() => handleSuspend(channel.id)} icon={<Pause size={14} />} className="!bg-gold hover:!bg-gold">
                                        {t('admin.suspend')}
                                    </Button>
                                )}
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => { setDeleting(channel); setTypedSlug(''); }}
                                    icon={<Trash2 size={14} />}
                                >
                                    {t('admin.delete')}
                                </Button>
                            </div>
                        ))}
                    </div>
                </QueryState>

                <Modal
                    open={!!deleting}
                    onClose={() => { setDeleting(null); setTypedSlug(''); }}
                    title={t('admin.deleteTitle')}
                    maxWidth="480px"
                >
                    <p className="text-text-secondary mb-3">{t('admin.deleteWarning')}</p>
                    <p className="text-text-muted text-sm mb-4">{t('admin.deleteSuggestSuspend')}</p>

                    <Input
                        label={t('admin.deleteConfirmPrompt', { slug: deleting?.slug })}
                        value={typedSlug}
                        onChange={(e) => setTypedSlug(e.target.value)}
                        dir="ltr"
                        autoFocus
                    />
                    {typedSlug && typedSlug.trim() !== deleting?.slug && (
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                            {t('admin.deleteConfirmMismatch')}
                        </p>
                    )}

                    <div className="flex gap-2 justify-end mt-5">
                        <button
                            onClick={() => { setDeleting(null); setTypedSlug(''); }}
                            className="px-4 py-2 text-text-secondary font-semibold"
                        >
                            {t('common.cancel')}
                        </button>
                        <Button
                            variant="danger"
                            onClick={confirmDelete}
                            disabled={typedSlug.trim() !== deleting?.slug || deleteChannel.isPending}
                        >
                            {t('admin.delete')}
                        </Button>
                    </div>
                </Modal>
            </div>
        </PageShell>
    );
}

export default AdminChannels;
