import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';

// Plain-text platform links, not brand icons — lucide-react ships no brand marks (and the
// app already deliberately avoids per-row icons elsewhere, see SearchBar's suggestion-row
// comment), so a labeled pill reads clearer here than an approximated logo would.
const shareTargets = (url, title) => [
    { label: 'واتساب', href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { label: 'تيليجرام', href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
];

function formatTimestamp(seconds) {
    const total = Math.floor(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

// Reusable share sheet — copy-link, native share-sheet (mobile/supported browsers), and a
// few quick social links, dropped into a detail page's header next to BookmarkButton. Link
// previews come for free from usePageMeta's per-page OG/Twitter tags, already wired into
// every page this is used on — this component is just the "get the link out" UI on top.
// `getCurrentTime`, passed only from VideoDetail, is VideoPlayer's imperative-ref method
// (not React state) so reading the playhead costs nothing until the sheet is actually opened.
function ShareButton({ title, path, getCurrentTime, className = '', size = 18 }) {
    const { showToast } = useToast();
    const [open, setOpen] = useState(false);
    const [includeTime, setIncludeTime] = useState(false);
    const [copied, setCopied] = useState(false);
    const [timestamp, setTimestamp] = useState(0);

    const baseUrl = `${window.location.origin}${path}`;
    const url = includeTime && timestamp > 0 ? `${baseUrl}?t=${Math.floor(timestamp)}` : baseUrl;

    const handleOpen = () => {
        if (getCurrentTime) setTimestamp(getCurrentTime());
        setCopied(false);
        setOpen(true);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            showToast('تم نسخ الرابط', 'success');
        } catch {
            showToast('تعذر نسخ الرابط', 'error');
        }
    };

    const handleNativeShare = () => {
        navigator.share({ title, url }).catch(() => {
            // Cancelling the native sheet (or the browser refusing) rejects the promise too —
            // neither is an error worth surfacing.
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                title="مشاركة"
                aria-label="مشاركة"
                className={`inline-flex items-center gap-1.5 font-semibold text-sm text-text-secondary hover:text-primary transition-colors ${className}`}
            >
                <Share2 size={size} />
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="مشاركة" maxWidth="420px">
                <div className="flex items-center gap-2 mb-4">
                    <input
                        readOnly
                        value={url}
                        onFocus={(e) => e.target.select()}
                        aria-label="رابط المشاركة"
                        dir="ltr"
                        className="flex-1 min-w-0 px-3 py-2 rounded-md border border-border bg-surface-hover text-sm text-text-secondary"
                    />
                    <button
                        onClick={handleCopy}
                        title="نسخ الرابط"
                        aria-label="نسخ الرابط"
                        className="p-2.5 rounded-md bg-primary text-white flex-shrink-0"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>

                {getCurrentTime && (
                    <label className="flex items-center gap-2 mb-4 text-sm text-text-secondary cursor-pointer w-fit">
                        <input
                            type="checkbox"
                            checked={includeTime}
                            onChange={(e) => setIncludeTime(e.target.checked)}
                            className="accent-primary"
                        />
                        مشاركة من الدقيقة {formatTimestamp(timestamp)}
                    </label>
                )}

                {canNativeShare && (
                    <button
                        onClick={handleNativeShare}
                        className="w-full mb-4 py-2.5 bg-primary-light text-primary rounded-md font-semibold text-sm"
                    >
                        مشاركة عبر التطبيقات
                    </button>
                )}

                <div className="flex gap-2 flex-wrap">
                    {shareTargets(url, title).map((t) => (
                        <a
                            key={t.label}
                            href={t.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-full bg-surface-hover text-text-secondary text-sm font-semibold hover:text-text-primary transition-colors"
                        >
                            {t.label}
                        </a>
                    ))}
                </div>
            </Modal>
        </>
    );
}

export default ShareButton;
