import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ShieldOff, Trash2, ImageDown, BadgeCheck } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input, Button, Modal, ImageUploadField } from '@/components/ui';
import ReviewExemptionDialog, { ReviewExemptionSummary } from '../ReviewExemptionDialog';
import { useUpdateChannel, useChannelReviewExemptions, useDeleteOwnChannel } from '@/hooks/useChannels';
import { useChannelImage, useCopyYouTubeImages, useConfirmYouTubeImages } from '@/hooks/useOwnerImage';
import { isPlatformAdmin, isChannelOwner } from '@/lib/user';
import { t } from '@/i18n';
import { describeError } from '@/lib/describeError';

/**
 * The channel's own properties: name and description — and its two pictures.
 *
 * <p>Nothing else. The YouTube link and import used to sit under this form, which read as more
 * settings — a one-time migration stacked below a name field — and has its own tab now.
 */
export default function ChannelSettingsTab({ slug, channel, youtubeState, isOwner }) {
    const { showToast } = useToast();
    const { user } = useAuth();
    const updateChannel = useUpdateChannel(slug, channel?.id);
    const [saving, setSaving] = useState(false);
    // Platform admin only, and the request is only made for one — the same shape
    // YouTubeImportPanel's admin attestation uses. An owner reaching this tab never asks for it,
    // so nothing here can disclose which detectors skip their channel.
    const isAdmin = isPlatformAdmin(user);
    const [exempting, setExempting] = useState(false);
    const { data: exemptions } = useChannelReviewExemptions(channel?.id, isAdmin);
    const [form, setForm] = useState({
        name: channel.name || '',
        description: channel.description || '',
        // No logoUrl/bannerUrl here. They were carried through a form with no field for either,
        // so every save re-sent whatever the DTO held — and since an uploaded logo's DTO value is
        // its media address, saving the name would have written that address into the URL column.
        // The two pictures are the image pickers' now, which save on their own.
    });

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateChannel.mutateAsync(form);
            showToast(t('channelManage.saved'), 'success');
        } catch (err) {
            showToast(describeError(err, t('channelManage.saveFailed')), 'error');
        } finally {
            setSaving(false);
        }
    };

    const field = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    return (
        <div className="grid gap-4">
        {/* BELOW the channel's own settings, and visually separated: this is not a property of
            the channel its owner is editing, it is a platform decision about the channel that
            happens to be actionable from here. Reached from the channel itself because deciding
            to stop scanning one is a decision made by LOOKING at it — the same argument the
            pending queue's "open channel" link exists for — rather than from a row in a list of
            every channel on the platform, which shows a name, a slug and a status. */}
        <form onSubmit={handleSave} className="grid gap-4 bg-surface p-6 rounded-lg border border-border-light">
            <Input label={t('channelManage.channelName')} value={form.name} onChange={field('name')} />
            <Input label={t('fields.description')} textarea rows={3} value={form.description} onChange={field('description')} />
            {/* No colour picker: a channel's colour only ever painted the letter circle of a
                channel with no photo, and Avatar now draws every one of those in the brand's own
                teal and gold. A picker that changes nothing visible is worse than none. */}
            <Button type="submit" disabled={saving} icon={<Save size={18} />}>
                {saving ? t('common.saving') : t('common.save')}
            </Button>
        </form>

        <ChannelImagesCard slug={slug} channel={channel} youtubeState={youtubeState} isOwner={isOwner} />

        {isAdmin && (
            <div className="bg-surface p-6 rounded-lg border border-border-light grid gap-3">
                <div>
                    <h3 className="font-bold">{t('admin.exemptions.action')}</h3>
                    <p className="text-text-muted text-sm mt-1">
                        {exemptions?.length
                            ? <ReviewExemptionSummary exemptions={exemptions} />
                            : t('admin.exemptions.noneYet')}
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="w-fit"
                    onClick={() => setExempting(true)}
                    icon={<ShieldOff size={16} />}
                >
                    {t('admin.exemptions.change')}
                </Button>
            </div>
        )}

        {isAdmin && (
            <ReviewExemptionDialog
                channel={channel}
                exemptions={exemptions}
                open={exempting}
                onClose={() => setExempting(false)}
            />
        )}

        {/* The OWNER's, not a manager's: an admin already deletes from the admin screen, and the
            backend refuses this route to anyone but the owner. Last on the tab, under everything
            an owner comes here to change. */}
        {isChannelOwner(user, channel) && <DeleteChannelCard slug={slug} channel={channel} />}
        </div>
    );
}

/**
 * The owner closing their own channel.
 *
 * <p>Password-confirmed, like deleting the account (`UserProfile`'s `DeleteAccountCard`, whose
 * shape this follows): a channel with an imported back catalogue is thousands of rows and files,
 * none of it recoverable, so a stolen session alone must not be enough.
 */
