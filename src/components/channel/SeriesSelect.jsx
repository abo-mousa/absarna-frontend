import { useState } from 'react';
import { Plus } from 'lucide-react';
import NewSeriesModal from './NewSeriesModal';
import { useChannelSeriesManage } from '@/hooks/useSeries';
import { t } from '@/i18n';

/**
 * Which series a video is in, with the way to make a new one beside it.
 *
 * <p>The upload form's picker used to list existing series only, and making one meant leaving the
 * form for the "by series" view — so a first upload met an empty list and no hint why. The
 * series made here is selected at once. `value` is the series id as a string, '' for none.
 */
function SeriesSelect({ slug, id, value, onChange, enabled = true }) {
    const { data: seriesList = [] } = useChannelSeriesManage(slug, enabled);
    const [creating, setCreating] = useState(false);

    return (
        <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <label htmlFor={id} className="font-semibold text-sm text-text-secondary">{t('channelManage.seriesSelectLabel')}</label>
                <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                    <Plus size={14} /> {t('channelManage.newSeriesHeading')}
                </button>
            </div>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-border outline-none focus:border-primary transition-colors bg-surface"
            >
                <option value="">{t('channelManage.seriesSelectNone')}</option>
                {seriesList.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.title}</option>
                ))}
            </select>
            <p className="text-xs text-text-muted mt-1">{t('channelManage.seriesJoinsAtEnd')}</p>
            <NewSeriesModal
                slug={slug}
                open={creating}
                onClose={() => setCreating(false)}
                onCreated={(series) => series?.id && onChange(String(series.id))}
            />
        </div>
    );
}

export default SeriesSelect;
