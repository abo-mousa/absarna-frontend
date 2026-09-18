import { useRef, useState } from 'react';
import { Pager, SearchField } from '@/components/ui';
import { t } from '@/i18n';
import { useKeepScrollPlace } from '@/hooks/useKeepScrollPlace';
import ContentManageList from '../ContentManageList';
import ContentEditModal from '../ContentEditModal';

/**
 * What one content tab shows below its publish form: the list of what is already there, and the
 * editor a row opens.
 *
 * <p>The two belong together — the modal exists only to edit a row from this list, and holding
 * `editing` here is what keeps every tab from repeating the same state, the same `onSave` and the
 * same `saving` wiring.
 *
 * @param content  a `useChannelContentTab` result
 * @param getHref  optional, see ContentManageList
 * @param action   optional element beside the heading — the tab's "add" button, which opens its
 *                 form in a dialog so the list, not a form, is what the tab opens onto
 * @param editable false for a type with no editor (a post is its own content; there is nothing to
 *                 open)
 */
export default function ManagedContentList({
    type, heading, content, getLabel, getHref, extraActions, renderStatus, editable = true, action, slug,
    searchable = false, searchPlaceholder,
}) {
    const [editing, setEditing] = useState(null);
    const listRef = useRef(null);
    const [heldHeight, holdPlace] = useKeepScrollPlace(listRef);

    // The page stays where it is: no scrolling to the top of the list. A last page shorter than
    // the one before would otherwise shrink the document and pull the pager out from under the
    // click, so the height is held through the change (useKeepScrollPlace).
    const changePage = (page) => {
        holdPlace();
        content.setPage(page);
    };

    return (
        <>
            {/* Inline style: the held height is a runtime value, which Tailwind cannot see. */}
            <div style={heldHeight ? { minHeight: heldHeight } : undefined}>
                <div ref={listRef}>
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                        <h3 className="text-lg font-bold">{heading}</h3>
                        {action}
                    </div>

                    {/* Offered once the list is long enough that scanning it is the slow way, and
                        kept mounted while a term matches nothing — otherwise the box that produced
                        the empty state disappears with the results and there is no way back.
                        `searchable` is off for a list already narrowed by series: see the videos
                        endpoint on why text and series are not combined. */}
                    {searchable && (content.items.length > 0 || content.search) && (
                        <div className="mb-3 max-w-md">
                            <SearchField
                                value={content.search}
                                onChange={content.setSearch}
                                placeholder={searchPlaceholder || t('channelManage.searchContent')}
                            />
                        </div>
                    )}

                    <ContentManageList
                        items={content.items}
                        loading={content.loading}
                        emptyLabel={content.term ? t('channelManage.searchNoMatches') : undefined}
                        getLabel={getLabel}
                        getHref={getHref}
                        onEdit={editable ? setEditing : undefined}
                        onToggleVisibility={content.toggleVisibility}
                        onDelete={content.deleteItem}
                        extraActions={extraActions}
                        renderStatus={renderStatus}
                    />
                    {content.pageInfo && (
                        <Pager
                            page={content.pageInfo.page}
                            totalPages={content.pageInfo.totalPages}
                            hasPrevious={content.pageInfo.hasPrevious}
                            hasNext={content.pageInfo.hasNext}
                            onChange={changePage}
                        />
                    )}
                </div>
            </div>

            {editable && (
                <ContentEditModal
                    open={!!editing}
                    type={type}
                    item={editing}
                    onClose={() => setEditing(null)}
                    onSave={(id, changes) => content.save(id, changes)}
                    saving={content.isSaving}
                    slug={slug}
                />
            )}
        </>
    );
}
