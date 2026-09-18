import { Bookmark } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBookmarkStatus, useToggleBookmark } from '../../hooks/useBookmarks';
import { t } from '@/i18n';

/**
 * "Read/watch later" toggle — reusable across video/book/article detail pages. `type` is the same
 * 'video'|'book'|'article' string CommentsSection/useComments already use elsewhere.
 *
 * <p>Disabled rather than hidden for a visitor with no account, like LikeButton beside it: the row
 * of actions under a video keeps its shape whoever is reading, and the reason a control cannot be
 * pressed is on the control itself rather than discovered by pressing it.
 */
function BookmarkButton({ type, id, className = '', size = 18, labeled = false }) {
    const { token } = useAuth();
    const { data: bookmarked = false } = useBookmarkStatus(type, id, !!token);
    const toggleBookmark = useToggleBookmark(type, id);

    const needsLogin = !token;
    const handleClick = () => toggleBookmark.mutate(bookmarked);

    const label = bookmarked ? t('bookmarks.remove') : t('bookmarks.add');
    // See LikeButton: `:hover` still matches a disabled element, so the hover colour has to go
    // with the press rather than stay behind promising one.
    const tone = needsLogin
        ? 'text-text-muted'
        : (bookmarked ? 'text-gold' : 'text-text-secondary hover:text-gold');

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={needsLogin || toggleBookmark.isPending}
            title={needsLogin ? t('common.loginRequired') : label}
            aria-label={needsLogin ? t('common.loginRequired') : label}
            aria-pressed={bookmarked}
            className={`inline-flex items-center gap-1.5 font-semibold text-sm transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed ${tone} ${className}`}
        >
            <Bookmark size={size} fill={bookmarked ? 'currentColor' : 'none'} />
            {labeled && <span>{label}</span>}
        </button>
    );
}

export default BookmarkButton;
