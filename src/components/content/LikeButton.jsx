import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLikeStatus, useToggleLike } from '../../hooks/useLikes';
import { formatCount } from '@/lib/numbers';
import { t } from '@/i18n';

/**
 * Like toggle with its count — reusable across video/book/article detail pages, same shape as
 * BookmarkButton. `type` is the usual 'video'|'book'|'article' string.
 *
 * The count renders for everyone; only the *action* needs a login. An anonymous press goes to
 * /login rather than being silently ignored or the button being hidden — hiding it would also
 * hide the count, which is the part a visitor came for.
 *
 * `initialCount` lets a caller that already has the number (a VideoDTO's `likeCount`) show it
 * immediately instead of flashing a zero while the status query resolves.
 */
function LikeButton({ type, id, className = '', size = 18, labeled = false, initialCount = null }) {
    const { token } = useAuth();
    const navigate = useNavigate();
    // `initialCount` goes to both: it seeds the query's placeholder so the number never flashes
    // 0, and it is the optimistic arithmetic's base so a press landing before the status query
    // resolves does not render "1" on a video with 57 likes.
    const { data: status } = useLikeStatus(type, id, true, initialCount ?? undefined);
    const toggleLike = useToggleLike(type, id, initialCount ?? undefined);

    const liked = status?.liked ?? false;
    const count = status?.likeCount ?? initialCount ?? 0;

    const handleClick = () => {
        if (!token) {
            navigate('/login');
            return;
        }
        toggleLike.mutate(liked);
    };

    const label = liked ? t('likes.remove') : t('likes.add');

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={toggleLike.isPending}
            title={label}
            aria-label={label}
            aria-pressed={liked}
            className={`inline-flex items-center gap-1.5 font-semibold text-sm transition-colors disabled:opacity-60 ${
                liked ? 'text-red-500' : 'text-text-secondary hover:text-red-500'
            } ${className}`}
        >
            <Heart size={size} fill={liked ? 'currentColor' : 'none'} />
            {/* Latin digits, matching every other number in the UI — see lib/numbers.js. */}
            <span className="tabular-nums">{formatCount(count)}</span>
            {labeled && <span>{label}</span>}
        </button>
    );
}

export default LikeButton;
