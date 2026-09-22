import { Link } from 'react-router-dom';
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
 * @param getHref      optional — the item's public page, which its title then links to, or null for
 *                     an item with nothing to show there yet. Opens in a NEW browser tab, and that
 *                     is not a preference: leaving this page cancels an upload in progress (see
 *                     useChannelUpload), so a same-tab link clicked mid-way through a 2 GB lecture
 *                     would abort it. Omitted for posts, which have no page of their own.
 * @param emptyLabel   what to say when the list is empty, when the caller knows something this
 *                     component does not — most of all that a search term is narrowing it. "لا
 *                     يوجد محتوى بعد" under an active filter is a false statement about the
 *                     channel, and the one an owner would act on by re-uploading something they
 *                     already have.
 * @param renderStatus optional render function for a block UNDER a row's title, for whatever that
 *                     content type has to say about its own state. A second slot rather than an
 *                     extension of `extraActions`, because the two sit in different places and
 *                     have different shapes: an action is an icon in the row's trailing controls,
 *                     while a status is prose and may be several lines. The videos tab uses it for
 *                     the transcode state and the moderation verdicts — <b>a held video is READY,
 *                     visible and reachable by nobody</b>, and this list is the screen its owner
 *                     actually opens, so until now the home feed showed them a badge and the
 *                     dashboard showed them nothing.
 */
function ContentManageList({ items, loading, onToggleVisibility, onDelete, onEdit,
                             getLabel = (item) => item.title, getHref, extraActions, renderStatus,
                             emptyLabel }) {
    if (loading) return <p className="text-sm text-text-muted py-2">{t('common.loading')}</p>;
    if (items.length === 0) {
        return <p className="text-sm text-text-muted py-4">{emptyLabel || t('channelManage.emptyContent')}</p>;
    }

    return (
        <div className="grid gap-2">
            {items.map((item) => (
                <div
                    key={item.id}
                    // `items-start`, not `items-center`: a row can now carry a status block
                    // several lines tall (a transcode failure and its retry button), and centring
                    // that would float the trailing icons into the middle of the paragraph.
                    className={`flex items-start justify-between gap-3 p-3 rounded-md border border-border-light ${
                        item.visible ? 'bg-surface' : 'bg-surface-hover'
                    }`}
                >
                    {/* `dir="auto"` ON THE WHOLE ITEM BLOCK, not just the title. Two things
                        depend on it. The title is `truncate`d, and an RTL run clipped inside an
                        LTR block puts its ellipsis at the physical right — which for Arabic is the
                        BEGINNING of the sentence, so a long title lost «السيرة النبوية | 103» and
                        kept the speaker's name. That is content loss, not a nicety. And the block
                        rather than the title alone keeps the status badge under it in the same
                        direction, so a row never reads half one way and half the other. An item
                        whose title is Latin resolves `ltr` and is unaffected. */}
                    <div dir="auto" className="min-w-0">
                        <strong className={`block truncate ${item.visible ? '' : 'text-text-muted'}`}>
                            {getHref?.(item) ? (
                                <Link
                                    to={getHref(item)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                                >
                                    {getLabel(item)}
                                    <span className="sr-only"> {t('common.opensInNewTab')}</span>
                                </Link>
                            ) : getLabel(item)}
                        </strong>
                        {!item.visible && <span className="text-xs text-text-muted">{t('common.hiddenFromVisitors')}</span>}
                        {renderStatus?.(item)}
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
