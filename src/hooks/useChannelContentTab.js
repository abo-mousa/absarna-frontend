import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useEmptyPageStepBack } from './useEmptyPageStepBack';
import { t } from '@/i18n';
import { describeError } from '@/lib/describeError';
import {
    useChannelContentList,
    useCreateChannelContent,
    useUpdateChannelContent,
    useToggleContentVisibility,
    useDeleteContent,
} from './useChannels';

/**
 * Everything one content tab of the channel dashboard needs: its list, its three mutations, and
 * the confirm/toast behaviour that used to be four near-identical closures in the page.
 *
 * <p>`ChannelManage` previously held sixteen hook calls — four types × (list, create, toggle,
 * delete) — plus `deleteItem`, `toggleVisibility` and a `showMessage` helper shared between them.
 * Four calls to this replace all of it, and each new content type is one more call rather than
 * four more hooks and another copy of the handlers.
 *
 * <p><b>Called unconditionally, once per type, exactly as before.</b> `active` only gates the
 * *query*, not the hook — a tab the user has not opened costs a disabled `useQuery`, not a
 * request. Making the call itself conditional would break the rules of hooks the moment someone
 * switched tabs.
 *
 * @param slug   the channel
 * @param type   `videos` | `books` | `articles` | `posts`, i.e. the API path segment
 * @param active whether this tab is the one on screen
 *
 * <p><b>The list is paged, and the page lives here</b> rather than in each tab, with the two rules
 * every tab needs: a publish goes back to page 1, where the new item is, and a delete that empties
 * the last page steps back to the page that is now last. `items` is the page on screen;
 * `totalItems` counts the whole list, for the heading.
 */
export function useChannelContentTab(slug, type, active) {
    const { showToast } = useToast();

    const [page, setPage] = useState(0);
    const { data, isLoading: loading } = useChannelContentList(slug, type, active, page);
    useEmptyPageStepBack(page, setPage, data, loading);
    const items = data?.content ?? [];
    const pageInfo = data ? {
        page: data.currentPage,
        totalPages: data.totalPages,
        hasNext: data.hasNext,
        hasPrevious: data.hasPrevious,
    } : null;
    const totalItems = data?.totalItems ?? 0;
    const create = useCreateChannelContent(slug, type);
    const update = useUpdateChannelContent(slug, type);
    const toggle = useToggleContentVisibility(slug, type);
    const remove = useDeleteContent(slug, type);

    /**
     * Creates one item, reporting the outcome.
     *
     * <p>`onSuccess` runs only after the server has accepted it — that is where a caller clears
     * its form state and, for an upload-backed type, forgets the resumable session.
     *
     * @param action a verb phrase for the failure message ("نشر الفيديو"), so the toast says
     *               which action failed rather than just that something did
     */
    const publish = async (payload, { action, successMessage, onSuccess }) => {
        try {
            await create.mutateAsync(payload);
            // Newest first, so the new item is at the top of page 1 — an owner on page 5 would
            // otherwise publish and see nothing change.
            setPage(0);
            onSuccess?.();
            showToast(successMessage, 'success');
        } catch (err) {
            showToast(publishFailureMessage(err, type, action), 'error');
        }
    };

    /**
     * Saves an edit, reporting the outcome.
     *
     * <p>Returns whether it succeeded so the caller can keep the dialog open on failure — closing
     * it would discard whatever the owner had typed.
     */
    const save = async (id, changes) => {
        try {
            await update.mutateAsync({ id, changes });
            showToast(t('channelManage.saved'), 'success');
            return true;
        } catch (err) {
            showToast(describeError(err, t('channelManage.saveFailed')), 'error');
            return false;
        }
    };

    const toggleVisibility = (item) => {
        toggle.mutate(item, {
            onError: () => showToast(t('channelManage.visibilityFailed'), 'error'),
        });
    };

    const deleteItem = (item) => {
        const label = item.title || (item.content ? `${item.content.substring(0, 40)}...` : '');
        if (!window.confirm(t('channelManage.deleteConfirm', { label }))) return;
        remove.mutate(item, {
            onSuccess: () => showToast(t('channelManage.deleted'), 'success'),
            onError: () => showToast(t('channelManage.deleteFailed'), 'error'),
        });
    };

    return { items, loading, pageInfo, totalItems, setPage, publish, save, toggleVisibility, deleteItem,
        isPublishing: create.isPending, isSaving: update.isPending };
}

/**
 * The types whose create call confirms a presigned upload, and is therefore <b>idempotent on the
 * upload session id</b>.
 *
 * <p>This set is what makes the timeout message below safe, and it must not grow casually. For
 * these two, a client-side timeout means the backend is probably still running
 * `CompleteMultipartUpload` on a multi-gigabyte object; pressing publish again returns the row the
 * first attempt created rather than duplicating it or re-uploading a byte. For an article or a
 * post there is no session and no idempotency, so "try again shortly" would invite a duplicate.
 */
const UPLOAD_BACKED = new Set(['videos', 'books']);

/**
 * <b>A confirm that times out is not a confirm that failed.</b> Saying "فشل" for an upload-backed
 * type tells the user to start a multi-gigabyte upload over, when what is actually needed is one
 * more click — so that case gets its own wording, and the caller deliberately leaves the session
 * id in form state so the retry is available.
 */
export function publishFailureMessage(err, type, action) {
    if (err.code === 'ECONNABORTED' && UPLOAD_BACKED.has(type)) {
        return t('channelManage.publishSlow', { action });
    }
    return t('channelManage.publishFailed', {
        action,
        reason: err.response?.data?.message || err.message,
    });
}

export default useChannelContentTab;
