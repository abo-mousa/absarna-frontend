import { useEffect, useRef, useState } from 'react';
import { Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/contexts/ToastContext';
import { Input, Button } from '@/components/ui';
import { FieldLabel } from '../ContentPublishForm';
import YouTubeImportPanel from '../YouTubeImportPanel';
import { useUpdateChannel } from '@/hooks/useChannels';
import { t } from '@/i18n';
import { describeError } from '@/lib/describeError';

/**
 * The channel's own properties, and its YouTube link.
 *
 * <p>A YouTube link is a property of the channel, like its name and colour — every other tab is a
 * content type, and a source is not one. Imported videos land in the videos tab beside uploaded
 * ones.
 */
export default function ChannelSettingsTab({ slug, channel, youtubeState, active }) {
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

    useImportCompletionToast(slug, youtubeState);

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
        <>
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
            <div className="mt-6">
                {/* Polls while an import runs, so it is mounted only on the tab that shows it. */}
                {active && <YouTubeImportPanel slug={slug} />}
            </div>
        </>
    );
}

/**
 * Reacts to a YouTube import finishing.
 *
 * <p>The panel polls while a run is `RUNNING`, so its own status text updates in place — but that
 * is the only thing that noticed. The channel's lists were invalidated when the import *started*,
 * the one moment they are guaranteed to be correct, and never again: an import that added 1,926
 * videos left the videos tab showing none of them until something else happened to refetch.
 *
 * <p>Watching the RUNNING → terminal transition rather than the status alone, so this fires once on
 * completion instead of on every poll after it.
 *
 * <p>Nothing here reaches a viewer who has navigated away. The platform has no notification channel
 * — deliberately, the same call the transcode pipeline makes — so this is an in-session update, and
 * the state is still correct whenever the owner comes back.
 */
function useImportCompletionToast(slug, youtubeState) {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const previousStatus = useRef(null);

    useEffect(() => {
        const status = youtubeState?.importStatus;
        const previous = previousStatus.current;
        previousStatus.current = status;

        if (previous !== 'RUNNING' || status === 'RUNNING') return;

        if (status === 'SUCCESS') {
            showToast(t('youtube.succeeded', { count: youtubeState?.importedVideos ?? 0 }), 'success');
            // The import wrote videos and series straight into this channel; every list is stale.
            queryClient.invalidateQueries({ queryKey: ['channel-manage', slug] });
            queryClient.invalidateQueries({ queryKey: ['channel-series-manage', slug] });
        } else if (status === 'FAILED') {
            showToast(t('youtube.failed', { reason: youtubeState?.importMessage || '' }), 'error');
        }
        // Keyed on the status TRANSITION alone, per the note above. `importedVideos` climbs on
        // every poll while the import runs, so listing it would re-fire this effect — and its toast
        // and two invalidations — on each one.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [youtubeState?.importStatus]);
}
