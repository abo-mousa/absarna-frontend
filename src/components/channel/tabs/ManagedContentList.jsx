import { useState } from 'react';
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
 * @param editable false for a type with no editor (a post is its own content; there is nothing to
 *                 open)
 */
export default function ManagedContentList({
    type, heading, content, getLabel, extraActions, editable = true,
}) {
    const [editing, setEditing] = useState(null);

    return (
        <>
            <div>
                <h3 className="text-lg font-bold mb-3">{heading}</h3>
                <ContentManageList
                    items={content.items}
                    loading={content.loading}
                    getLabel={getLabel}
                    onEdit={editable ? setEditing : undefined}
                    onToggleVisibility={content.toggleVisibility}
                    onDelete={content.deleteItem}
                    extraActions={extraActions}
                />
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
