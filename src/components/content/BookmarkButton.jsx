import { Bookmark, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSignInPrompt } from '../../contexts/SignInPromptContext';
import { useBookmarkStatus, useToggleBookmark } from '../../hooks/useBookmarks';
import { t } from '@/i18n';

/**
 * "Read/watch later" toggle — reusable across video/book/article detail pages. `type` is the same
 * 'video'|'book'|'article' string CommentsSection/useComments already use elsewhere.
 *
 * <p>Locked rather than hidden for a visitor with no account, like LikeButton beside it: the row
 * of actions under a video keeps its shape whoever is reading, the lock says it needs an account,
 * and a press opens the sign-in popup rather than doing nothing.
 */
function BookmarkButton({ type, id, className = '', size = 18, labeled = false }) {
    const { token } = useAuth();
    const { promptSignIn } = useSignInPrompt();
    const { data: bookmarked = false } = useBookmarkStatus(type, id, !!token);
    const toggleBookmark = useToggleBookmark(type, id);

    const needsLogin = !token;
    const handleClick = () => (needsLogin ? promptSignIn('bookmark') : toggleBookmark.mutate(bookmarked));

    const label = bookmarked ? t('bookmarks.remove') : t('bookmarks.add');
    // See LikeButton: signed out, the hover must not promise a bookmark the press will not make.
    const tone = needsLogin
        ? 'text-text-muted hover:text-text-secondary'
        : (bookmarked ? 'text-gold' : 'text-text-secondary hover:text-gold');

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={toggleBookmark.isPending}
            title={needsLogin ? t('common.loginRequired') : label}
            aria-label={needsLogin ? t('common.loginRequired') : label}
            aria-pressed={bookmarked}
            className={`inline-flex items-center gap-1.5 font-semibold text-sm transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed ${tone} ${className}`}
        >
            <Bookmark size={size} fill={bookmarked ? 'currentColor' : 'none'} />
            {needsLogin && <Lock size={12} aria-hidden="true" className="-ms-1" />}
            {labeled && <span>{label}</span>}
        </button>
    );
}

export default BookmarkButton;
