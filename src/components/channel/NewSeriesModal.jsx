import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Input, Modal } from '@/components/ui';
import ContentPublishForm from './ContentPublishForm';
import { useCreateSeries } from '@/hooks/useSeries';
import { useChannel } from '@/hooks/useChannels';
import { describeError } from '@/lib/describeError';
import { stripEmpty } from '@/lib/forms';
import SubjectPicker from '@/components/content/SubjectPicker';
import { t } from '@/i18n';

/**
 * Creates a series, in a dialog opened from the videos section's header.
 *
 * <p>A dialog rather than a form above the list: the series view is for finding a course and
 * working on its videos, and a create form stacked on top of it pushed the list down the page for
 * something done once per course. Also opened from the series picker in the upload and edit
 * forms (`SeriesSelect`), which is why it lives in a file of its own: the edit dialog cannot
 * import the series browser, which imports it.
 */
export default function NewSeriesModal({ slug, open, onClose, onCreated }) {
    const { showToast } = useToast();
    const createSeries = useCreateSeries(slug);
    const [form, setForm] = useState({ title: '', description: '', subject: '' });
    const { data: channel } = useChannel(slug, open);

    const handleCreate = async (e) => {
        e.preventDefault();
        // Stopped here: this dialog is portalled to <body>, but React bubbles a submit along the
        // COMPONENT tree, and the series picker renders it inside the upload and edit forms — so
        // without this, creating a series also submitted the video form around it.
        e.stopPropagation();
        try {
            const created = await createSeries.mutateAsync(stripEmpty(form));
            setForm({ title: '', description: '', subject: '' });
            // The picker that opened this selects what it just made.
            onCreated?.(created);
            showToast(t('channelManage.seriesCreated'), 'success');
            onClose();
        } catch (err) {
            showToast(t('channelManage.seriesCreateFailed', { reason: describeError(err) }), 'error');
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={t('channelManage.newSeriesHeading')} maxWidth="560px">
            <ContentPublishForm
                bare
                onSubmit={handleCreate}
                submitLabel={t('channelManage.createSeries')}
                submitIcon={<Plus size={18} />}
                submitting={createSeries.isPending}
                error={createSeries.error}
            >
                <Input
                    label={t('channelManage.seriesTitleLabel')}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    field="title"
                />
                <Input
                    label={t('fields.description')}
                    textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    field="description"
                />
                <div>
                    <SubjectPicker
                        id="new-series-subject"
                        value={form.subject || null}
                        onChange={(subject) => setForm((current) => ({ ...current, subject: subject || '' }))}
                        inherited={channel?.defaultSubject ? { code: channel.defaultSubject, from: 'channel' } : null}
                    />
                    <p className="text-xs text-text-muted mt-1.5">{t('subjects.seriesHint')}</p>
                </div>
            </ContentPublishForm>
        </Modal>
    );
}
