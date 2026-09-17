import { useRef, useState } from 'react';
import { ChevronLeft, Eye, EyeOff, Pencil, Plus, Trash2, Inbox } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input, Modal, Pager } from '@/components/ui';
import ContentPublishForm from './ContentPublishForm';
import ContentEditModal from './ContentEditModal';
import {
    useChannelSeriesManagePage,
    useCreateSeries,
    useDeleteSeries,
    useSetSeriesVisibility,
    useUpdateSeries,
} from '@/hooks/useSeries';
import { useEmptyPageStepBack } from '@/hooks/useEmptyPageStepBack';
import { useKeepScrollPlace } from '@/hooks/useKeepScrollPlace';
import { describeError } from '@/lib/describeError';
import { stripEmpty } from '@/lib/forms';
import { t } from '@/i18n';

/**
 * `'empty'`, `'hidden'`, `'partial'` or `'visible'` — what the owner's series row says about who
 * can see it, from the owner-only `contentCount` and `hiddenCount`.
 *
 * <p>A series has no visibility of its own: hiding one hides its videos. So "hidden" means every
 * video in it is, and a series with some of each is `'partial'` — which still offers "hide", since
 * something in it is public.
 */
export function seriesVisibility(series) {
    const count = series?.contentCount ?? 0;
    const hidden = series?.hiddenCount ?? 0;
    if (count === 0) return 'empty';
    if (hidden >= count) return 'hidden';
    return hidden > 0 ? 'partial' : 'visible';
}

const iconButton = 'p-2 rounded-md text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50';

/**
 * Edit, hide/show and delete for one series — on its row in the list, and above its videos once
 * opened.
 *
 * <p><b>Delete is two choices, in a dialog, the keeping one first.</b> "Delete the series" keeps
 * its videos, which only leave the series; "delete the series and its N videos" removes them for
 * good. For an imported channel the second is a whole course in one click, so it is never the
 * default and never a bare confirm().
 *
 * @param onChanged given the series as the server returned it after an edit or a visibility
 *                  change, so an opened series can redraw its own header
 * @param onDeleted called after either delete
 */
