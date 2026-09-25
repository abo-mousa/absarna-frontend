import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { useBookDownloadUrl } from '@/hooks/useMediaUrl';

/**
 * A button that DOWNLOADS the book — the file is saved and the reader stays where they are. It used
 * to be a link to the PDF in a new tab (a cross-origin `download` attribute is ignored, so the
 * browser showed the file instead of saving it) and, before the URL had arrived, to the book's
 * page, which is not what a button called «تحميل» promises.
 *
 * <p>The URL is a bearer credential, so it is minted on intent (pointer-enter, focus, press), not
 * per rendered card. A click that lands first waits for it: following an attachment in place needs
 * no popup, so there is nothing for the browser to block and the wait is harmless. A book whose
 * file is external (`attachment: false`) cannot be made a download; it opens in a tab of its own,
 * pre-opened inside the click so it is not blocked. A 404 takes the button away.
 */
function BookDownloadButton({ bookId, className = '', iconSize = 15, children }) {
    const [intent, setIntent] = useState(false);
    const { data: target, isError } = useBookDownloadUrl(bookId, intent);
    const pending = useRef(null); // 'here', or the pre-opened tab for an external file

    useEffect(() => {
        const waiting = pending.current;
        if (!waiting) return;
        if (target) {
            pending.current = null;
            if (waiting === 'here') {
                if (target.attachment) window.location.assign(target.url);
                else window.open(target.url, '_blank', 'noopener');
            } else {
                waiting.opener = null;
                waiting.location.replace(target.url);
            }
        } else if (isError || target === null) {
            if (waiting !== 'here') waiting.close();
            pending.current = null;
        }
    }, [target, isError]);

    // A tab still waiting when the button goes away would be left blank for good.
    useEffect(() => () => {
        if (pending.current && pending.current !== 'here') pending.current.close();
        pending.current = null;
    }, []);

    if (isError || target === null) return null;

    const onClick = () => {
        setIntent(true);
        if (target) {
            if (target.attachment) window.location.assign(target.url);
            else window.open(target.url, '_blank', 'noopener');
            return;
        }
        // Not known yet whether it will be ours or external. Ours is the case that matters (every
        // uploaded book), and it needs no tab — so wait in place.
        pending.current = 'here';
    };

    return (
        <button
            type="button"
            onPointerEnter={() => setIntent(true)}
            onFocus={() => setIntent(true)}
            onPointerDown={() => setIntent(true)}
            onClick={onClick}
            className={`flex items-center justify-center gap-1.5 font-semibold ${className}`}
        >
            <Download size={iconSize} /> {children}
        </button>
    );
}

export default BookDownloadButton;
