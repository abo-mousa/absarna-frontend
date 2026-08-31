import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Type, Clock, Calendar } from 'lucide-react';
import api from '@/lib/api/client';
import Navbar from '../components/layout/Navbar';
import { Spinner } from '../components/ui';
import { CommentsSection } from '../components/content';

function ArticleDetail() {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchArticle();
    }, [id]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/articles/${id}`);
            setArticle(res.data);
        } catch (err) {
            console.error('Failed to fetch article:', err);
            setError('فشل في تحميل المقال');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div dir="rtl" className="min-h-screen bg-bg">
                <Navbar />
                <Spinner />
            </div>
        );
    }

    if (error || !article) {
        return (
            <div dir="rtl" className="min-h-screen bg-bg">
                <Navbar />
                <div className="text-center py-16 px-5">
                    <p className="text-red-600 text-lg mb-2">{error || 'المقال غير موجود'}</p>
                    <Link to="/articles" className="text-primary font-semibold">العودة للمقالات</Link>
                </div>
            </div>
        );
    }

    return (
        <div dir="rtl" className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-reading mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="bg-surface p-6 sm:p-8 rounded-lg border border-border-light shadow-sm mb-6">
                    {article.category && (
                        <span className="inline-block px-3 py-1 bg-primary-light text-primary rounded-full text-sm font-semibold mb-4">
                            {article.category}
                        </span>
                    )}

                    <h1 className="text-2xl sm:text-3xl font-bold mb-4 leading-snug">{article.title}</h1>

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
        </div>
    );
}

export default ArticleDetail;
