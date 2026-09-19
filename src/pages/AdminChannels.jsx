import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Pause, Trash2, ExternalLink, ShieldOff } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { QueryState, Avatar, Badge, Button, Modal, Input, Pager } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { useEmptyPageStepBack } from '../hooks/useEmptyPageStepBack';
import { usePageMeta } from '../hooks/usePageMeta';
import {
    usePendingChannels,
    useAllAdminChannels,
    useApproveChannel,
    useRejectChannel,
    useSuspendChannel,
    useDeleteChannel,
    useSetChannelReviewExemptions,
} from '../hooks/useChannels';
import { t } from '@/i18n';

const STATUS_VARIANT = {
    PENDING: 'featured',
    ACTIVE: 'success',
    REJECTED: 'danger',
    SUSPENDED: 'muted',
};

/**
 * The detectors a channel can be excused from, in the order the backend declares them.
 *
 * <p>Listed here rather than derived from what a channel already carries, because the control is
 * a checkbox per detector and an unchecked box has to exist before anyone ticks it. The names are
 * the backend's wire values and must stay so — they are what goes on the transcode job.
 */
const DETECTORS = ['MUSIC', 'NUDITY'];

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
    // Paged: every channel on the platform. Pending ones stay a whole list above it — that is a
    // queue an admin empties, not a catalogue.
    const [page, setPage] = useState(0);
    const { data: allChannelsPage, isLoading: allLoading } = useAllAdminChannels(page);
    useEmptyPageStepBack(page, setPage, allChannelsPage, allLoading);
    const allChannels = allChannelsPage?.content ?? [];
    const approveChannel = useApproveChannel();
    const rejectChannel = useRejectChannel();
    const suspendChannel = useSuspendChannel();
    const deleteChannel = useDeleteChannel();

    // The channel awaiting a typed confirmation, and what has been typed so far.
    const [deleting, setDeleting] = useState(null);
    const [typedSlug, setTypedSlug] = useState('');

    // The channel whose detection settings are open, and the unsaved edit. Seeded from the row
    // the listing already carries, so the dialog opens filled in rather than empty-then-populated.
    const setExemptions = useSetChannelReviewExemptions();
    const [exempting, setExempting] = useState(null);
    const [exemptTypes, setExemptTypes] = useState([]);
    const [exemptReason, setExemptReason] = useState('');

    const openExemptions = (channel) => {
        setExempting(channel);
        setExemptTypes((channel.reviewExemptions ?? []).map((e) => e.type));
        // Deliberately NOT pre-filled with the existing reason. Every save restamps who decided
        // and why, so carrying the old sentence forward would attribute one admin's reasoning to
        // another admin's decision.
        setExemptReason('');
    };

    const toggleExempt = (type) => {
        setExemptTypes((current) =>
            current.includes(type) ? current.filter((t2) => t2 !== type) : [...current, type]);
    };

    const saveExemptions = () => {
        setExemptions.mutate(
            { id: exempting.id, types: exemptTypes, reason: exemptReason.trim() },
            {
                onSuccess: () => {
                    showToast(t('admin.exemptions.saved'), 'success');
                    setExempting(null);
                },
                onError: () => showToast(t('admin.exemptions.saveFailed'), 'error'),
            },
        );
    };

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
                                        {/* The whole row's name is the link, not a small icon
                                            beside it: opening the channel is the FIRST thing a
                                            reviewer does, and this queue previously offered no
                                            way to do it at all — an admin had to build the URL
                                            from the slug by hand before deciding. */}
                                        <Link
                                            to={`/channel/${channel.slug}`}
                                            className="font-bold hover:text-primary hover:underline inline-flex items-center gap-1.5"
                                        >
                                            {channel.name}
                                            <ExternalLink size={14} aria-hidden="true" />
                                        </Link>
                                        <p className="text-sm text-text-muted">@{channel.slug}</p>
                                        {/* Says what is being approved. Since channel creation
                                            stopped queueing anything, a row here is an imported
                                            catalogue that nothing has examined — the upload
                                            pipeline never sees an imported video. */}
                                        <p className="text-xs text-text-muted mt-1">
                                            {channel.importReview === 'PENDING'
                                                ? t('admin.pendingReasonImport')
                                                : t('admin.pendingReasonOther')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <Link
                                            to={`/channel/${channel.slug}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border
                                                text-sm font-semibold text-text-secondary hover:bg-surface-hover transition-colors"
                                        >
                                            <ExternalLink size={14} aria-hidden="true" />
                                            {t('admin.openChannel')}
                                        </Link>
                                        <Button size="sm" onClick={() => handleApprove(channel.id)} icon={<Check size={14} />}>{t('admin.approve')}</Button>
                                        <Button variant="danger" size="sm" onClick={() => handleReject(channel.id)} icon={<X size={14} />}>{t('admin.reject')}</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <h2 className="text-base font-bold mb-3">{t('admin.allChannelsCount', { count: allChannelsPage?.totalItems ?? 0 })}</h2>

                    <div className="grid gap-3">
                        {allChannels.map((channel) => (
                            <div key={channel.id} className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border-light flex-wrap">
                                <Avatar name={channel.name} color={channel.primaryColor} />
                                <div className="flex-1 min-w-[150px]">
                                    {/* Same link as the queue above: suspending or deleting a
                                        channel is also a decision worth looking at it first. */}
                                    <Link
                                        to={`/channel/${channel.slug}`}
                                        className="font-bold hover:text-primary hover:underline inline-flex items-center gap-1.5"
                                    >
                                        {channel.name}
                                        <ExternalLink size={14} aria-hidden="true" />
                                    </Link>
                                    <p className="text-sm text-text-muted">@{channel.slug}</p>
                                </div>
                                <Badge variant={STATUS_VARIANT[channel.status]}>{STATUS_LABEL[channel.status]}</Badge>
                                {/* Shown on the row and not only inside the dialog. A channel
                                    nothing scans is indistinguishable from one whose uploads all
                                    came back clean, which is exactly why it has to be visible
                                    without anyone going looking for it. */}
                                {channel.reviewExemptions?.length > 0 && (
                                    <Badge variant="danger">
                                        {t('admin.exemptions.badge', {
                                            types: channel.reviewExemptions
                                                .map((e) => t(`admin.exemptions.detector.${e.type}`))
                                                .join('، '),
                                        })}
                                    </Badge>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openExemptions(channel)}
                                    icon={<ShieldOff size={14} />}
                                >
                                    {t('admin.exemptions.action')}
                                </Button>
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
                    {allChannelsPage && (
                        <Pager
                            page={allChannelsPage.currentPage}
                            totalPages={allChannelsPage.totalPages}
                            hasPrevious={allChannelsPage.hasPrevious}
                            hasNext={allChannelsPage.hasNext}
                            onChange={setPage}
                        />
                    )}
                </QueryState>

                <Modal
                    open={!!exempting}
                    onClose={() => setExempting(null)}
                    title={t('admin.exemptions.title', { name: exempting?.name })}
                    maxWidth="520px"
                >
                    <p className="text-text-secondary mb-2">{t('admin.exemptions.intro')}</p>
                    {/* Both halves of what this does NOT do. Neither is obvious from the control,
                        and an admin who assumes either one is wrong in a direction that matters:
                        that ticking a box publishes what is already held, or that it re-examines
                        what has already been uploaded. */}
                    <p className="text-text-muted text-sm mb-4">{t('admin.exemptions.scope')}</p>

                    <div className="grid gap-2 mb-4">
                        {DETECTORS.map((type) => (
                            <label
                                key={type}
                                className="flex items-start gap-3 p-3 rounded-lg border border-border-light
                                    cursor-pointer hover:bg-surface-hover transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    className="mt-1 accent-primary"
                                    checked={exemptTypes.includes(type)}
                                    onChange={() => toggleExempt(type)}
                                />
                                <span>
                                    <span className="font-semibold block">
                                        {t(`admin.exemptions.detector.${type}`)}
                                    </span>
                                    <span className="text-text-muted text-sm">
                                        {t(`admin.exemptions.detectorHint.${type}`)}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </div>

                    <Input
                        label={t('admin.exemptions.reasonLabel')}
                        value={exemptReason}
                        onChange={(e) => setExemptReason(e.target.value)}
                        textarea
                        rows={2}
                        required
                    />
                    <p className="text-text-muted text-xs mt-1">{t('admin.exemptions.reasonHint')}</p>

                    <div className="flex gap-2 justify-end mt-5">
                        <button
                            onClick={() => setExempting(null)}
                            className="px-4 py-2 text-text-secondary font-semibold"
                        >
                            {t('common.cancel')}
                        </button>
                        <Button
                            onClick={saveExemptions}
                            disabled={!exemptReason.trim() || setExemptions.isPending}
                        >
                            {t('common.save')}
                        </Button>
                    </div>
                </Modal>

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
