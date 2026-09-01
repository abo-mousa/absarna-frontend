import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Video, BookOpen, FileText, MessageSquare, Settings, Save, ArrowRight, Eye, EyeOff, Trash2 } from 'lucide-react';
import api from '@/lib/api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import Navbar from '../components/layout/Navbar';
import { Spinner, Input, Button } from '../components/ui';
import {
    useChannel,
    useUpdateChannel,
    useChannelContentList,
    useCreateChannelContent,
    useToggleContentVisibility,
    useDeleteContent,
} from '../hooks/useChannels';

const TABS = [
    { id: 'overview', label: 'نظرة عامة', icon: Settings },
    { id: 'videos', label: 'الفيديوهات', icon: Video },
    { id: 'books', label: 'الكتب', icon: BookOpen },
    { id: 'articles', label: 'المقالات', icon: FileText },
    { id: 'posts', label: 'المنشورات', icon: MessageSquare },
];

function ErrorScreen({ emoji, title, description, onBack }) {
    return (
        <div className="min-h-screen bg-bg">
            <Navbar />
            <div className="max-w-[600px] mx-auto my-16 sm:my-20 p-8 sm:p-10 text-center bg-surface rounded-lg shadow-md border border-border-light">
                <div className="text-5xl mb-4">{emoji}</div>
                <h2 className="text-xl font-bold mb-2">{title}</h2>
                <p className="text-text-muted">{description}</p>
                <Button className="mt-5" onClick={onBack}>العودة للرئيسية</Button>
            </div>
        </div>
    );
}

