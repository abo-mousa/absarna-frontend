import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui';
import ContentPublishForm from '../ContentPublishForm';
import { useChannelSeriesManage, useCreateSeries, useDeleteSeries } from '@/hooks/useSeries';
import { stripEmpty } from '@/lib/forms';
import { t } from '@/i18n';

export default function SeriesTab({ slug, active }) {
    const { showToast } = useToast();
    const { data: seriesList = [], isLoading } = useChannelSeriesManage(slug, active);
    const createSeries = useCreateSeries(slug);
    const deleteSeries = useDeleteSeries(slug);
    const [form, setForm] = useState({ title: '', description: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createSeries.mutateAsync(stripEmpty(form));
            setForm({ title: '', description: '' });
            showToast(t('channelManage.seriesCreated'), 'success');
        } catch (err) {
            showToast(t('channelManage.seriesCreateFailed', {
                reason: err.response?.data?.message || err.message,
            }), 'error');
        }
    };

    const handleDelete = (series) => {
        if (!window.confirm(t('channelManage.deleteSeriesConfirm', { title: series.title }))) return;
        deleteSeries.mutate(series.id, {
            onSuccess: () => showToast(t('channelManage.seriesDeleted'), 'success'),
            onError: () => showToast(t('channelManage.seriesDeleteFailed'), 'error'),
        });
    };

    return (
        <div className="grid gap-6">
            <ContentPublishForm
                heading={t('channelManage.newSeriesHeading')}
                onSubmit={handleSubmit}
                submitLabel={t('channelManage.createSeries')}
                submitIcon={<Plus size={18} />}
            >
                <Input
                    label={t('channelManage.seriesTitleLabel')}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                />
                <Input
                    label={t('fields.description')}
                    textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
            </ContentPublishForm>

            <div>
                <h3 className="text-lg font-bold mb-3">{t('channelManage.seriesListHeading', { count: seriesList.length })}</h3>
                {isLoading ? (
                    <p className="text-sm text-text-muted py-2">{t('common.loading')}</p>
                ) : seriesList.length === 0 ? (
                    <p className="text-sm text-text-muted py-4">{t('series.emptyOnChannel')}</p>
                ) : (
                    <div className="grid gap-2">
                        {seriesList.map((s) => (
                            <div
                                key={s.id}
                                className="flex items-center justify-between gap-3 p-3 rounded-md border border-border-light bg-surface"
                            >
                                <div className="min-w-0">
                                    <strong className="block truncate">{s.title}</strong>
                                    <span className="text-xs text-text-muted">{t('common.videoCount', { count: s.contentCount ?? 0 })}</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(s)}
                                    title={t('channelManage.deleteSeries')}
                                    aria-label={t('channelManage.deleteSeries')}
                                    className="p-2 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors flex-shrink-0"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
