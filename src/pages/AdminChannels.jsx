import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Pause, Trash2, ExternalLink, ShieldOff, Link2, Mail } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import AdminNav from '../components/admin/AdminNav';
import { QueryState, Avatar, Badge, Button, Modal, Input, Pager } from '../components/ui';
import ReviewExemptionDialog, { ReviewExemptionSummary } from '../components/channel/ReviewExemptionDialog';
import ChannelInviteDialog from '../components/admin/ChannelInviteDialog';
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
    useSetChannelClaimable,
} from '../hooks/useChannels';
import { describeError } from '@/lib/describeError';
import { dateLocale, parseTimestamp } from '@/lib/datetime';
import { t } from '@/i18n';

/**
 * "Invited 3 days ago → a•••@gmail.com", or null for a channel nothing here has written to.
 *
 * <p><b>Masked, with the whole address in the title.</b> The row is admin-only, so this is not a
 * secrecy measure — it is that a scholar's address is not what an admin is scanning this list
 * for, and a column of full addresses turns a queue into a contact sheet. The exact string is one
 * hover away, which is what an admin checking for a typo actually needs.
 *
 * <p><b>Worded as sent, never as delivered.</b> Nothing consumes Resend's bounce webhook yet, so
 * a hard bounce and a scholar who read the mail and did nothing look identical from here. Saying
 * "delivered" would be the one claim this row cannot support.
 */
function InvitationNote({ invitation }) {
    if (!invitation?.sentAt) return null;
    const at = parseTimestamp(invitation.sentAt);
    const when = at.isValid() ? at.locale(dateLocale()).fromNow() : null;
    const address = invitation.email ?? '';
    const masked = address.includes('@')
        ? `${address[0]}\u2022\u2022\u2022${address.slice(address.indexOf('@'))}`
        : address;
    return (
        <p className="text-xs text-text-muted mt-1" title={address}>
            {t('admin.invite.sentNote', {
                when: when ?? '',
                address: masked,
                locale: (invitation.locale ?? '').toUpperCase(),
            })}
        </p>
    );
}

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
    // Paged: every channel on the platform. Pending ones stay a whole list above it — that is a
    // queue an admin empties, not a catalogue.
    const [page, setPage] = useState(0);
    const { data: allChannelsPage, isLoading: allLoading } = useAllAdminChannels(page);
    useEmptyPageStepBack(page, setPage, allChannelsPage, allLoading);
    const allChannels = allChannelsPage?.content ?? [];
    const approveChannel = useApproveChannel();
    const rejectChannel = useRejectChannel();
    const suspendChannel = useSuspendChannel();
    const setClaimable = useSetChannelClaimable();
    const deleteChannel = useDeleteChannel();

    // The channel awaiting a typed confirmation, and what has been typed so far.
    const [deleting, setDeleting] = useState(null);
    const [typedSlug, setTypedSlug] = useState('');

    // Only which channel's dialog is open — the control itself, its rules and its copy live in
    // ReviewExemptionDialog, shared with the channel's own settings tab.
    const [exempting, setExempting] = useState(null);

    // Same arrangement for the invitation: this page owns which row is open and nothing else.
    const [inviting, setInviting] = useState(null);

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

    /**
     * Opens or withdraws the claim offer.
     *
     * <p>Withdrawing is worded and behaves as withdrawing rather than hiding — the backend drops
     * the token, so a link already sitting in somebody's inbox stops working. That matters
     * because the notice an unclaimed channel carries is public: it tells every visitor the page
     * is ours and its subject has not taken it over, which is a claim about a real person.
     */
    const handleSetClaimable = (channel, claimable) => {
        setClaimable.mutate({ channelId: channel.id, claimable }, {
            onSuccess: () => showToast(
                t(claimable ? 'admin.claimLink.opened' : 'admin.claimLink.withdrawn'), 'success'),
            onError: (error) =>
                showToast(describeError(error, t('admin.claimLink.toggleFailed')), 'error'),
        });
    };

    const handleSuspend = (id) => {
        suspendChannel.mutate(id, { onError: () => showToast(t('admin.suspendFailed'), 'error') });
    };

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
                <AdminNav current="channels" />

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
                                    {/* The answer to "has anybody already written to this person,
                                        and where" — which nothing could answer while the
                                        invitation was a link an admin copied into their own mail
                                        client. */}
                                    <InvitationNote invitation={channel.claimInvitation} />
                                </div>
                                <Badge variant={STATUS_VARIANT[channel.status]}>{STATUS_LABEL[channel.status]}</Badge>
                                {/* Shown on the row and not only inside the dialog. A channel
                                    nothing scans is indistinguishable from one whose uploads all
                                    came back clean, which is exactly why it has to be visible
                                    without anyone going looking for it. */}
                                {channel.reviewExemptions?.length > 0 && (
                                    <Badge variant="danger">
                                        <ReviewExemptionSummary exemptions={channel.reviewExemptions} />
                                    </Badge>
                                )}
                                {/* Only where there is somebody to invite. A claimed or
                                    ordinary channel has no offer to scope, and the backend
                                    refuses to mint a token for one. */}
                                {/* A claimed channel offers neither: its owner is here, and
                                    moving it again is the transfer action, not this one. */}
                                {channel.claimState === 'UNCLAIMED' && (
                                    <>
                                        {/* One press for both routes — writing to the scholar and
                                            copying the link are one decision, and splitting them
                                            across two buttons made the copy the default by being
                                            first, which is how the platform ended up with no
                                            record of anything it had sent. */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setInviting(channel)}
                                            icon={<Mail size={14} />}
                                        >
                                            {channel.claimInvitation
                                                ? t('admin.invite.actionAgain')
                                                : t('admin.invite.action')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSetClaimable(channel, false)}
                                        >
                                            {t('admin.claimLink.withdraw')}
                                        </Button>
                                    </>
                                )}
                                {/* Every seeded channel starts here. Linking one no longer opens
                                    an offer by itself, because opening publishes a notice on the
                                    public page — so inviting is a press, made when the email is
                                    actually about to go out. */}
                                {channel.claimState === 'NOT_CLAIMABLE' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSetClaimable(channel, true)}
                                        icon={<Link2 size={14} />}
                                    >
                                        {t('admin.claimLink.open')}
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setExempting(channel)}
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

                <ReviewExemptionDialog
                    channel={exempting}
                    exemptions={exempting?.reviewExemptions}
                    open={!!exempting}
                    onClose={() => setExempting(null)}
                />

                <ChannelInviteDialog
                    channel={inviting}
                    open={!!inviting}
                    onClose={() => setInviting(null)}
                />

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
