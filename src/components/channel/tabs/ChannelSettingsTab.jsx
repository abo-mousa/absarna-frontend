import { useState } from 'react';
import { Save } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Input, Button } from '@/components/ui';
import { FieldLabel } from '../ContentPublishForm';
import { useUpdateChannel } from '@/hooks/useChannels';
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
    const updateChannel = useUpdateChannel(slug, channel?.id);
    const [saving, setSaving] = useState(false);
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
    );
}