function ContentManageList({ items, loading, onToggleVisibility, onDelete, getLabel = (item) => item.title }) {
    if (loading) return <p className="text-sm text-text-muted py-2">جاري التحميل...</p>;
    if (items.length === 0) return <p className="text-sm text-text-muted py-4">لا يوجد محتوى بعد</p>;

    return (
        <div className="grid gap-2">
            {items.map((item) => (
                <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-md border border-border-light ${
                        item.visible ? 'bg-surface' : 'bg-surface-hover'
                    }`}
                >
                    <div className="min-w-0">
                        <strong className={`block truncate ${item.visible ? '' : 'text-text-muted'}`}>{getLabel(item)}</strong>
                        {!item.visible && <span className="text-xs text-text-muted">مخفي عن الزوار</span>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                        <button
                            onClick={() => onToggleVisibility(item)}
                            title={item.visible ? 'إخفاء عن الزوار' : 'إظهار للزوار'}
                            className="p-2 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        >
                            {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                            onClick={() => onDelete(item)}
                            title="حذف"
                            className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ChannelManage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('overview');

    const { data: channel, isLoading: channelLoading, isError: channelError, error: channelFetchError } = useChannel(slug, !authLoading);
    usePageMeta({ title: channel ? `إدارة ${channel.name}` : 'إدارة القناة' });

    const [form, setForm] = useState({ name: '', description: '', primaryColor: '#0D6B4D', logoUrl: '', bannerUrl: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (channel) {
            setForm({
                name: channel.name || '',
                description: channel.description || '',
                primaryColor: channel.primaryColor || '#0D6B4D',
                logoUrl: channel.logoUrl || '',
                bannerUrl: channel.bannerUrl || '',
            });
        }
    }, [channel]);

    useEffect(() => {
        if (!authLoading && !user) navigate('/');
    }, [authLoading, user, navigate]);

    const [videoForm, setVideoForm] = useState({
        title: '', description: '', sourceType: 'LOCAL', sourceUrl: '',
        category: '', series: '', speaker: '', publishDate: '', isFeatured: false,
    });
    const [videoUploading, setVideoUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [bookForm, setBookForm] = useState({
        title: '', description: '', pdfUrl: '', previewImageUrl: '',
        category: '', publishDate: '', pages: '', isFeatured: false,
    });
    const [bookUploading, setBookUploading] = useState(false);

    const [articleForm, setArticleForm] = useState({
        title: '', content: '', category: '', publishDate: '', isFeatured: false,
    });

    const [postForm, setPostForm] = useState({ content: '', publishDate: '' });

    const { data: videoList = [], isLoading: videoListLoading } = useChannelContentList(slug, 'videos', activeTab === 'videos');
    const { data: bookList = [], isLoading: bookListLoading } = useChannelContentList(slug, 'books', activeTab === 'books');
    const { data: articleList = [], isLoading: articleListLoading } = useChannelContentList(slug, 'articles', activeTab === 'articles');
    const { data: postList = [], isLoading: postListLoading } = useChannelContentList(slug, 'posts', activeTab === 'posts');

    const updateChannel = useUpdateChannel(slug, channel?.id);
    const createVideo = useCreateChannelContent(slug, 'videos');
    const createBook = useCreateChannelContent(slug, 'books');
    const createArticle = useCreateChannelContent(slug, 'articles');
    const createPost = useCreateChannelContent(slug, 'posts');
    const toggleVideoVisibility = useToggleContentVisibility(slug, 'videos');
    const toggleBookVisibility = useToggleContentVisibility(slug, 'books');
    const toggleArticleVisibility = useToggleContentVisibility(slug, 'articles');
    const togglePostVisibility = useToggleContentVisibility(slug, 'posts');
    const deleteVideo = useDeleteContent(slug, 'videos');
    const deleteBook = useDeleteContent(slug, 'books');
    const deleteArticle = useDeleteContent(slug, 'articles');
    const deletePost = useDeleteContent(slug, 'posts');

    // Call sites below still pass the original "type:text" string shape — kept as-is to
    // avoid touching all twelve call sites; this just forwards to the shared toast now
    // instead of a local, in-page banner.
    const showMessage = (msg) => {
        const isSuccess = msg.startsWith('success:');
        showToast(msg.split(':').slice(1).join(':'), isSuccess ? 'success' : 'error');
    };

    const deleteItem = (mutation, item) => {
        const label = item.title || (item.content ? `${item.content.substring(0, 40)}...` : '');
        if (!window.confirm(`هل تريد حذف "${label}"؟`)) return;
        mutation.mutate(item, {
            onSuccess: () => showMessage('success:تم الحذف'),
            onError: () => showMessage('error:فشل في الحذف'),
        });
    };

    const toggleVisibility = (mutation, item) => {
        mutation.mutate(item, {
            onError: () => showMessage('error:فشل في تحديث الظهور'),
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateChannel.mutateAsync(form);
            showMessage('success:تم حفظ التغييرات');
        } catch (err) {
            showMessage('error:فشل في الحفظ');
        } finally {
            setSaving(false);
        }
    };

    const handleVideoFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setVideoUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/channels/${slug}/content/videos/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                },
            });

            let thumbnailUrl = res.data.thumbnailUrl || '';
            if (thumbnailUrl && !thumbnailUrl.startsWith('http') && !thumbnailUrl.startsWith('/uploads/')) {
                thumbnailUrl = `/uploads/${thumbnailUrl}`;
            }

            setVideoForm({
                ...videoForm,
                sourceType: 'LOCAL',
                sourceUrl: res.data.fileUrl,
                thumbnailUrl,
                duration: res.data.duration || '',
                title: file.name.replace(/\.[^/.]+$/, ''),
            });
            showMessage('success:تم رفع الفيديو');
        } catch (err) {
            showMessage(`error:فشل في رفع الفيديو: ${err.response?.data?.message || err.message}`);
        } finally {
            setVideoUploading(false);
        }
    };

    const handleVideoSubmit = async (e) => {
        e.preventDefault();
        try {
            await createVideo.mutateAsync({ ...videoForm, channelId: channel.id, speaker: channel.name });
            setVideoForm({ title: '', description: '', sourceType: 'LOCAL', sourceUrl: '', category: '', series: '', speaker: '', publishDate: '', isFeatured: false });
            showMessage('success:تم نشر الفيديو');
        } catch (err) {
            showMessage(`error:فشل في نشر الفيديو: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleBookFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setBookUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/channels/${slug}/content/books/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            let previewUrl = res.data.previewUrl || '';
            if (previewUrl && !previewUrl.startsWith('http') && !previewUrl.startsWith('/uploads/')) {
                previewUrl = `/uploads/${previewUrl}`;
            }

            setBookForm({
                ...bookForm,
                pdfUrl: res.data.fileUrl,
                previewImageUrl: previewUrl,
                pages: res.data.pages || '',
                title: file.name.replace(/\.[^/.]+$/, ''),
            });
            showMessage('success:تم رفع الكتاب');
        } catch (err) {
            showMessage(`error:فشل في رفع الكتاب: ${err.response?.data?.message || err.message}`);
        } finally {
            setBookUploading(false);
        }
    };

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        try {
            await createBook.mutateAsync({ ...bookForm, channelId: channel.id });
            setBookForm({ title: '', description: '', pdfUrl: '', previewImageUrl: '', category: '', publishDate: '', pages: '', isFeatured: false });
            showMessage('success:تم نشر الكتاب');
        } catch (err) {
            showMessage(`error:فشل في نشر الكتاب: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleArticleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createArticle.mutateAsync({ ...articleForm, channelId: channel.id });
            setArticleForm({ title: '', content: '', category: '', publishDate: '', isFeatured: false });
            showMessage('success:تم نشر المقال');
        } catch (err) {
            showMessage(`error:فشل في نشر المقال: ${err.response?.data?.message || err.message}`);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        try {
            await createPost.mutateAsync({ ...postForm, channelId: channel.id });
            setPostForm({ content: '', publishDate: '' });
            showMessage('success:تم نشر التحديث');
        } catch (err) {
            showMessage(`error:فشل في نشر التحديث: ${err.response?.data?.message || err.message}`);
        }
    };

    if (authLoading || channelLoading) {
        return (
            <div className="min-h-screen bg-bg">
                <Navbar />
                <Spinner />
            </div>
        );
    }

    if (channelError || !channel) {
        const description = channelFetchError?.response?.status === 404
            ? 'القناة غير موجودة'
            : 'لم نتمكن من العثور على هذه القناة';
        return <ErrorScreen emoji="🔍" title="القناة غير موجودة" description={description} onBack={() => navigate('/')} />;
    }

    const isOwner = user && channel.ownerUserId === user.id;
    const isAdmin = user?.role === 'PLATFORM_ADMIN';

    if (!isOwner && !isAdmin) {
        return <ErrorScreen emoji="⛔" title="غير مصرح لك" description="ليس لديك صلاحية لإدارة هذه القناة" onBack={() => navigate('/')} />;
    }

    const formCardClass = 'grid gap-4 bg-surface p-6 rounded-lg border border-border-light';

    return (
        <div className="min-h-screen bg-bg">
            <Navbar />
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(`/channel/${slug}`)} className="text-text-secondary">
                        <ArrowRight size={20} />
                    </button>
                    <h1 className="text-xl font-bold">إدارة: {channel.name}</h1>
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full font-semibold text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white border-2 border-primary'
                                    : 'bg-surface text-text-secondary border border-border'
                            }`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <form onSubmit={handleSave} className={formCardClass}>
                        <Input label="اسم القناة" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <Input label="الوصف" textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        <div>
                            <label className="block mb-1.5 font-semibold text-sm text-text-secondary">اللون الرئيسي</label>
                            <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-[60px] h-10 cursor-pointer" />
                        </div>
                        <Button type="submit" disabled={saving} icon={<Save size={18} />}>
                            {saving ? 'جاري الحفظ...' : 'حفظ'}
                        </Button>
                    </form>
                )}

                {activeTab === 'videos' && (
                    <div className="grid gap-6">
                        <form onSubmit={handleVideoSubmit} className={formCardClass}>
                            <h3 className="text-lg font-bold">رفع فيديو</h3>

                            <div>
                                <label className="block mb-1.5 font-semibold text-sm text-text-secondary">ملف الفيديو</label>
                                <input type="file" accept="video/*" onChange={handleVideoFileSelect} />
                                {videoUploading && (
                                    <div className="mt-2">
                                        <div className="w-full h-2 bg-border rounded-full">
                                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                        <p className="text-sm text-text-muted mt-1">{uploadProgress}%</p>
                                    </div>
                                )}
                            </div>

                            <Input label="العنوان" value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} required />
                            <Input label="الوصف" textarea rows={3} value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} />

                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                                <Input label="التصنيف" value={videoForm.category} onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })} />
                                <Input label="السلسلة" value={videoForm.series} onChange={(e) => setVideoForm({ ...videoForm, series: e.target.value })} />
                            </div>

                            <Button type="submit" icon={<Upload size={18} />}>نشر الفيديو</Button>
                        </form>

                        <div>
                            <h3 className="text-lg font-bold mb-3">فيديوهاتي ({videoList.length})</h3>
                            <ContentManageList
                                items={videoList}
                                loading={videoListLoading}
                                onToggleVisibility={(item) => toggleVisibility(toggleVideoVisibility, item)}
                                onDelete={(item) => deleteItem(deleteVideo, item)}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'books' && (
                    <div className="grid gap-6">
                        <form onSubmit={handleBookSubmit} className={formCardClass}>
                            <h3 className="text-lg font-bold">إضافة كتاب</h3>

                            <div>
                                <label className="block mb-1.5 font-semibold text-sm text-text-secondary">ملف PDF</label>
                                <input type="file" accept=".pdf" onChange={handleBookFileSelect} />
                                {bookUploading && <p className="text-primary text-sm mt-1">جاري الرفع...</p>}
                            </div>

                            <Input label="العنوان" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} required />
                            <Input label="الوصف" textarea rows={3} value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} />

                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                                <Input label="التصنيف" value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} />
                                <Input label="عدد الصفحات" type="number" value={bookForm.pages} onChange={(e) => setBookForm({ ...bookForm, pages: e.target.value })} />
                            </div>

                            <Button type="submit">نشر الكتاب</Button>
                        </form>

                        <div>
                            <h3 className="text-lg font-bold mb-3">كتبي ({bookList.length})</h3>
                            <ContentManageList
                                items={bookList}
                                loading={bookListLoading}
                                onToggleVisibility={(item) => toggleVisibility(toggleBookVisibility, item)}
                                onDelete={(item) => deleteItem(deleteBook, item)}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'articles' && (
                    <div className="grid gap-6">
                        <form onSubmit={handleArticleSubmit} className={formCardClass}>
                            <h3 className="text-lg font-bold">كتابة مقال</h3>

                            <Input label="العنوان" value={articleForm.title} onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })} required />
                            <Input label="المحتوى" textarea rows={15} className="min-h-[300px]" value={articleForm.content} onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })} required />

                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                                <Input label="التصنيف" value={articleForm.category} onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })} />
                                <Input label="تاريخ النشر" type="date" value={articleForm.publishDate} onChange={(e) => setArticleForm({ ...articleForm, publishDate: e.target.value })} />
                            </div>

                            <Button type="submit">نشر المقال</Button>
                        </form>

                        <div>
                            <h3 className="text-lg font-bold mb-3">مقالاتي ({articleList.length})</h3>
                            <ContentManageList
                                items={articleList}
                                loading={articleListLoading}
                                onToggleVisibility={(item) => toggleVisibility(toggleArticleVisibility, item)}
                                onDelete={(item) => deleteItem(deleteArticle, item)}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'posts' && (
                    <div className="grid gap-6">
                        <form onSubmit={handlePostSubmit} className={formCardClass}>
                            <h3 className="text-lg font-bold">نشر تحديث</h3>

                            <Input
                                label="المحتوى"
                                textarea
                                rows={4}
                                value={postForm.content}
                                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                                required
                            />
                            <Input
                                label="تاريخ النشر"
                                type="date"
                                value={postForm.publishDate}
                                onChange={(e) => setPostForm({ ...postForm, publishDate: e.target.value })}
                            />

                            <Button type="submit">نشر</Button>
                        </form>

                        <div>
                            <h3 className="text-lg font-bold mb-3">منشوراتي ({postList.length})</h3>
                            <ContentManageList
                                items={postList}
                                loading={postListLoading}
                                getLabel={(item) => item.content?.length > 60 ? `${item.content.substring(0, 60)}...` : item.content}
                                onToggleVisibility={(item) => toggleVisibility(togglePostVisibility, item)}
                                onDelete={(item) => deleteItem(deletePost, item)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChannelManage;
