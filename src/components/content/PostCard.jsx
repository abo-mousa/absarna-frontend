import { Calendar } from 'lucide-react';
import { formatPublishDate } from '@/lib/dayjsAr';

function PostCard({ post }) {
    return (
        <div className="bg-surface rounded-lg p-5 border border-border-light shadow-sm">
            <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{post.content}</p>
            {post.publishDate && (
                <div className="flex items-center gap-1.5 text-xs text-text-muted mt-3">
                    <Calendar size={12} /> {formatPublishDate(post.publishDate)}
                </div>
            )}
        </div>
    );
}

export default PostCard;