export function SeriesActions({ slug, series, onChanged, onDeleted }) {
    const { showToast } = useToast();
    const updateSeries = useUpdateSeries(slug);
    const setVisibility = useSetSeriesVisibility(slug);
    const deleteSeries = useDeleteSeries(slug);
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const state = seriesVisibility(series);
    const hiding = state !== 'hidden';

    const toggleVisibility = () => {
        setVisibility.mutate({ id: series.id, visible: !hiding }, {
            onSuccess: (updated) => {
                onChanged?.(updated);
                showToast(t(hiding ? 'channelManage.seriesView.hidden' : 'channelManage.seriesView.shown'), 'success');
            },
            onError: () => showToast(t('channelManage.seriesView.visibilityFailed'), 'error'),
        });
    };

    const save = async (id, changes) => {
        try {
            const updated = await updateSeries.mutateAsync({ id, changes });
            onChanged?.(updated);
            showToast(t('channelManage.seriesView.saved'), 'success');
            return true;
        } catch {
            showToast(t('channelManage.seriesView.saveFailed'), 'error');
            return false;
        }
    };

    const remove = (withVideos) => {
        deleteSeries.mutate({ id: series.id, withVideos }, {
            onSuccess: () => {
                setDeleting(false);
                showToast(t(withVideos ? 'channelManage.seriesView.deletedWithVideos' : 'channelManage.seriesDeleted'), 'success');
                onDeleted?.();
            },
            onError: () => showToast(t('channelManage.seriesDeleteFailed'), 'error'),
        });
    };

    return (
        <div className="flex gap-1 flex-shrink-0 items-center">
            <button
                type="button"
                onClick={() => setEditing(true)}
                title={t('channelManage.seriesView.edit')}
                aria-label={t('channelManage.seriesView.edit')}
                className={`${iconButton} hover:text-primary`}
            >
                <Pencil size={16} />
            </button>
            {state !== 'empty' && (
                <button
                    type="button"
                    onClick={toggleVisibility}
                    disabled={setVisibility.isPending}
                    title={t(hiding ? 'channelManage.seriesView.hide' : 'channelManage.seriesView.show')}
                    aria-label={t(hiding ? 'channelManage.seriesView.hide' : 'channelManage.seriesView.show')}
                    className={`${iconButton} hover:text-text-primary`}
                >
                    {hiding ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
            )}
            <button
                type="button"
                onClick={() => setDeleting(true)}
                title={t('channelManage.deleteSeries')}
                aria-label={t('channelManage.deleteSeries')}
                className="p-2 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
            >
                <Trash2 size={16} />
            </button>

            <ContentEditModal
                open={editing}
                type="series"
                item={editing ? series : null}
                onClose={() => setEditing(false)}
                onSave={save}
                saving={updateSeries.isPending}
            />

            <Modal
                open={deleting}
                onClose={() => setDeleting(false)}
                title={t('channelManage.seriesView.deleteTitle', { title: series.title })}
                maxWidth="480px"
            >
                <div className="grid gap-4">
                    <div>
                        <Button variant="outline" onClick={() => remove(false)} disabled={deleteSeries.isPending}>
                            {t('channelManage.seriesView.deleteKeep')}
                        </Button>
                        <p className="text-sm text-text-muted mt-1.5">{t('channelManage.seriesView.deleteKeepHint')}</p>
                    </div>
                    {(series.contentCount ?? 0) > 0 && (
                        <div className="pt-4 border-t border-border-light">
                            <Button variant="danger" onClick={() => remove(true)} disabled={deleteSeries.isPending}>
                                {t('channelManage.seriesView.deleteWithVideos', { count: series.contentCount })}
                            </Button>
                            <p className="text-sm text-text-muted mt-1.5">{t('channelManage.seriesView.deleteWithVideosHint')}</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

/** What a series row says under its title: its size, and who can see it. */
function SeriesSummary({ series }) {
    const state = seriesVisibility(series);
    return (
        <span className="text-xs text-text-muted">
            {t('common.videoCount', { count: series.contentCount ?? 0 })}
            {state === 'hidden' && ` · ${t('channelManage.seriesView.allHidden')}`}
            {state === 'partial' && ` · ${t('channelManage.seriesView.someHidden', {
                hidden: series.hiddenCount, count: series.contentCount,
            })}`}
        </span>
    );
}

/**
 * Creates a series, in a dialog opened from the videos section's header.
 *
 * <p>A dialog rather than a form above the list: the series view is for finding a course and
 * working on its videos, and a create form stacked on top of it pushed the list down the page for
 * something done once per course.
 */
export function NewSeriesModal({ slug, open, onClose }) {
    const { showToast } = useToast();
    const createSeries = useCreateSeries(slug);
    const [form, setForm] = useState({ title: '', description: '' });

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createSeries.mutateAsync(stripEmpty(form));
            setForm({ title: '', description: '' });
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
        </Modal>
    );
}

/**
 * The videos section, browsed by series: the channel's series a page at a time, and a way into
 * each one to work on its videos. Creating a series is {@link NewSeriesModal}.
 *
 * <p>Series used to be a dashboard tab of their own, apart from the videos they hold, with a
 * delete and nothing else. They live where their videos do now.
 *
 * <p><b>The «فيديوهات بلا سلسلة» entry comes first and is always there.</b> Plenty of videos are
 * in no series — uploads never assigned to one, imports found in no playlist — and a view organised
 * by series would otherwise lose every one of them. First rather than after the last series,
 * because on a channel with pages of series "after the last" is several pages away.
 *
 * @param onOpen given a series, or `'none'` for the videos in no series
 */
export default function SeriesBrowser({ slug, active, onOpen }) {
    const [page, setPage] = useState(0);
    const { data, isLoading } = useChannelSeriesManagePage(slug, page, active);
    useEmptyPageStepBack(page, setPage, data, isLoading);
    const seriesList = data?.content ?? [];
    const listRef = useRef(null);
    const [heldHeight, holdPlace] = useKeepScrollPlace(listRef);

    const rowClass = 'flex items-center justify-between gap-3 p-3 rounded-md border border-border-light';
    const openClass = 'flex items-center gap-3 min-w-0 flex-1 text-right rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary';

    return (
        <div style={heldHeight ? { minHeight: heldHeight } : undefined}>
            <div ref={listRef}>
                <h3 className="text-lg font-bold mb-3">
                    {t('channelManage.seriesListHeading', { count: data?.totalItems ?? 0 })}
                </h3>

                <div className="grid gap-2">
                    <div className={`${rowClass} bg-surface-hover`}>
                        <button type="button" onClick={() => onOpen('none')} className={openClass}>
                            <Inbox size={18} className="text-text-muted flex-shrink-0" />
                            <div className="min-w-0">
                                <strong className="block truncate">{t('channelManage.seriesView.noSeries')}</strong>
                                <span className="text-xs text-text-muted">{t('channelManage.seriesView.noSeriesHint')}</span>
                            </div>
                        </button>
                        <ChevronLeft size={18} className="text-text-muted flex-shrink-0" />
                    </div>

                    {isLoading ? (
                        <p className="text-sm text-text-muted py-2">{t('common.loading')}</p>
                    ) : seriesList.length === 0 ? (
                        <p className="text-sm text-text-muted py-4">{t('series.emptyOnChannel')}</p>
                    ) : (
                        seriesList.map((series) => (
                            <div
                                key={series.id}
                                className={`${rowClass} ${seriesVisibility(series) === 'hidden' ? 'bg-surface-hover' : 'bg-surface'}`}
                            >
                                <button type="button" onClick={() => onOpen(series)} className={openClass}>
                                    <div className="min-w-0">
                                        <strong className="block truncate hover:text-primary">{series.title}</strong>
                                        <SeriesSummary series={series} />
                                    </div>
                                </button>
                                <SeriesActions slug={slug} series={series} />
                            </div>
                        ))
                    )}
                </div>

                {data && (
                    <Pager
                        page={data.currentPage}
                        totalPages={data.totalPages}
                        hasPrevious={data.hasPrevious}
                        hasNext={data.hasNext}
                        onChange={(next) => {
                            // Stays where it is — see ManagedContentList's changePage.
                            holdPlace();
                            setPage(next);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
