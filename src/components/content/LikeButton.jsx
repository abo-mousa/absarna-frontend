import { Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLikeStatus, useToggleLike } from '../../hooks/useLikes';
import { formatCount } from '@/lib/numbers';
import { t } from '@/i18n';

/**
 * Like toggle with its count — reusable across video/book/article detail pages, same shape as
 * BookmarkButton. `type` is the usual 'video'|'book'|'article' string.
 *
 * The count renders for everyone; only the *action* needs a login, and for a visitor without one
 * the control is DISABLED rather than hidden — hiding it would take the count with it, which is
 * the part a visitor came for, and a control that looks live and then sends you somewhere else is
 * a worse answer than one that plainly says it is not yours to press. `title`/`aria-label` carry
 * the reason, because a disabled control with no explanation is just a dead one.
 *
 * `initialCount` lets a caller that already has the number (a VideoDTO's `likeCount`) show it
 * immediately instead of flashing a zero while the status query resolves.
 */
function LikeButton({ type, id, className = '', size = 18, labeled = false, initialCount = null }) {
    const { token } = useAuth();
    // `initialCount` goes to both: it seeds the query's placeholder so the number never flashes
    // 0, and it is the optimistic arithmetic's base so a press landing before the status query
    // resolves does not render "1" on a video with 57 likes.
    const { data: status } = useLikeStatus(type, id, true, initialCount ?? undefined);
    const toggleLike = useToggleLike(type, id, initialCount ?? undefined);

    const liked = status?.liked ?? false;
    const count = status?.likeCount ?? initialCount ?? 0;

    const needsLogin = !token;
    const handleClick = () => toggleLike.mutate(liked);

    const label = liked ? t('likes.remove') : t('likes.add');
    // No hover colour on a control that cannot be pressed: CSS `:hover` still matches a disabled
    // element, so leaving it on would light the heart up under a pointer that can do nothing with
    // it — the exact promise the disabled state is there to withdraw.
    const tone = needsLogin
        ? 'text-text-muted'
        : (liked ? 'text-red-500' : 'text-text-secondary hover:text-red-500');

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={needsLogin || toggleLike.isPending}
            title={needsLogin ? t('common.loginRequired') : label}
            aria-label={needsLogin ? t('common.loginRequired') : label}
            aria-pressed={liked}
            className={`inline-flex items-center gap-1.5 font-semibold text-sm transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed ${tone} ${className}`}
        >
            <Heart size={size} fill={liked ? 'currentColor' : 'none'} />
            {/* Latin digits, matching every other number in the UI — see lib/numbers.js. */}
            <span className="tabular-nums">{formatCount(count)}</span>
            {labeled && <span>{label}</span>}
        </button>
    );
}

export default LikeButton;