function DeleteChannelCard({ slug, channel }) {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const deleteChannel = useDeleteOwnChannel(slug, channel.id);
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState('');

    const handleDelete = (e) => {
        e.preventDefault();
        deleteChannel.mutate(password, {
            onSuccess: () => {
                showToast(t('channelManage.deleteChannel.done'), 'success');
                navigate('/', { replace: true });
            },
            onError: (err) =>
                showToast(describeError(err, t('channelManage.deleteChannel.failed')), 'error'),
        });
    };

    return (
        <div className="bg-surface p-6 rounded-lg border border-red-300 dark:border-red-900 grid gap-3">
            <div>
                <h3 className="font-bold text-red-700 dark:text-red-400">
                    {t('channelManage.deleteChannel.heading')}
                </h3>
                <p className="text-sm text-text-secondary mt-1">{t('channelManage.deleteChannel.intro')}</p>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">
                    {t('channelManage.deleteChannel.whatGoes')}
                </p>
            </div>
            <Button
                variant="danger"
                className="w-fit"
                onClick={() => setOpen(true)}
                icon={<Trash2 size={16} />}
            >
                {t('channelManage.deleteChannel.button')}
            </Button>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={t('channelManage.deleteChannel.confirmTitle')}
                maxWidth="460px"
            >
                <form onSubmit={handleDelete} className="grid gap-4">
                    <p className="text-sm text-text-secondary leading-relaxed">
                        {t('channelManage.deleteChannel.confirmBody', { name: channel.name })}
                    </p>
                    <Input
                        label={t('profile.currentPassword')}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        dir="ltr"
                    />
                    <Button
                        type="submit"
                        variant="danger"
                        disabled={deleteChannel.isPending || !password}
                        fullWidth
                    >
                        {deleteChannel.isPending
                            ? t('channelManage.deleteChannel.deleting')
                            : t('channelManage.deleteChannel.confirmButton')}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}

/**
 * The channel's logo and cover. Each saves the moment a file is chosen — there is no form to
 * submit, because a picture is not a draft.
 *
 * <p>A channel linked to YouTube gets its logo and cover copied from there, held like its titles:
 * refreshed from YouTube every month until the owner confirms they are theirs. The confirm step is
 * here, above the two pictures it is about, and — like "use my YouTube logo and cover" — offered
 * only to the channel's own owner once they have verified with Google. An admin who can manage the
 * channel is not its owner.
 */
function ChannelImagesCard({ slug, channel, youtubeState, isOwner }) {
    const { showToast } = useToast();
    const logo = useChannelImage(slug, 'logo');
    const banner = useChannelImage(slug, 'banner');
    const copyFromYouTube = useCopyYouTubeImages(slug);
    const confirmImages = useConfirmYouTubeImages(slug);
    const canCopy = isOwner && youtubeState?.verifiedBy === 'OWNER';
    const awaiting = youtubeState?.imagesAwaitingConfirmation ?? [];

    const run = async (action, okKey) => {
        try {
            await action();
            showToast(t(okKey), 'success');
        } catch (err) {
            showToast(t('ownerImage.failed', { reason: describeError(err) }), 'error');
        }
    };

    const handleCopy = async () => {
        try {
            const result = await copyFromYouTube.mutateAsync();
            const copied = [result?.logo, result?.banner].filter((o) => o === 'COPIED').length;
            showToast(copied > 0 ? t('ownerImage.youtube.copied') : t('ownerImage.youtube.nothing'),
                copied > 0 ? 'success' : 'info');
        } catch (err) {
            showToast(t('ownerImage.failed', { reason: describeError(err) }), 'error');
        }
    };

    return (
        <div className="bg-surface p-6 rounded-lg border border-border-light grid gap-5">
            <h3 className="font-bold">{t('ownerImage.channelHeading')}</h3>

            {/* Worded as the consequence, like the metadata notice: until confirmed, the monthly
                refresh may replace these from YouTube — so it is about whether the pictures on
                the owner's own channel are theirs. */}
            {canCopy && awaiting.length > 0 && (
                <div className="grid gap-2 rounded-md border border-gold/40 bg-gold/10 p-4">
                    <p className="text-sm m-0">{t('ownerImage.confirm.explain')}</p>
                    <Button
                        className="w-fit"
                        onClick={() => run(() => confirmImages.mutateAsync(), 'ownerImage.confirm.done')}
                        disabled={confirmImages.isPending}
                        icon={<BadgeCheck size={16} />}
                    >
                        {confirmImages.isPending ? t('common.saving') : t('ownerImage.confirm.action')}
                    </Button>
                </div>
            )}

            <ImageUploadField
                label={t('ownerImage.logo')}
                hint={t('ownerImage.logoHint')}
                previewUrl={channel.logoUrl}
                shape="round"
                hasUpload={channel.hasUploadedLogo}
                uploading={logo.uploading}
                removing={logo.removing}
                onPick={(file) => run(() => logo.upload(file), 'ownerImage.saved')}
                onRemove={() => run(logo.remove, 'ownerImage.removed')}
            />

            <ImageUploadField
                label={t('ownerImage.banner')}
                hint={t('ownerImage.bannerHint')}
                previewUrl={channel.bannerUrl}
                shape="wide"
                hasUpload={channel.hasUploadedBanner}
                uploading={banner.uploading}
                removing={banner.removing}
                onPick={(file) => run(() => banner.upload(file), 'ownerImage.saved')}
                onRemove={() => run(banner.remove, 'ownerImage.removed')}
            />

            {canCopy && (
                <div className="grid gap-2 pt-4 border-t border-border-light">
                    <p className="text-sm text-text-muted m-0">{t('ownerImage.youtube.explain')}</p>
                    <Button
                        variant="outline"
                        className="w-fit"
                        onClick={handleCopy}
                        disabled={copyFromYouTube.isPending}
                        icon={<ImageDown size={16} />}
                    >
                        {copyFromYouTube.isPending ? t('ownerImage.youtube.copying') : t('ownerImage.youtube.action')}
                    </Button>
                </div>
            )}
        </div>
    );
}

