import { useState } from 'react';
import { Clock, Folder } from 'lucide-react';
import api from '@/lib/api/client';
import { useVideos, useCreateVideo, useDeleteVideo } from '../../hooks/useAdminData';
import { Input, Button } from '../ui';

const fieldClass = 'w-full px-3.5 py-2.5 rounded-md border border-border outline-none focus:border-primary transition-colors';

function VideosTab({ showMessage }) {
    const [videoForm, setVideoForm] = useState({
        title: '', description: '', sourceType: 'LOCAL', sourceUrl: '',
        thumbnailUrl: '', duration: '', category: '', series: '', speaker: 'محمد إلهامي',
        publishDate: '', isFeatured: false,
    });
    const [videoUploading, setVideoUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const { data: videos = [] } = useVideos();
    const createVideoMutation = useCreateVideo();
    const deleteVideoMutation = useDeleteVideo();

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setVideoUploading(true);
            setUploadProgress(0);

            const res = await api.post('/admin/upload-video', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                },
            });

            setVideoForm({
                ...videoForm,
                sourceType: 'LOCAL',
                sourceUrl: res.data.fileUrl,
                thumbnailUrl: res.data.thumbnailUrl || '',
                duration: res.data.duration || '',
                title: file.name.replace(/\.[^/.]+$/, ''),
            });

            showMessage(res.data.duration ? `✅ تم رفع الفيديو (المدة: ${res.data.duration})` : '✅ تم رفع الفيديو بنجاح');
        } catch (err) {
            showMessage('❌ فشل في رفع الفيديو');
        } finally {
            setVideoUploading(false);
            setUploadProgress(0);
        }
    };

    const addVideo = async (e) => {
        e.preventDefault();
        try {
            await createVideoMutation.mutateAsync(videoForm);
            setVideoForm({ ...videoForm, title: '', description: '', sourceUrl: '', thumbnailUrl: '', duration: '', category: '', series: '', publishDate: '' });
            showMessage('✅ تمت إضافة الفيديو');
        } catch (err) {
            showMessage('❌ فشل في إضافة الفيديو');
        }
    };

    const deleteVideo = async (id) => {
        if (!window.confirm('حذف؟')) return;
        try {
            await deleteVideoMutation.mutateAsync(id);
            showMessage('🗑️ تم حذف الفيديو');
        } catch (err) {
            showMessage('❌ فشل في الحذف');
        }
    };

    return (
        <div>
            <div className="bg-surface p-6 rounded-xl border border-border-light mb-6">
                <h3 className="text-lg font-bold mb-3">رفع فيديو جديد</h3>
                <input type="file" accept="video/*" onChange={handleVideoUpload} disabled={videoUploading} className="mb-3" />
                {videoUploading && (
                    <div>
                        <p className="text-sm text-text-secondary mb-1">جاري الرفع... {uploadProgress}%</p>
                        <div className="w-full h-2.5 bg-border rounded-full">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={addVideo} className="grid gap-4 bg-surface p-6 rounded-xl border border-border-light mb-6">
                <h3 className="text-lg font-bold">معلومات الفيديو</h3>
                <Input placeholder="العنوان *" value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} required />
                <Input textarea rows={3} placeholder="الوصف" value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} />
                <Input dir="ltr" placeholder="رابط الفيديو" value={videoForm.sourceUrl} onChange={(e) => setVideoForm({ ...videoForm, sourceUrl: e.target.value })} />

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <select value={videoForm.sourceType} onChange={(e) => setVideoForm({ ...videoForm, sourceType: e.target.value })} className={fieldClass}>
                        <option value="LOCAL">ملف محلي</option>
                        <option value="YOUTUBE">يوتيوب</option>
                        <option value="TELEGRAM">تيليجرام</option>
                    </select>
                    <Input placeholder="التصنيف" value={videoForm.category} onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <Input dir="ltr" placeholder="المدة (تلقائي)" value={videoForm.duration} onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })} />
                    <input type="date" value={videoForm.publishDate} onChange={(e) => setVideoForm({ ...videoForm, publishDate: e.target.value })} className={fieldClass} />
                </div>

                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={videoForm.isFeatured} onChange={(e) => setVideoForm({ ...videoForm, isFeatured: e.target.checked })} />
                    فيديو مميز
                </label>
                <Button type="submit">إضافة الفيديو</Button>
            </form>

            <h3 className="text-lg font-bold mb-3">الفيديوهات ({videos.length})</h3>
            <div className="grid gap-2">
                {videos.map((v) => (
                    <div key={v.id} className="flex justify-between items-center p-4 bg-surface rounded-md border border-border-light">
                        <div>
                            <strong>{v.title}</strong>
                            <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                                <span>{v.sourceType === 'LOCAL' ? 'محلي' : v.sourceType}</span>
                                {v.duration && <span className="flex items-center gap-1"><Clock size={13} /> {v.duration}</span>}
                                {v.category && <span className="flex items-center gap-1"><Folder size={13} /> {v.category}</span>}
                            </div>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => deleteVideo(v.id)}>حذف</Button>
                    </div>
                ))}
                {videos.length === 0 && <p className="text-center text-text-secondary py-5">لا توجد فيديوهات</p>}
            </div>
        </div>
    );
}

export default VideosTab;
