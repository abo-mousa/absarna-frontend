import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Download, X } from 'lucide-react';
import api from '@/lib/api/client';
import { resolveMediaUrl } from '@/lib/media';
import Navbar from '../components/layout/Navbar';
import { Spinner } from '../components/ui';
import { CommentsSection } from '../components/content';

function BookDetail() {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPdf, setShowPdf] = useState(false);

    useEffect(() => {
        fetchBook();
    }, [id]);

    const fetchBook = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/books/${id}`);
            setBook(res.data);
        } catch (err) {
            console.error('Failed to fetch book:', err);
            setError('فشل في تحميل الكتاب');
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

    if (error || !book) {
        return (
            <div dir="rtl" className="min-h-screen bg-bg">
                <Navbar />
                <div className="text-center py-16 px-5">
                    <p className="text-red-600 text-lg mb-2">{error || 'الكتاب غير موجود'}</p>
                    <Link to="/books" className="text-primary font-semibold">العودة للمكتبة</Link>
                </div>
            </div>
        );
    }

    const pdfUrl = resolveMediaUrl(book.pdfUrl);
    const previewUrl = resolveMediaUrl(book.previewImageUrl);

    return (
        <div dir="rtl" className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-reading mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="bg-surface rounded-lg overflow-hidden border border-border-light shadow-sm mb-6">
                    {previewUrl && !showPdf && (
                        <div className="relative h-[280px] overflow-hidden cursor-pointer" onClick={() => setShowPdf(true)}>
                            <img src={previewUrl} alt={book.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex items-center gap-2 bg-black/70 text-white px-5 py-3 rounded-md font-semibold">
                                    <BookOpen size={18} /> اضغط للقراءة
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-5 sm:p-6">
                        {book.category && (
                            <span className="inline-block px-3 py-1 bg-primary-light text-primary rounded-full text-sm font-semibold mb-3">
                                {book.category}
                            </span>
                        )}

                        <h1 className="text-xl sm:text-2xl font-bold mb-3">{book.title}</h1>

                        <div className="flex gap-4 flex-wrap text-sm text-text-secondary mb-4">
                            {book.pages && <span>{book.pages} صفحة</span>}
                            {book.publishDate && <span>{book.publishDate}</span>}
                        </div>

                        {book.description && (
                            <p className="text-text-secondary leading-loose mb-5">{book.description}</p>
                        )}

                        {pdfUrl && (
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setShowPdf(!showPdf)}
                                    className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-md font-semibold"
                                >
                                    <BookOpen size={18} /> {showPdf ? 'إخفاء القراءة' : 'قراءة أونلاين'}
                                </button>

                                <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 bg-primary-light text-primary rounded-md font-semibold"
                                >
                                    <Download size={18} /> تحميل PDF
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {showPdf && pdfUrl && (
                    <div className="bg-surface rounded-lg overflow-hidden border border-border-light shadow-sm h-[80vh] flex flex-col mb-6">
                        <div className="flex justify-between items-center px-5 py-3 border-b border-border-light">
                            <h3 className="m-0 flex items-center gap-2"><BookOpen size={18} /> {book.title}</h3>
                            <button onClick={() => setShowPdf(false)} className="text-text-muted hover:text-text-primary">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <object data={pdfUrl} type="application/pdf" className="w-full h-full border-0">
                                <p className="text-center p-10">
                                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold">
                                        افتح الملف في تبويب جديد
                                    </a>
                                </p>
                            </object>
                        </div>
                    </div>
                )}

                <CommentsSection type="book" id={book.id} />

                <div className="mt-6">
                    <Link to="/books" className="flex items-center gap-1.5 text-primary font-semibold w-fit">
                        <ArrowRight size={16} /> العودة للمكتبة
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default BookDetail;
