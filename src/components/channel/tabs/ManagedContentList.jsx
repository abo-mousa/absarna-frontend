import { useRef, useState } from 'react';
import { Pager } from '@/components/ui';
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
    type, heading, content, getLabel, getHref, extraActions, renderStatus, editable = true, action,
}) {
    const [editing, setEditing] = useState(null);
    const listRef = useRef(null);

    const changePage = (page) => {
        content.setPage(page);
        // The pager is under twenty rows; without this the owner lands at the bottom of the next
        // page and has to scroll back up to its first item.
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <>
            <div ref={listRef} className="scroll-mt-[76px]">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <h3 className="text-lg font-bold">{heading}</h3>
                    {action}
                </div>
                <ContentManageList
                    items={content.items}
                    loading={content.loading}
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

            {editable && (
                <ContentEditModal
                    open={!!editing}
                    type={type}
                    item={editing}
                    onClose={() => setEditing(null)}
                    onSave={(id, changes) => content.save(id, changes)}
                    saving={content.isSaving}
                />
            )}
        </>
    );
}
