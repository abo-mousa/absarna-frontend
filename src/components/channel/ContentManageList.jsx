import { Eye, EyeOff, Trash2, Pencil } from 'lucide-react';
import { t } from '@/i18n';

/**
 * The owner's list of their own items of one content type, with the hide/show and delete
 * controls. Shared by all four content tabs.
 *
 * <p>Shows hidden items, deliberately: this is the one place an owner can see what visitors
 * cannot, which is also why a still-transcoding video must keep appearing here (re-fetching this
 * list is the only way an owner learns a transcode finished — there is no notification channel).
 *
 * @param onEdit       opens the metadata editor; omitted for types with nothing to edit
 * @param getLabel     how to name an item, for a type with no title of its own (a post is its body)
 * @param extraActions optional render function for per-row actions only some types have — the
 *                     videos tab uses it for "upload the original file" on YouTube-backed rows.
 *                     A slot rather than a prop per action, so this component does not grow a
 *                     union of every content type's capabilities.
 */
function ContentManageList({ items, loading, onToggleVisibility, onDelete, onEdit,
                             getLabel = (item) => item.title, extraActions }) {
    if (loading) return <p className="text-sm text-text-muted py-2">{t('common.loading')}</p>;
    if (items.length === 0) return <p className="text-sm text-text-muted py-4">{t('channelManage.emptyContent')}</p>;

    return (
        <div className="grid gap-2">
            {items.map((item) => (
                <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-md border border-border-light ${
                        item.visible ? 'bg-surface' : 'bg-surface-hover'
                    }`}
                >
                    <div className="min-w-0">
                        <strong className={`block truncate ${item.visible ? '' : 'text-text-muted'}`}>{getLabel(item)}</strong>
                        {!item.visible && <span className="text-xs text-text-muted">{t('common.hiddenFromVisitors')}</span>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0 items-center">
                        {extraActions?.(item)}
                        {onEdit && (
                            <button
                                onClick={() => onEdit(item)}
                                title={t('channelManage.edit')}
                                aria-label={t('channelManage.edit')}
                                className="p-2 rounded-md text-text-secondary hover:bg-surface-hover hover:text-primary transition-colors"
                            >
                                <Pencil size={16} />
                            </button>
                        )}
                        <button
                            onClick={() => onToggleVisibility(item)}
                            title={item.visible ? t('common.hideFromVisitors') : t('common.showToVisitors')}
                            aria-label={item.visible ? t('common.hideFromVisitors') : t('common.showToVisitors')}
                            className="p-2 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        >
                            {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                            onClick={() => onDelete(item)}
                            title={t('common.delete')}
                            aria-label={t('common.delete')}
                            className="p-2 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ContentManageList;
