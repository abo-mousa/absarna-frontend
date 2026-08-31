import { useState } from 'react';
import { Folder, FileText, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api/client';
import { useBooks, useCreateBook, useDeleteBook } from '../../hooks/useAdminData';
import { Input, Button } from '../ui';

const fieldClass = 'w-full px-3.5 py-2.5 rounded-md border border-border outline-none focus:border-primary transition-colors';

function BooksTab({ showMessage }) {
    const [bookForm, setBookForm] = useState({
        title: '', description: '', pdfUrl: '', coverImageUrl: '',
        previewImageUrl: '', category: '', publishDate: '', pages: '', isFeatured: false,
    });
    const [uploading, setUploading] = useState(false);

    const { data: books = [] } = useBooks();
    const createBookMutation = useCreateBook();
    const deleteBookMutation = useDeleteBook();

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            const res = await api.post('/admin/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setBookForm({
                ...bookForm,
                pdfUrl: res.data.fileUrl,
                previewImageUrl: res.data.previewUrl || null,
                pages: res.data.pages || bookForm.pages,
            });

            showMessage(res.data.pages ? `✅ تم رفع الملف (${res.data.pages} صفحة)` : '✅ تم رفع الملف بنجاح');
        } catch (err) {
            showMessage('❌ فشل في رفع الملف');
        } finally {
            setUploading(false);
        }
    };

    const addBook = async (e) => {
        e.preventDefault();
        try {
            await createBookMutation.mutateAsync(bookForm);
            setBookForm({ ...bookForm, title: '', description: '', pdfUrl: '', coverImageUrl: '', previewImageUrl: '', category: '', publishDate: '', pages: '' });
            showMessage('✅ تمت إضافة الكتاب');
        } catch (err) {
            showMessage('❌ فشل في إضافة الكتاب');
        }
    };

    const deleteBook = async (id) => {
        if (!window.confirm('حذف؟')) return;
        try {
            await deleteBookMutation.mutateAsync(id);
            showMessage('🗑️ تم حذف الكتاب');
        } catch (err) {
            showMessage('❌ فشل في الحذف');
        }
    };

    return (
        <div>
            <form onSubmit={addBook} className="grid gap-4 bg-surface p-6 rounded-xl border border-border-light mb-6">
                <h3 className="text-lg font-bold">إضافة كتاب أو ملف PDF</h3>
                <Input placeholder="عنوان الكتاب *" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} required />
                <Input textarea rows={3} placeholder="الوصف" value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} />

                <div className="border-2 border-dashed border-border p-5 rounded-md text-center">
                    <input type="file" accept=".pdf" onChange={handlePdfUpload} className="block mx-auto mb-3" />
                    {uploading && <p className="text-primary text-sm">جاري الرفع...</p>}
                    {bookForm.pdfUrl && (
                        <p className="flex items-center justify-center gap-1.5 text-emerald-600 text-sm">
                            <CheckCircle2 size={15} /> تم رفع الملف
                        </p>
                    )}
                </div>

                <Input dir="ltr" placeholder="أو رابط PDF مباشر" value={bookForm.pdfUrl} onChange={(e) => setBookForm({ ...bookForm, pdfUrl: e.target.value })} />

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <Input placeholder="التصنيف" value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} />
                    <input type="number" placeholder="عدد الصفحات" value={bookForm.pages} onChange={(e) => setBookForm({ ...bookForm, pages: e.target.value })} className={fieldClass} />
                </div>

                <input type="date" value={bookForm.publishDate} onChange={(e) => setBookForm({ ...bookForm, publishDate: e.target.value })} className={fieldClass} />

                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={bookForm.isFeatured} onChange={(e) => setBookForm({ ...bookForm, isFeatured: e.target.checked })} />
                    كتاب مميز
                </label>

                <Button type="submit">إضافة الكتاب</Button>
            </form>

            <h3 className="text-lg font-bold mb-3">الكتب ({books.length})</h3>
            <div className="grid gap-2">
                {books.map((b) => (
                    <div key={b.id} className="flex justify-between items-center p-4 bg-surface rounded-md border border-border-light">
                        <div>
                            <strong>{b.title}</strong>
                            <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                                {b.category && <span className="flex items-center gap-1"><Folder size={13} /> {b.category}</span>}
                                {b.pages && <span className="flex items-center gap-1"><FileText size={13} /> {b.pages} صفحة</span>}
                                {b.previewImageUrl && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={13} /> معاينة</span>}
                            </div>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => deleteBook(b.id)}>حذف</Button>
                    </div>
                ))}
                {books.length === 0 && <p className="text-center text-text-secondary py-5">لا توجد كتب</p>}
            </div>
        </div>
    );
}

export default BooksTab;
