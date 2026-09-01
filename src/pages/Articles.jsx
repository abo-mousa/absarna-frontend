import { Link } from 'react-router-dom';
import { Type, Clock, Calendar } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { Spinner, EmptyState } from '../components/ui';
import { useArticles } from '../hooks/useArticles';

function Articles() {
    const { data: articles = [], isLoading } = useArticles();

    return (
        <PageShell sidebar={false} contentClassName="max-w-reading mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold mb-6">المقالات</h1>

            {isLoading ? (
                <Spinner />
            ) : articles.length === 0 ? (
                <EmptyState icon="📝" title="لا توجد مقالات" />
            ) : (
                <div className="grid gap-4">
                    {articles.map((article) => (
                        <Link
                            key={article.id}
                            to={`/articles/${article.id}`}
                            className="block bg-surface p-5 rounded-lg border border-border-light shadow-sm hover:shadow-md transition-shadow text-text-primary no-underline"
                        >
                            <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                            <div className="flex gap-4 flex-wrap text-sm text-text-muted">
                                {article.wordCount > 0 && (
                                    <span className="flex items-center gap-1"><Type size={13} /> {article.wordCount} كلمة</span>
                                )}
                                {article.readingTimeMinutes > 0 && (
                                    <span className="flex items-center gap-1"><Clock size={13} /> {article.readingTimeMinutes} دقائق</span>
                                )}
                                {article.publishDate && (
                                    <span className="flex items-center gap-1"><Calendar size={13} /> {article.publishDate}</span>
                                )}
                            </div>
                            {article.content && (
                                <p className="mt-2 text-text-secondary text-sm leading-relaxed">
                                    {article.content.substring(0, 150)}...
                                </p>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </PageShell>
    );
}

export default Articles;
