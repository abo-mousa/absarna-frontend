import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Video, BookOpen, FileText, MessageSquare, Settings, Save, ArrowRight, Eye, EyeOff, Trash2, Tv, Plus, Pin, PinOff } from 'lucide-react';
import api from '@/lib/api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageShell from '../components/layout/PageShell';
import { QueryState, Input, Button } from '../components/ui';
import { canManageChannel } from '@/lib/user';
import {
    useChannel,
    useUpdateChannel,
    useChannelContentList,
    useCreateChannelContent,
    useToggleContentVisibility,
    useDeleteContent,
} from '../hooks/useChannels';
import { useChannelSeriesManage, useCreateSeries, useDeleteSeries } from '../hooks/useSeries';
import { usePresignedUpload } from '../hooks/usePresignedUpload';
import { useChannelComments, useModerateComment } from '../hooks/useCommentModeration';

const TABS = [
    { id: 'overview', label: 'نظرة عامة', icon: Settings },
    { id: 'videos', label: 'الفيديوهات', icon: Video },
    { id: 'books', label: 'الكتب', icon: BookOpen },
    { id: 'articles', label: 'المقالات', icon: FileText },
    { id: 'posts', label: 'المنشورات', icon: MessageSquare },
    { id: 'series', label: 'السلاسل', icon: Tv },
    { id: 'comments', label: 'التعليقات', icon: MessageSquare },
];

