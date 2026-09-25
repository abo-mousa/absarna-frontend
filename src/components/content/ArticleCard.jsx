import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { formatPublishDate, displayDate } from '@/lib/datetime';
import { t } from '@/i18n';

/**
 * An article as text, the way a magazine lists one: category, headline, the opening lines, and
 * how long it takes to read. No thumbnail and no box — an article that has no picture used to
 * sit in the same bordered tile as a video, looking like a video whose poster had failed to load.
 * A hairline above each one separates them in a grid.
 *
 * <p>The headline is Markazi (the face the article page itself uses for its title) and the
 * excerpt is Naskh, because it is prose someone wrote and is about to read at length — the
 * CLAUDE.md split between interface and reading faces, applied to the card.
 */
function ArticleCard({ article }) {
    return (
        <Link
            to={`/articles/${article.id}`}
            className="group block h-full pt-4 border-t border-border text-text-primary no-underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-bg rounded-sm"
        >
            {article.category && (
                <span dir="auto" className="block truncate text-xs font-bold text-gold-ink mb-1">
                    {article.category}
                </span>
            )}
            <h3 dir="auto" className="font-serif text-[1.45rem] font-semibold mb-2 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
            </h3>
            {article.content && (
                <p dir="auto" className="font-reading text-text-secondary text-[0.95rem] leading-loose line-clamp-3 mb-3">
                    {article.content.substring(0, 150)}...
                </p>
            )}
            <div className="flex gap-3 text-xs text-text-muted">
                {article.readingTimeMinutes > 0 && (
                    <span className="flex items-center gap-1">
                        <Clock size={12} /> {t('common.readingMinutes', { count: article.readingTimeMinutes })}
                    </span>
                )}
                {displayDate(article) && <span>{formatPublishDate(displayDate(article))}</span>}
            </div>
        </Link>
    );
}

export default ArticleCard;
