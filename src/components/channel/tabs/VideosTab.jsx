import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui';
import ContentPublishForm, { FieldLabel } from '../ContentPublishForm';
import ManagedContentList from './ManagedContentList';
import { useChannelContentTab } from '@/hooks/useChannelContentTab';
import { useChannelUpload } from '@/hooks/useChannelUpload';
import { useChannelSeriesManage } from '@/hooks/useSeries';
import { usePresignedUpload, acceptAttribute } from '@/hooks/usePresignedUpload';
import { useUploadOriginal } from '@/hooks/useChannelYouTube';
import { stripEmpty } from '@/lib/forms';
import { t } from '@/i18n';

// Named so that "reset the form after publishing" is one reference rather than a second copy of
// the field list that can silently fall out of step with the first.
//
// sourceType/sourceUrl stay for the external-URL path (a YouTube link, say); a presigned upload
// sets uploadSessionId instead. The create endpoint requires exactly one of the two shapes, which
// is why neither is pre-filled.
const EMPTY_FORM = {
    title: '', description: '', sourceType: '', sourceUrl: '', uploadSessionId: '',
    category: '', seriesId: '', orderInSeries: '', originalPublishDate: '',
};

export default function VideosTab({ slug, channel, youtubeState, active }) {
    const content = useChannelContentTab(slug, 'videos', active);
    const upload = useChannelUpload(slug, 'videos');
    const { data: seriesList = [] } = useChannelSeriesManage(slug, active);
    const [form, setForm] = useState(EMPTY_FORM);
    const uploadOriginalAction = useUploadOriginalAction(slug, youtubeState);

    const field = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const handleFileSelect = (e) => upload.selectFile(e, {
        failureMessage: (reason) => t('channelManage.forms.video.uploadFailed', { reason }),
        onUploaded: (uploadSessionId, fallbackTitle) => setForm((current) => ({
            ...current,
            // sourceType/sourceUrl are the server's to set on this path — the create request
            // rejects a payload carrying both a sourceUrl and an uploadSessionId.
            sourceType: '',
            sourceUrl: '',
            uploadSessionId,
            title: current.title || fallbackTitle,
        })),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        content.publish({ ...stripEmpty(form), speaker: channel.name }, {
            action: t('channelManage.forms.video.action'),
            successMessage: t('channelManage.forms.video.published'),
            onSuccess: () => {
                // The session is spent: confirm assembled the object and created the row.
                upload.forget();
                setForm(EMPTY_FORM);
            },
        });
    };

    return (
        <div className="grid gap-6">
            <ContentPublishForm
                heading={t('channelManage.forms.video.heading')}
                onSubmit={handleSubmit}
                submitLabel={t('channelManage.forms.video.submit')}
                submitIcon={<Upload size={18} />}
                file={{
                    label: t('channelManage.forms.video.fileLabel'),
                    hint: t('channelManage.forms.video.fileHint'),
                    accept: acceptAttribute('videos'),
                    onChange: handleFileSelect,
                    uploading: upload.uploading,
                    progress: upload.progress,
                }}
            >
                <Input label={t('fields.title')} value={form.title} onChange={field('title')} required />
                <Input label={t('fields.description')} textarea rows={3} value={form.description} onChange={field('description')} />
                <Input label={t('fields.category')} value={form.category} onChange={field('category')} />

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                    <div>
                        <FieldLabel>{t('channelManage.seriesSelectLabel')}</FieldLabel>
                        <select
                            value={form.seriesId}
                            onChange={field('seriesId')}
                            className="w-full px-3.5 py-2.5 rounded-md border border-border outline-none focus:border-primary transition-colors bg-surface"
                        >
                            <option value="">{t('channelManage.seriesSelectNone')}</option>
                            {seriesList.map((s) => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                        </select>
                    </div>
                    {form.seriesId && (
                        <Input
                            label={t('channelManage.seriesOrderLabel')}
                            type="number"
                            min="1"
                            value={form.orderInSeries}
                            onChange={field('orderInSeries')}
                        />
                    )}
                </div>
                <Input label={t('fields.originalPublishDateOptional')} type="date" value={form.originalPublishDate} onChange={field('originalPublishDate')} />
            </ContentPublishForm>

            <ManagedContentList
                type="videos"
                heading={t('channelManage.forms.video.listHeading', { count: content.items.length })}
                content={content}
                extraActions={uploadOriginalAction}
            />
        </div>
    );
}

/**
 * The per-row action that replaces an imported video's YouTube embed with the real file.
 *
 * <p>Reuses the ordinary presigned upload; only the final call differs — it attaches the session to
 * a video that already exists rather than creating one. Deliberately NOT routed through the resume
 * machinery: resume is keyed per (channel, kind) and one remembered session cannot describe which
 * of two thousand videos it belongs to. A second, independent uploader, so replacing one video's
 * source shares no progress or cancellation with the publish form on the same tab.
 *
 * <p>`sourceType === 'YOUTUBE'` is the eligibility test rather than a "has a file" flag, because
 * object keys never appear on a DTO — and it is exactly right: a video still typed YOUTUBE is one
 * we do not host.
 */
function useUploadOriginalAction(slug, youtubeState) {
    const { showToast } = useToast();
    const originalUpload = usePresignedUpload();
    const uploadOriginal = useUploadOriginal(slug);
    const [claimingVideoId, setClaimingVideoId] = useState(null);

    const handleUpload = async (e, video) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;

        setClaimingVideoId(video.id);
        try {
            const uploadSessionId = await originalUpload.upload(file, { kind: 'videos', slug });
            await uploadOriginal.mutateAsync({ videoId: video.id, uploadSessionId });
            showToast(t('youtube.uploadedOriginal'), 'success');
        } catch (err) {
            if (err.name !== 'AbortError') {
                showToast(t('youtube.uploadOriginalFailed', {
                    reason: err.response?.data?.message || err.message,
                }), 'error');
            }
        } finally {
            setClaimingVideoId(null);
        }
    };

    return (video) => {
        if (video.sourceType !== 'YOUTUBE') return null;

        const busy = claimingVideoId === video.id;
        const ownerVerified = youtubeState?.verifiedBy === 'OWNER';

        return (
            <label
                title={ownerVerified ? t('youtube.uploadOriginal') : t('youtube.uploadOriginalNeedsOwner')}
                className={`p-2 rounded-md transition-colors ${
                    ownerVerified && !busy
                        ? 'text-text-secondary hover:bg-surface-hover hover:text-primary cursor-pointer'
                        : 'text-text-muted opacity-50 cursor-not-allowed'
                }`}
            >
                {busy
                    ? <span className="text-xs">{originalUpload.progress}%</span>
                    : <Upload size={16} />}
                <input
                    type="file"
                    accept={acceptAttribute('videos')}
                    disabled={!ownerVerified || busy}
                    onChange={(e) => handleUpload(e, video)}
                    className="hidden"
                />
            </label>
        );
    };
}
