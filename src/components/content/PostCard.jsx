import { Calendar } from 'lucide-react';
import { formatPublishDate } from '@/lib/dayjsAr';
import ReportButton from './ReportButton';

/**
 * A channel post, rendered wherever the channel's posts tab lists them.
 *
 * <p><b>A post has no detail route in this app</b> — it is its own content, short enough that a
 * page of its own would be a page holding one paragraph — so this card is the only surface a post
 * ever has, and therefore the only place its report control can live. Every other reportable type
 * gets the control on its detail page.
 */
function PostCard({ post }) {
    return (
        <div className="bg-surface rounded-lg p-5 border border-border-light shadow-sm">
            <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{post.content}</p>
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
