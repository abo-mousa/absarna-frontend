import { Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBookmarkStatus, useToggleBookmark } from '../../hooks/useBookmarks';

// "Read/watch later" toggle — reusable across video/book/article detail pages. type is the
// same 'video'|'book'|'article' string CommentsSection/useComments already use elsewhere.
function BookmarkButton({ type, id, className = '', size = 18, labeled = false }) {
    const { token } = useAuth();
    const navigate = useNavigate();
    const { data: bookmarked = false } = useBookmarkStatus(type, id, !!token);
    const toggleBookmark = useToggleBookmark(type, id);

    const handleClick = () => {
        // Anonymous visitor: send them to log in rather than silently no-op-ing or hiding the
        // button entirely — bookmarking is exactly the kind of action worth prompting login for.
        if (!token) {
            navigate('/login');
            return;
        }
        toggleBookmark.mutate(bookmarked);
    };

    const label = bookmarked ? 'إزالة من المحفوظات' : 'حفظ لوقت لاحق';

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={toggleBookmark.isPending}
            title={label}
            aria-label={label}
            aria-pressed={bookmarked}
            className={`inline-flex items-center gap-1.5 font-semibold text-sm transition-colors disabled:opacity-60 ${
                bookmarked ? 'text-gold' : 'text-text-secondary hover:text-gold'
            } ${className}`}
        >
            <Bookmark size={size} fill={bookmarked ? 'currentColor' : 'none'} />
            {labeled && <span>{label}</span>}
        </button>
    );
}

export default BookmarkButton;
