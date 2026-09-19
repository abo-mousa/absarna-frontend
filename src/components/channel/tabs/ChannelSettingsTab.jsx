import { useState } from 'react';
import { Save, ShieldOff } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input, Button } from '@/components/ui';
import { FieldLabel } from '../ContentPublishForm';
import ReviewExemptionDialog, { ReviewExemptionSummary } from '../ReviewExemptionDialog';
import { useUpdateChannel, useChannelReviewExemptions } from '@/hooks/useChannels';
import { isPlatformAdmin } from '@/lib/user';
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
        </div>
    );
}
