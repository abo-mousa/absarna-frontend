import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

function ArticleCard({ article }) {
    return (
        <Link
            to={`/articles/${article.id}`}
            className="block h-full bg-surface rounded-lg p-5 border border-border-light shadow-sm hover:shadow-md transition-shadow text-text-primary no-underline"
        >
            {article.category && (
                <span className="inline-block px-2.5 py-0.5 bg-primary-light text-primary rounded-full text-xs font-semibold mb-2">
                    {article.category}
                </span>
            )}
            <h3 className="text-base font-semibold mb-2 leading-snug line-clamp-2">
                {article.title}
            </h3>
            {article.content && (
                <p className="text-text-secondary text-sm leading-relaxed line-clamp-3 mb-3">
                    {article.content.substring(0, 150)}...
                </p>
            )}
            <div className="flex gap-3 text-xs text-text-muted">
                {article.readingTimeMinutes > 0 && (
                    <span className="flex items-center gap-1">
                        <Clock size={12} /> {article.readingTimeMinutes} دقائق
                    </span>
                )}
                {article.publishDate && <span>{article.publishDate}</span>}
            </div>
        </Link>
    );
}

export default ArticleCard;