function ErrorScreen({ emoji, title, description, onBack }) {
    return (
        <PageShell sidebar={false}>
            <div className="max-w-[600px] mx-auto my-16 sm:my-20 p-8 sm:p-10 text-center bg-surface rounded-lg shadow-md border border-border-light">
                <div className="text-5xl mb-4">{emoji}</div>
                <h2 className="text-xl font-bold mb-2">{title}</h2>
                <p className="text-text-muted">{description}</p>
                <Button className="mt-5" onClick={onBack}>العودة للرئيسية</Button>
            </div>
        </PageShell>
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
                            aria-label={item.visible ? 'إخفاء عن الزوار' : 'إظهار للزوار'}
                            className="p-2 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        >
                            {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                            onClick={() => onDelete(item)}
                            title="حذف"
                            aria-label="حذف"
                            className="p-2 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
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

    // sourceType/sourceUrl stay for the external-URL path (a YouTube link, say); a
    // presigned upload sets uploadSessionId instead. The create endpoint requires exactly one of
    // the two shapes, which is why neither is pre-filled any more.
    const [videoForm, setVideoForm] = useState({
        title: '', description: '', sourceType: '', sourceUrl: '', uploadSessionId: '',
        category: '', seriesId: '', orderInSeries: '', originalPublishDate: '',
    });
    const [videoUploading, setVideoUploading] = useState(false);
    const videoUpload = usePresignedUpload();
    // Progress now comes from the hook, which counts bytes actually accepted by object storage
    // rather than bytes handed to axios.
    const uploadProgress = videoUpload.progress;

    const [bookForm, setBookForm] = useState({
        title: '', description: '', pdfUrl: '', uploadSessionId: '', previewImageUrl: '',
        category: '', originalPublishDate: '', pages: '',
    });
    const bookUpload = usePresignedUpload();
    const [bookUploading, setBookUploading] = useState(false);

    const [articleForm, setArticleForm] = useState({
        title: '', content: '', category: '', originalPublishDate: '',
    });

    const [postForm, setPostForm] = useState({ content: '' });

    const { data: videoList = [], isLoading: videoListLoading } = useChannelContentList(slug, 'videos', activeTab === 'videos');
    const { data: bookList = [], isLoading: bookListLoading } = useChannelContentList(slug, 'books', activeTab === 'books');
    const { data: articleList = [], isLoading: articleListLoading } = useChannelContentList(slug, 'articles', activeTab === 'articles');
    const { data: postList = [], isLoading: postListLoading } = useChannelContentList(slug, 'posts', activeTab === 'posts');
    const { data: seriesList = [], isLoading: seriesListLoading } = useChannelSeriesManage(
        slug, activeTab === 'videos' || activeTab === 'series'
    );
    const {
        data: commentPages,
        isLoading: commentsLoading,
        fetchNextPage: fetchNextCommentsPage,
        hasNextPage: hasNextCommentsPage,
        isFetchingNextPage: isFetchingNextCommentsPage,
    } = useChannelComments(slug, 50, activeTab === 'comments');
    const channelComments = commentPages?.pages.flatMap((page) => page.content) || [];
    const channelCommentsCount = commentPages?.pages[0]?.totalItems ?? channelComments.length;

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
    const createSeries = useCreateSeries(slug);
    const deleteSeriesMutation = useDeleteSeries(slug);
    const moderateComment = useModerateComment(slug);

    const [seriesForm, setSeriesForm] = useState({ title: '', description: '' });

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

    // An untouched date/number field is '' in form state; Jackson's coercion of "" into a
    // LocalDate/Integer on the backend is version-dependent, so strip empty strings rather
    // than send them and hope.
    const stripEmpty = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== ''));

    // A confirm that times out is not a confirm that failed. The backend may still be assembling
    // a multi-GB object, and the create endpoint is idempotent on the session — so pressing
    // publish again returns the row the first attempt created rather than duplicating it or
    // re-uploading a byte. The error path deliberately leaves uploadSessionId in form state so
    // that retry is one click away; saying "فشل" here would tell the user to start over instead.
    const publishError = (err, action) =>
        err.code === 'ECONNABORTED'
            ? `error:${action} يستغرق وقتًا أطول من المعتاد. لم يضِع ما رفعته — أعد المحاولة بعد قليل.`
            : `error:فشل في ${action}: ${err.response?.data?.message || err.message}`;

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

    // Presigned direct-to-storage upload: bytes go from the browser to object storage and never
    // through the backend, which only signs part URLs. Nothing exists as content until
    // handleVideoSubmit sends the resulting uploadSessionId to the create endpoint — so an
    // abandoned upload leaves no row behind, and the "upload" step no longer returns a URL to
    // stuff into the form. It returns a session id instead.
    const handleVideoFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setVideoUploading(true);

        try {
            const uploadSessionId = await videoUpload.upload(file, { kind: 'videos', slug });
            setVideoForm({
                ...videoForm,
                // sourceType/sourceUrl are the server's to set on this path — the create request
                // rejects a payload carrying both a sourceUrl and an uploadSessionId.
                sourceType: '',
                sourceUrl: '',
                uploadSessionId,
                title: videoForm.title || file.name.replace(/\.[^/.]+$/, ''),
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
            await createVideo.mutateAsync({ ...stripEmpty(videoForm), speaker: channel.name });
            setVideoForm({
                title: '', description: '', sourceType: '', sourceUrl: '', uploadSessionId: '',
                category: '', seriesId: '', orderInSeries: '', originalPublishDate: '',
            });
            showMessage('success:تم نشر الفيديو');
        } catch (err) {
            showMessage(publishError(err, 'نشر الفيديو'));
        }
    };

    const handleSeriesSubmit = async (e) => {
        e.preventDefault();
        try {
            await createSeries.mutateAsync(stripEmpty(seriesForm));
            setSeriesForm({ title: '', description: '' });
            showMessage('success:تم إنشاء السلسلة');
        } catch (err) {
            showMessage(`error:فشل في إنشاء السلسلة: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDeleteSeries = (series) => {
        if (!window.confirm(`هل تريد حذف سلسلة "${series.title}"؟ ستبقى الفيديوهات نفسها، فقط تُفصل عن السلسلة.`)) return;
        deleteSeriesMutation.mutate(series.id, {
            onSuccess: () => showMessage('success:تم حذف السلسلة'),
            onError: () => showMessage('error:فشل في حذف السلسلة'),
        });
    };

    const handleModerate = (comment, changes) => {
        moderateComment.mutate({ id: comment.id, ...changes }, {
            onError: () => showMessage('error:فشل في تحديث التعليق'),
        });
    };

    const handleBookFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setBookUploading(true);

        try {
            // Same presigned direct-to-storage path as video, through the shared front door —
            // the backend only differs by allowlist and size cap. Unlike video there is no
            // transcode afterwards: the PDF is readable the moment the create call confirms it.
            const uploadSessionId = await bookUpload.upload(file, { kind: 'books', slug });
            setBookForm({
                ...bookForm,
                // pdfUrl stays empty — the create request rejects a payload carrying both a
                // pdfUrl and an uploadSessionId. Preview image and page count came from the old
                // server-side PDF processing, which went away with the upload module; a book
                // reads fine without either.
                pdfUrl: '',
                uploadSessionId,
                title: bookForm.title || file.name.replace(/\.[^/.]+$/, ''),
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
            await createBook.mutateAsync(stripEmpty(bookForm));
            setBookForm({ title: '', description: '', pdfUrl: '', uploadSessionId: '', previewImageUrl: '', category: '', originalPublishDate: '', pages: '' });
            showMessage('success:تم نشر الكتاب');
        } catch (err) {
            showMessage(publishError(err, 'نشر الكتاب'));
        }
    };

    const handleArticleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createArticle.mutateAsync(stripEmpty(articleForm));
            setArticleForm({ title: '', content: '', category: '', originalPublishDate: '' });
            showMessage('success:تم نشر المقال');
        } catch (err) {
            showMessage(`error:فشل في نشر المقال: ${err.response?.data?.message || err.message}`);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        try {
            await createPost.mutateAsync(stripEmpty(postForm));
            setPostForm({ content: '' });
            showMessage('success:تم نشر التحديث');
        } catch (err) {
            showMessage(`error:فشل في نشر التحديث: ${err.response?.data?.message || err.message}`);
        }
    };

    if (authLoading || channelLoading) {
        return (
            <PageShell sidebar={false}>
                <QueryState isLoading />
            </PageShell>
        );
    }

    if (channelError || !channel) {
        const description = channelFetchError?.response?.status === 404
            ? 'القناة غير موجودة'
            : 'لم نتمكن من العثور على هذه القناة';
        return <ErrorScreen emoji="🔍" title="القناة غير موجودة" description={description} onBack={() => navigate('/')} />;
    }

    if (!canManageChannel(user, channel)) {
        return <ErrorScreen emoji="⛔" title="غير مصرح لك" description="ليس لديك صلاحية لإدارة هذه القناة" onBack={() => navigate('/')} />;
    }

    const formCardClass = 'grid gap-4 bg-surface p-6 rounded-lg border border-border-light';

    return (
        <PageShell sidebar={false}>
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

                            <Input label="التصنيف" value={videoForm.category} onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })} />

                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1.5 font-semibold text-sm text-text-secondary">السلسلة (اختياري)</label>
                                    <select
                                        value={videoForm.seriesId}
                                        onChange={(e) => setVideoForm({ ...videoForm, seriesId: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-md border border-border outline-none focus:border-primary transition-colors bg-surface"
                                    >
                                        <option value="">بدون سلسلة</option>
                                        {seriesList.map((s) => (
                                            <option key={s.id} value={s.id}>{s.title}</option>
                                        ))}
                                    </select>
                                </div>
                                {videoForm.seriesId && (
                                    <Input
                                        label="الترتيب داخل السلسلة"
                                        type="number"
                                        min="1"
                                        value={videoForm.orderInSeries}
                                        onChange={(e) => setVideoForm({ ...videoForm, orderInSeries: e.target.value })}
                                    />
                                )}
                            </div>
                            <Input label="تاريخ النشر الأصلي (اختياري)" type="date" value={videoForm.originalPublishDate} onChange={(e) => setVideoForm({ ...videoForm, originalPublishDate: e.target.value })} />

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
                            <Input label="تاريخ النشر الأصلي (اختياري)" type="date" value={bookForm.originalPublishDate} onChange={(e) => setBookForm({ ...bookForm, originalPublishDate: e.target.value })} />

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
                                <Input label="تاريخ النشر الأصلي (اختياري)" type="date" value={articleForm.originalPublishDate} onChange={(e) => setArticleForm({ ...articleForm, originalPublishDate: e.target.value })} />
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

                {activeTab === 'series' && (
                    <div className="grid gap-6">
                        <form onSubmit={handleSeriesSubmit} className={formCardClass}>
                            <h3 className="text-lg font-bold">سلسلة جديدة</h3>
                            <Input
                                label="عنوان السلسلة"
                                value={seriesForm.title}
                                onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
                                required
                            />
                            <Input
                                label="الوصف"
                                textarea
                                rows={2}
                                value={seriesForm.description}
                                onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                            />
                            <Button type="submit" icon={<Plus size={18} />}>إنشاء السلسلة</Button>
                        </form>

                        <div>
                            <h3 className="text-lg font-bold mb-3">سلاسلي ({seriesList.length})</h3>
                            {seriesListLoading ? (
                                <p className="text-sm text-text-muted py-2">جاري التحميل...</p>
                            ) : seriesList.length === 0 ? (
                                <p className="text-sm text-text-muted py-4">لا توجد سلاسل بعد</p>
                            ) : (
                                <div className="grid gap-2">
                                    {seriesList.map((s) => (
                                        <div
                                            key={s.id}
                                            className="flex items-center justify-between gap-3 p-3 rounded-md border border-border-light bg-surface"
                                        >
                                            <div className="min-w-0">
                                                <strong className="block truncate">{s.title}</strong>
                                                <span className="text-xs text-text-muted">{s.contentCount ?? 0} فيديو</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSeries(s)}
                                                title="حذف السلسلة"
                                                aria-label="حذف السلسلة"
                                                className="p-2 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors flex-shrink-0"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'comments' && (
                    <div>
                        <h3 className="text-lg font-bold mb-3">تعليقات على محتوى قناتك ({channelCommentsCount})</h3>
                        {commentsLoading ? (
                            <p className="text-sm text-text-muted py-2">جاري التحميل...</p>
                        ) : channelComments.length === 0 ? (
                            <p className="text-sm text-text-muted py-4">لا توجد تعليقات بعد</p>
                        ) : (
                            <div className="grid gap-2">
                                {channelComments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={`p-3 rounded-md border border-border-light ${
                                            comment.hidden ? 'bg-surface-hover' : 'bg-surface'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-1.5">
                                            <div className="min-w-0">
                                                <strong className="text-primary text-sm">{comment.userName}</strong>
                                                {comment.hidden && (
                                                    <span className="mr-2 text-xs text-text-muted">(مخفي)</span>
                                                )}
                                                {comment.pinned && (
                                                    <span className="mr-2 text-xs text-gold">مثبّت</span>
                                                )}
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => handleModerate(comment, { pinned: !comment.pinned })}
                                                    title={comment.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                                                    aria-label={comment.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                                                    className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover hover:text-primary transition-colors"
                                                >
                                                    {comment.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => handleModerate(comment, { hidden: !comment.hidden })}
                                                    title={comment.hidden ? 'إظهار' : 'إخفاء'}
                                                    aria-label={comment.hidden ? 'إظهار' : 'إخفاء'}
                                                    className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                                                >
                                                    {comment.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                        <p className={`text-sm ${comment.hidden ? 'text-text-muted' : 'text-text-secondary'}`}>
                                            {comment.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {hasNextCommentsPage && (
                            <div className="text-center mt-6">
                                <button
                                    onClick={() => fetchNextCommentsPage()}
                                    disabled={isFetchingNextCommentsPage}
                                    className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                                >
                                    {isFetchingNextCommentsPage ? 'جاري التحميل...' : 'تحميل المزيد'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PageShell>
    );
}

export default ChannelManage;
