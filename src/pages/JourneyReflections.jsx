import { useState } from 'react';
import { Link } from 'react-router-dom';
import { NotebookPen, Trash2 } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { PageHeader, QueryState, Button } from '../components/ui';
import { JourneyNav, PausedLine, SacredText } from '../components/journey';
import { useDeleteReflection, useReflections } from '../hooks/useReflections';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { currentLocaleInfo, t } from '@/i18n';
import { describeError } from '@/lib/describeError';
import { formatTimestamp } from '@/lib/spans';

/**
 * «خواطري» — what the reader wrote down after an episode or a book, newest first
 * (PROGRESS-AND-GOALS.md §6.12). Theirs alone: no count, no share, nothing suggested from it. The
 * page's texts are the moment's (§8.1 `benefits`): al-'Alaq 4 and the Prophet's ﷺ «اكتب».
 */
function JourneyReflections() {
    usePageMeta({ title: t('journey.nav.reflections') });
    const reflections = useReflections();
    const remove = useDeleteReflection();
    const { showToast } = useToast();
    const rows = reflections.data?.pages.flat() || [];
    // Which line is asking "delete?" — a written thought takes a second tap, never one.
    const [confirming, setConfirming] = useState(null);
    const dateOf = (iso) => new Intl.DateTimeFormat(currentLocaleInfo().numberFormat, { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(iso));

    return (
        <PageShell tab>
            <PageHeader title={t('journey.nav.reflections')} action={<JourneyNav />} tabs />
            <div className="flex flex-col gap-8 max-w-[760px]">
                <PausedLine where="journey" />
                <div className="flex flex-col gap-4">
                    <SacredText moment="benefits" kind="AYAH" />
                    <p className="text-sm text-text-secondary">{t('journey.reflections.intro')}</p>
                </div>
                <QueryState
                    isLoading={reflections.isLoading}
                    isError={reflections.isError}
                    error={reflections.error}
                    onRetry={reflections.refetch}
                    errorTitle={t('journey.loadFailed')}
                    isEmpty={rows.length === 0}
                    emptyIcon={NotebookPen}
                    emptyTitle={t('journey.reflections.emptyTitle')}
                    emptyDescription={t('journey.reflections.emptyText')}
                >
                    <ol className="flex flex-col gap-4">
                        {rows.map((row) => {
                            const href = row.kind === 'BOOK'
                                ? `/books/${row.itemId}`
                                : `/video/${row.itemId}${row.position ? `?t=${row.position}` : ''}`;
                            return (
                                <li key={row.id} className="group relative p-4 rounded-lg border border-border-light bg-surface">
                                    <blockquote dir="auto" className="font-reading text-[1.1rem] leading-relaxed pe-8">{row.text}</blockquote>
                                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-text-muted">
                                        <span>{dateOf(row.createdAt)}</span>
                                        {row.itemTitle && (
                                            <>
                                                <span aria-hidden="true">·</span>
                                                <Link to={href} dir="auto" className="font-semibold truncate max-w-[24rem]">{row.itemTitle}</Link>
                                                {row.kind === 'VIDEO' && row.position > 0 && (
                                                    <span dir="ltr">{formatTimestamp(row.position)}</span>
                                                )}
                                                {row.kind === 'BOOK' && row.position > 0 && (
                                                    <span>{t('today.pageShort', { page: row.position })}</span>
                                                )}
                                            </>
                                        )}
                                    </p>
                                    <DeleteButton
                                        confirming={confirming === row.id}
                                        onAsk={() => setConfirming(row.id)}
                                        onCancel={() => setConfirming(null)}
                                        onConfirm={() => remove.mutate(row.id, {
                                            onSuccess: () => { setConfirming(null); showToast(t('journey.reflections.deleted'), 'success'); },
                                            onError: (error) => showToast(describeError(error, t('journey.today.actionFailed')), 'error'),
                                        })}
                                    />
                                </li>
                            );
                        })}
                    </ol>
                    {reflections.hasNextPage && (
                        <div className="flex justify-center mt-6">
                            <Button variant="outline" onClick={() => reflections.fetchNextPage()} disabled={reflections.isFetchingNextPage}>
                                {t('journey.reflections.more')}
                            </Button>
                        </div>
                    )}
                </QueryState>
                <SacredText moment="benefits" kind="HADITH" size="sm" />
            </div>
        </PageShell>
    );
}

/**
 * The trash icon asks before it deletes: on a phone it is always visible and a stray tap would
 * take a line the reader cannot get back. Quiet until the card is hovered on a pointer screen.
 */
function DeleteButton({ confirming, onAsk, onCancel, onConfirm }) {
    if (confirming) {
        return (
            <span className="absolute top-3 end-3 flex items-center gap-2 text-xs">
                <button type="button" onClick={onConfirm} className="font-semibold text-red-600 dark:text-red-400 hover:underline">
                    {t('journey.reflections.confirmDelete')}
                </button>
                <button type="button" onClick={onCancel} className="text-text-muted hover:text-text-primary">
                    {t('common.cancel')}
                </button>
            </span>
        );
    }
    return (
        <button
            type="button"
            onClick={onAsk}
            aria-label={t('journey.reflections.delete')}
            title={t('journey.reflections.delete')}
            className="absolute top-3 end-3 flex items-center justify-center w-8 h-8 rounded-full text-text-muted
                hover:text-text-primary hover:bg-surface-hover
                [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100
                [@media(hover:hover)]:focus-visible:opacity-100 transition-opacity"
        >
            <Trash2 size={15} aria-hidden="true" />
        </button>
    );
}

export default JourneyReflections;
