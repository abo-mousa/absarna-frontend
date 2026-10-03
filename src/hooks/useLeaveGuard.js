import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirmation } from './useConfirmation';
import { t } from '@/i18n';

/**
 * Where a click is about to take this tab, or null when it is not leaving the page.
 *
 * <p>Null for anything that keeps the page mounted: a link opened in a new tab or window (a
 * modifier key, a middle click, `target="_blank"`), a download, and a link to the page already
 * open. Null for another origin too — that is a document unload, and `beforeunload` asks.
 */
export function leavingHref(event, location) {
    if (event.defaultPrevented || event.button !== 0
        || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor || anchor.hasAttribute('download')) return null;
    const target = anchor.getAttribute('target');
    if (target && target !== '_self') return null;
    let url;
    try {
        url = new URL(anchor.getAttribute('href'), location.href);
    } catch {
        return null;
    }
    if (url.origin !== location.origin || url.pathname === location.pathname) return null;
    return url.pathname + url.search + url.hash;
}

/**
 * Asks before the page is left while `active` — an upload is on its way, and leaving stops it.
 *
 * <p>Two doors. Closing or reloading the tab is `beforeunload`, where the browser shows its own
 * wording. A link inside the app unloads nothing, so it is caught as a click, before the router
 * sees it, and asked about in our own dialog; "leave" then goes where the link pointed. The
 * browser's Back button is not caught: this router has no blocker, and Back cannot be un-pressed.
 *
 * @returns the props for a `<ConfirmDialog>` the caller renders once
 */
export function useLeaveGuard(active) {
    const navigate = useNavigate();
    const [ask, dialog] = useConfirmation();

    useEffect(() => {
        if (!active) return undefined;
        const onUnload = (event) => {
            event.preventDefault();
            // Chrome shows nothing without it.
            event.returnValue = '';
        };
        const onClick = async (event) => {
            const href = leavingHref(event, window.location);
            if (!href) return;
            // Now, before any await: the router reads `defaultPrevented` in this same dispatch.
            event.preventDefault();
            const leave = await ask(t('channelManage.forms.leaveDuringUpload.title'), {
                body: t('channelManage.forms.leaveDuringUpload.body'),
                confirmLabel: t('channelManage.forms.leaveDuringUpload.confirm'),
                cancelLabel: t('channelManage.forms.leaveDuringUpload.stay'),
                danger: true,
            });
            if (leave) navigate(href);
        };
        window.addEventListener('beforeunload', onUnload);
        // Capture, on the document: ahead of React's own listener at the root.
        document.addEventListener('click', onClick, true);
        return () => {
            window.removeEventListener('beforeunload', onUnload);
            document.removeEventListener('click', onClick, true);
        };
    }, [active, ask, navigate]);

    return dialog;
}

export default useLeaveGuard;
