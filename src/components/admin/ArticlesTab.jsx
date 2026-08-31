import { useState } from 'react';
import { Folder, Type, Clock, Calendar } from 'lucide-react';
import { useArticles, useCreateArticle, useDeleteArticle } from '../../hooks/useAdminData';
import { Input, Button } from '../ui';

const fieldClass = 'w-full px-3.5 py-2.5 rounded-md border border-border outline-none focus:border-primary transition-colors';

function ArticlesTab({ showMessage }) {
    const [articleForm, setArticleForm] = useState({
        title: '', content: '', category: '', publishDate: '', isFeatured: false,
    });

    const { data: articles = [] } = useArticles();
    const createArticleMutation = useCreateArticle();
    const deleteArticleMutation = useDeleteArticle();

    const addArticle = async (e) => {
        e.preventDefault();
        try {
            const result = await createArticleMutation.mutateAsync(articleForm);
            setArticleForm({ ...articleForm, title: '', content: '', category: '', publishDate: '' });
            showMessage(result.wordCount
                ? `✅ تم نشر المقال (${result.wordCount} كلمة - ${result.readingTimeMinutes} دقائق قراءة)`
                : '✅ تم نشر المقال');
        } catch (err) {
            showMessage('❌ فشل في نشر المقال');
        }
    };

    const deleteArticle = async (id) => {
        if (!window.confirm('حذف؟')) return;
        try {
            await deleteArticleMutation.mutateAsync(id);
            showMessage('🗑️ تم حذف المقال');
        } catch (err) {
            showMessage('❌ فشل في الحذف');
        }
    };

    return (
        <div>
            <form onSubmit={addArticle} className="grid gap-4 bg-surface p-6 rounded-xl border border-border-light mb-6">
                <h3 className="text-lg font-bold">نشر مقال جديد</h3>
                <Input placeholder="عنوان المقال *" value={articleForm.title} onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })} required />
                <textarea
                    placeholder="محتوى المقال *"
                    value={articleForm.content}
                    onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                    rows={15}
                    required
                    className={`${fieldClass} min-h-[300px] resize-y`}
                />
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <Input placeholder="التصنيف" value={articleForm.category} onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })} />
                    <input type="date" value={articleForm.publishDate} onChange={(e) => setArticleForm({ ...articleForm, publishDate: e.target.value })} className={fieldClass} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={articleForm.isFeatured} onChange={(e) => setArticleForm({ ...articleForm, isFeatured: e.target.checked })} />
                    مقال مميز
                </label>
                <Button type="submit">نشر المقال</Button>
            </form>

            <h3 className="text-lg font-bold mb-3">المقالات ({articles.length})</h3>
            <div className="grid gap-2">
                {articles.map((a) => (
                    <div key={a.id} className="flex justify-between items-center p-4 bg-surface rounded-md border border-border-light">
                        <div>
                            <strong>{a.title}</strong>
                            <div className="flex items-center gap-3 text-sm text-text-secondary mt-1 flex-wrap">
                                {a.category && <span className="flex items-center gap-1"><Folder size={13} /> {a.category}</span>}
                                {a.wordCount > 0 && <span className="flex items-center gap-1"><Type size={13} /> {a.wordCount} كلمة</span>}
                                {a.readingTimeMinutes > 0 && <span className="flex items-center gap-1"><Clock size={13} /> {a.readingTimeMinutes} دقائق</span>}
                                {a.publishDate && <span className="flex items-center gap-1"><Calendar size={13} /> {a.publishDate}</span>}
                            </div>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => deleteArticle(a.id)}>حذف</Button>
                    </div>
                ))}
                {articles.length === 0 && <p className="text-center text-text-secondary py-5">لا توجد مقالات</p>}
            </div>
        </div>
    );
}

export default ArticlesTab;
