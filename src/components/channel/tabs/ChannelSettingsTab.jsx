import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ShieldOff, Trash2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input, Button, Modal } from '@/components/ui';
import { FieldLabel } from '../ContentPublishForm';
import ReviewExemptionDialog, { ReviewExemptionSummary } from '../ReviewExemptionDialog';
import { useUpdateChannel, useChannelReviewExemptions, useDeleteOwnChannel } from '@/hooks/useChannels';
import { isPlatformAdmin, isChannelOwner } from '@/lib/user';
import { t } from '@/i18n';
import { describeError } from '@/lib/describeError';

/**
 * The channel's own properties: name, description, colour.
 *
 * <p>Nothing else. The YouTube link and import used to sit under this form, which read as more
 * settings — a one-time migration stacked below a name field — and has its own tab now.
 */
export default function ChannelSettingsTab({ slug, channel }) {
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
        primaryColor: channel.primaryColor || '#0D6B4D',
        logoUrl: channel.logoUrl || '',
        bannerUrl: channel.bannerUrl || '',
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
            <div>
                <FieldLabel>{t('fields.primaryColor')}</FieldLabel>
                <input type="color" value={form.primaryColor} onChange={field('primaryColor')} className="w-[60px] h-10 cursor-pointer" />
            </div>
            <Button type="submit" disabled={saving} icon={<Save size={18} />}>
                {saving ? t('common.saving') : t('common.save')}
            </Button>
        </form>

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
