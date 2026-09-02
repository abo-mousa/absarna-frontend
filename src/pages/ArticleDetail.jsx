import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Type, Clock, Calendar } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { QueryState } from '../components/ui';
import { CommentsSection, BookmarkButton, ShareButton } from '../components/content';
import { useArticle } from '../hooks/useArticles';
import { usePageMeta } from '../hooks/usePageMeta';

function ArticleDetail() {
    const { id } = useParams();
    const { data: article, isLoading, isError } = useArticle(id);
    usePageMeta({ title: article?.title, description: article?.content?.slice(0, 200) });

    if (isLoading || isError || !article) {
        return (
            <PageShell sidebar={false}>
                <QueryState
                    isLoading={isLoading}
                    isError={isError || !article}
                    errorTitle="فشل في تحميل المقال"
                    errorAction={<Link to="/articles" className="text-primary font-semibold">العودة للمقالات</Link>}
                />
            </PageShell>
        );
    }

    return (
        <PageShell sidebar={false}>
            <div className="max-w-reading mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="bg-surface p-6 sm:p-8 rounded-lg border border-border-light shadow-sm mb-6">
                    {article.category && (
                        <span className="inline-block px-3 py-1 bg-primary-light text-primary rounded-full text-sm font-semibold mb-4">
                            {article.category}
                        </span>
                    )}

                    <div className="flex items-start justify-between gap-3 mb-4">
                        <h1 className="text-2xl sm:text-3xl font-bold leading-snug">{article.title}</h1>
                        <div className="flex items-center gap-3 flex-shrink-0 mt-1">
                            <ShareButton title={article.title} path={`/articles/${article.id}`} />
                            <BookmarkButton type="article" id={article.id} />
                        </div>
                    </div>

                    <div className="flex gap-5 flex-wrap py-3 border-y border-border-light mb-6 text-sm text-text-secondary">
                        {article.wordCount > 0 && (
                            <span className="flex items-center gap-1.5"><Type size={14} /> {article.wordCount} كلمة</span>
                        )}
                        {article.readingTimeMinutes > 0 && (
                            <span className="flex items-center gap-1.5"><Clock size={14} /> {article.readingTimeMinutes} دقائق قراءة</span>
                        )}
                        {article.publishDate && (
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {article.publishDate}</span>
                        )}
                    </div>

                    <div className="whitespace-pre-wrap leading-[2.2] text-[1.05rem] text-text-primary">
                        {article.content}
                    </div>
                </div>

                <CommentsSection type="article" id={article.id} />

                <div className="mt-6">
                    <Link to="/articles" className="flex items-center gap-1.5 text-primary font-semibold w-fit">
                        <ArrowRight size={16} /> العودة للمقالات
                    </Link>
                </div>
            </div>
        </PageShell>
    );
}

export default ArticleDetail;
