import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '@/lib/media';
import Avatar from '../ui/Avatar';
import { formatPublishDate } from '@/lib/datetime';
import ReportButton from './ReportButton';

/**
 * A channel post, rendered wherever the channel's posts tab lists them.
 *
 * <p><b>A post has no detail route in this app</b> — it is its own content, short enough that a
 * page of its own would be a page holding one paragraph — so this card is the only surface a post
 * ever has, and therefore the only place its report control can live. Every other reportable type
 * gets the control on its detail page.
 *
 * <p>On the cross-channel posts page a post carries its channel (`channelSlug`, filled by the
 * backend only there) and opens with it, since a feed of many channels' posts has to say whose
 * each one is. On a channel's own page it does not, because the page already says.
 */
function PostCard({ post }) {
    return (
        <div className="bg-surface rounded-lg p-5 border border-border-light">
            {post.channelSlug && (
                <Link
                    to={`/channel/${post.channelSlug}`}
                    className="flex items-center gap-2 mb-2 text-sm font-bold text-text-primary hover:text-primary hover:no-underline w-fit"
                >
                    <Avatar src={resolveMediaUrl(post.channelLogoUrl)} name={post.channelName} size="sm" className="!w-7 !h-7 !text-xs" />
                    <span dir="auto">{post.channelName}</span>
                </Link>
            )}
            <p dir="auto" className="font-reading text-text-primary leading-relaxed whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center justify-between gap-3 mt-3">
                {/* Always rendered, even with no date: it is what holds the report control at the
                    far edge, since `justify-between` on a lone child places it at the start. */}
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    {post.publishDate && (
                        <>
                            <Calendar size={12} /> {formatPublishDate(post.publishDate)}
                        </>
                    )}
                </div>
                {/* `trackStatus={false}`: a channel's posts tab renders many of these at once, and
                    one status request per card is the cost VideoCard refuses for the same reason.
                    Pressing it twice is safe anyway — the backend updates the report it holds. */}
                <ReportButton type="post" id={post.id} size={14} trackStatus={false} />
            </div>
        </div>
    );
}

export default PostCard;
