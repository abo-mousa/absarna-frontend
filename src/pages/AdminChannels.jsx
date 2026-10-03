import { resolveMediaUrl } from '@/lib/media';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Check, X, Pause, Play, Trash2, ExternalLink, ShieldOff, Link2, Mail, History, ArrowRightLeft,
    Plus, FileCheck, LayoutDashboard, UserRound,
} from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import AdminNav from '../components/admin/AdminNav';
import { QueryState, Avatar, Badge, Button, Modal, Input, Pager, SearchField } from '../components/ui';
import ReviewExemptionDialog, { ReviewExemptionSummary } from '../components/channel/ReviewExemptionDialog';
import ChannelInviteDialog from '../components/admin/ChannelInviteDialog';
import StatusReasonDialog from '../components/admin/StatusReasonDialog';
import StatusHistoryDialog from '../components/admin/StatusHistoryDialog';
import { statusLabel } from '@/lib/channelStatus';
import ChannelTransferDialog from '../components/admin/ChannelTransferDialog';
import AdminChannelCreateDialog from '../components/admin/AdminChannelCreateDialog';
import AdoptionAuditDialog from '../components/admin/AdoptionAuditDialog';
import RowActionsMenu from '../components/admin/RowActionsMenu';
import { useToast } from '../contexts/ToastContext';
import { useEmptyPageStepBack } from '../hooks/useEmptyPageStepBack';
import { usePageMeta } from '../hooks/usePageMeta';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useChannelYouTube } from '../hooks/useChannelYouTube';
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
import { formatCount } from '@/lib/numbers';
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
        ? `${address[0]}•••${address.slice(address.indexOf('@'))}`
        : address;
    // Lapsed and unanswered: the cue to send again, which renews it with the same link. Null
    // once the channel is claimed or the offer withdrawn — and then the address is gone too.
    const expires = invitation.expiresAt ? parseTimestamp(invitation.expiresAt) : null;
    const lapsed = expires?.isValid() && expires.isBefore(Date.now());
    return (
        <p className="text-xs text-text-muted mt-1" title={address}>
            {address
                ? t('admin.invite.sentNote', {
                    when: when ?? '',
                    address: masked,
                    locale: (invitation.locale ?? '').toUpperCase(),
                })
                : t('admin.invite.sentNoteNoAddress', { when: when ?? '' })}
            {lapsed && <span className="text-gold-ink font-semibold"> · {t('admin.invite.lapsed')}</span>}
        </p>
    );
}

/**
 * The last decision recorded on the row, with its reason — the answer to "why is this
 * suspended", which used to be answerable only from the access log.
 */
function LastDecision({ change }) {
    if (!change) return null;
    const at = parseTimestamp(change.changedAt);
    const when = at.isValid() ? at.locale(dateLocale()).fromNow() : '';
    return (
        <p className="text-xs text-text-muted mt-1" title={change.reason ?? ''}>
            {t('admin.decision.last', {
                status: statusLabel(change.toStatus),
                when,
                by: change.actorUsername ?? `#${change.actorUserId ?? '?'}`,
            })}
            {change.reason && <span className="text-text-secondary"> — {change.reason}</span>}
        </p>
    );
}

/**
 * What an admin is approving: how far the import has got and whether it is still walking.
 *
 * <p>The row said "imported content from YouTube — review before approving" and showed nothing
 * about the import itself, so the admin decided blind. The owner's status endpoint answers for
 * an admin too (they pass the manage check), so this asks it per pending row — a queue that is
 * rarely more than a handful of channels.
 */
function ImportProgress({ slug }) {
    const { data } = useChannelYouTube(slug);
    if (!data?.importStatus) return null;
    const count = formatCount(data.importedVideos ?? 0);
    const total = data.importTotalEstimate;
    return (
        <p className="text-xs text-text-secondary mt-1">
            {total
                ? t('admin.pending.importProgress', { count, total: formatCount(total) })
                : t('admin.pending.importProgressNoTotal', { count })}
            {' · '}
            {t(`admin.pending.importState.${data.importStatus}`)}
        </p>
    );
}

const STATUS_VARIANT = {
    PENDING: 'featured',
    ACTIVE: 'success',
    REJECTED: 'danger',
    SUSPENDED: 'muted',
};

const STATUS_FILTERS = ['', 'ACTIVE', 'PENDING', 'SUSPENDED', 'REJECTED'];

function AdminChannels() {
    usePageMeta({ title: t('admin.manageChannels') });
    const { showToast } = useToast();
    // Pending is paged too, oldest first: a queue an admin empties, but one a burst of imports
    // can fill faster than anyone works it.
    const [pendingPage, setPendingPage] = useState(0);
    const { data: pendingData, isLoading: pendingLoading } = usePendingChannels(pendingPage);
    useEmptyPageStepBack(pendingPage, setPendingPage, pendingData, pendingLoading);
    const pendingChannels = pendingData?.content ?? [];
    const pendingTotal = pendingData?.totalItems ?? pendingChannels.length;
    // Paged, searched and filtered: every channel on the platform.
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const debouncedSearch = useDebouncedValue(search.trim(), 300);
    const { data: allChannelsPage, isLoading: allLoading } = useAllAdminChannels(page, debouncedSearch, status);
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

    // One dialog for the four status decisions: `{ channel, action }`.
    const [deciding, setDeciding] = useState(null);
    const [historyOf, setHistoryOf] = useState(null);
    const [transferring, setTransferring] = useState(null);
    const [auditing, setAuditing] = useState(null);
    const [creating, setCreating] = useState(false);

    const loading = pendingLoading || allLoading;

    const applyFilter = (change) => {
        setPage(0);
        change();
    };

    const decisionMutation = { approve: approveChannel, reject: rejectChannel, suspend: suspendChannel, reactivate: approveChannel };
    // Reset first, or a refusal from the previous decision would mark the reason box of this one.
    const openDecision = (channel, action) => {
        decisionMutation[action].reset();
        setDeciding({ channel, action });
    };

    const confirmDecision = (reason) => {
        const { channel, action } = deciding;
        const mutation = decisionMutation[action];
        mutation.mutate({ id: channel.id, reason }, {
            onSuccess: () => {
                showToast(t(`admin.decision.${action}.done`), 'success');
                setDeciding(null);
            },
            onError: (error) => showToast(describeError(error, t(`admin.decision.${action}.failed`)), 'error'),
        });
    };
    const decidingPending = deciding ? decisionMutation[deciding.action].isPending : false;
    const decidingError = deciding ? decisionMutation[deciding.action].error : null;

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

    const channelLink = (channel) => (
        <Link
            to={`/channel/${channel.slug}`}
            className="font-bold hover:text-primary hover:underline inline-flex items-center gap-1.5"
        >
            {channel.name}
            <ExternalLink size={14} aria-hidden="true" />
        </Link>
    );

    return (
        <PageShell>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
                <AdminNav current="channels" />

                <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
                    <h1 className="text-xl font-bold">{t('admin.manageChannels')}</h1>
                    <Button variant="outline" size="sm" onClick={() => setCreating(true)} icon={<Plus size={14} />}>
                        {t('admin.create.action')}
                    </Button>
                </div>

                <QueryState isLoading={loading}>
                    <h2 className="text-base font-bold mb-3">{t('admin.pendingCount', { count: pendingTotal })}</h2>

                    {pendingChannels.length === 0 ? (
                        <p className="text-text-muted mb-8">{t('admin.pendingEmpty')}</p>
                    ) : (
                        <div className="mb-8">
                            <div className="grid gap-3">
                                {pendingChannels.map((channel) => (
                                    <div key={channel.id} className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border-light flex-wrap">
                                        <Avatar src={resolveMediaUrl(channel.logoUrl)} name={channel.name} />
                                        <div className="flex-1 min-w-[150px]">
                                            {/* The whole row's name is the link, not a small icon
                                                beside it: opening the channel is the FIRST thing a
                                                reviewer does, and this queue previously offered no
                                                way to do it at all. */}
                                            {channelLink(channel)}
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
                                            {channel.importReview === 'PENDING' && <ImportProgress slug={channel.slug} />}
                                            <LastDecision change={channel.lastStatusChange} />
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
                                            {/* The owner's dashboard: the import panel, the held
                                                uploads, the unconfirmed metadata — everything the
                                                public page hides and an admin approving an import
                                                wants to see. Admins pass the manage check. */}
                                            <Link
                                                to={`/channel/${channel.slug}/manage?tab=youtube`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border
                                                    text-sm font-semibold text-text-secondary hover:bg-surface-hover transition-colors"
                                            >
                                                <LayoutDashboard size={14} aria-hidden="true" />
                                                {t('admin.pending.openDashboard')}
                                            </Link>
                                            <Button size="sm" onClick={() => openDecision(channel, 'approve')} icon={<Check size={14} />}>{t('admin.approve')}</Button>
                                            <Button variant="danger" size="sm" onClick={() => openDecision(channel, 'reject')} icon={<X size={14} />}>{t('admin.reject')}</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pager
                                page={pendingData?.currentPage ?? pendingPage}
                                totalPages={pendingData?.totalPages}
                                hasPrevious={pendingData?.hasPrevious ?? pendingPage > 0}
                                hasNext={pendingData?.hasNext ?? false}
                                onChange={setPendingPage}
                            />
                        </div>
                    )}

                    <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
                        <h2 className="text-base font-bold">{t('admin.allChannelsCount', { count: allChannelsPage?.totalItems ?? 0 })}</h2>
                        <div className="flex gap-3 flex-wrap items-end">
                            {/* Plain toggle buttons with aria-pressed, as the report queue's
                                filters are — not a tablist promising an arrow-key model. */}
                            <div className="flex gap-1.5 flex-wrap" role="group" aria-label={t('admin.filters.status')}>
                                {STATUS_FILTERS.map((value) => (
                                    <button
                                        key={value || 'all'}
                                        type="button"
                                        aria-pressed={status === value}
                                        onClick={() => applyFilter(() => setStatus(value))}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                                            status === value
                                                ? 'border-primary bg-primary-light text-primary'
                                                : 'border-border-light bg-surface hover:bg-surface-hover'
                                        }`}
                                    >
                                        {value ? statusLabel(value) : t('admin.filters.all')}
                                    </button>
                                ))}
                            </div>
                            <SearchField
                                value={search}
                                onChange={(value) => applyFilter(() => setSearch(value))}
                                placeholder={t('admin.filters.searchPlaceholder')}
                                className="min-w-[220px]"
                            />
                        </div>
                    </div>

                    {allChannels.length === 0 && (
                        <p className="text-text-muted text-sm mb-4">{t('admin.filters.empty')}</p>
                    )}

                    <div className="grid gap-3">
                        {allChannels.map((channel) => (
                            <div key={channel.id} className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border-light flex-wrap">
                                <Avatar src={resolveMediaUrl(channel.logoUrl)} name={channel.name} />
                                <div className="flex-1 min-w-[150px]">
                                    {/* Same link as the queue above: suspending or deleting a
                                        channel is also a decision worth looking at it first. */}
                                    {channelLink(channel)}
                                    <p className="text-sm text-text-muted">
                                        @{channel.slug}
                                        {channel.ownerUserId != null && (
                                            <>
                                                {' · '}
                                                <Link to={`/admin/users/${channel.ownerUserId}`} className="inline-flex items-center gap-1 hover:text-primary hover:underline">
                                                    <UserRound size={12} aria-hidden="true" />
                                                    {t('admin.ownerLink', { id: channel.ownerUserId })}
                                                </Link>
                                            </>
                                        )}
                                    </p>
                                    {/* The answer to "has anybody already written to this person,
                                        and where" — which nothing could answer while the
                                        invitation was a link an admin copied into their own mail
                                        client. */}
                                    <InvitationNote invitation={channel.claimInvitation} />
                                    <LastDecision change={channel.lastStatusChange} />
                                </div>
                                <Badge variant={STATUS_VARIANT[channel.status]}>{statusLabel(channel.status)}</Badge>
                                {/* Shown on the row and not only inside the dialog. A channel
                                    nothing scans is indistinguishable from one whose uploads all
                                    came back clean, which is exactly why it has to be visible
                                    without anyone going looking for it. */}
                                {channel.reviewExemptions?.length > 0 && (
                                    <Badge variant="danger">
                                        <ReviewExemptionSummary exemptions={channel.reviewExemptions} />
                                    </Badge>
                                )}
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
                                {/* The once-a-year actions, behind one button; the decisions
                                    stay on the row. Affirmations are offered on every channel:
                                    an owner-made channel that imported has them too. */}
                                <RowActionsMenu
                                    items={[
                                        { id: 'exemptions', label: t('admin.exemptions.action'), icon: ShieldOff, onClick: () => setExempting(channel) },
                                        { id: 'history', label: t('admin.history.action'), icon: History, onClick: () => setHistoryOf(channel) },
                                        { id: 'audit', label: t('admin.audit.action'), icon: FileCheck, onClick: () => setAuditing(channel) },
                                        { id: 'transfer', label: t('admin.transfer.action'), icon: ArrowRightLeft, onClick: () => setTransferring(channel) },
                                    ]}
                                />
                                {channel.status === 'ACTIVE' && (
                                    <Button size="sm" onClick={() => openDecision(channel, 'suspend')} icon={<Pause size={14} />} className="!bg-gold hover:!bg-gold">
                                        {t('admin.suspend')}
                                    </Button>
                                )}
                                {/* The way back. Suspending says it is the reversible option, and
                                    nothing on this page could reverse it: approve lived in the
                                    pending queue only, which a suspended or rejected channel is not
                                    in. The same approve call — it sets ACTIVE from any state. */}
                                {(channel.status === 'SUSPENDED' || channel.status === 'REJECTED') && (
                                    <Button
                                        size="sm"
                                        onClick={() => openDecision(channel, 'reactivate')}
                                        icon={<Play size={14} />}
                                    >
                                        {t('admin.reactivate')}
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

                <StatusReasonDialog
                    channel={deciding?.channel}
                    action={deciding?.action}
                    open={!!deciding}
                    pending={decidingPending}
                    error={decidingError}
                    onConfirm={confirmDecision}
                    onClose={() => setDeciding(null)}
                />

                <StatusHistoryDialog channel={historyOf} open={!!historyOf} onClose={() => setHistoryOf(null)} />
                <ChannelTransferDialog channel={transferring} open={!!transferring} onClose={() => setTransferring(null)} />
                <AdoptionAuditDialog channel={auditing} open={!!auditing} onClose={() => setAuditing(null)} />
                <AdminChannelCreateDialog open={creating} onClose={() => setCreating(false)} />

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
