import { useState, useEffect } from 'react';
import { useBiography, useUpdateBiography } from '../../hooks/useAdminData';
import { Input, Button, Spinner } from '../ui';

function BiographyTab({ showMessage }) {
    const { data: biographyData, isLoading } = useBiography();
    const updateBiographyMutation = useUpdateBiography();

    const [biography, setBiography] = useState({
        fullName: 'محمد إلهامي', shortBio: '', detailedBio: '',
        photoUrl: '', education: '', occupation: '', email: '',
        patreonUrl: '', youtubeUrl: '', telegramUrl: '',
    });

    useEffect(() => {
        if (biographyData) setBiography(biographyData);
    }, [biographyData]);

    const saveBiography = async (e) => {
        e.preventDefault();
        try {
            await updateBiographyMutation.mutateAsync(biography);
            showMessage('✅ تم حفظ السيرة الذاتية');
        } catch (err) {
            showMessage('❌ فشل في الحفظ');
        }
    };

    if (isLoading) return <Spinner />;

    return (
        <form onSubmit={saveBiography} className="grid gap-4 bg-surface p-6 rounded-xl border border-border-light">
            <h3 className="text-lg font-bold">السيرة الذاتية</h3>
            <Input value={biography.fullName} onChange={(e) => setBiography({ ...biography, fullName: e.target.value })} />
            <Input textarea rows={3} placeholder="نبذة قصيرة" value={biography.shortBio} onChange={(e) => setBiography({ ...biography, shortBio: e.target.value })} />
            <Input textarea rows={10} placeholder="السيرة التفصيلية" value={biography.detailedBio} onChange={(e) => setBiography({ ...biography, detailedBio: e.target.value })} />
            <Input placeholder="المؤهلات العلمية" value={biography.education} onChange={(e) => setBiography({ ...biography, education: e.target.value })} />
            <Input placeholder="المهنة" value={biography.occupation} onChange={(e) => setBiography({ ...biography, occupation: e.target.value })} />
            <Input dir="ltr" placeholder="البريد الإلكتروني" value={biography.email} onChange={(e) => setBiography({ ...biography, email: e.target.value })} />
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
                <Input dir="ltr" placeholder="Patreon" value={biography.patreonUrl} onChange={(e) => setBiography({ ...biography, patreonUrl: e.target.value })} />
                <Input dir="ltr" placeholder="YouTube" value={biography.youtubeUrl} onChange={(e) => setBiography({ ...biography, youtubeUrl: e.target.value })} />
                <Input dir="ltr" placeholder="Telegram" value={biography.telegramUrl} onChange={(e) => setBiography({ ...biography, telegramUrl: e.target.value })} />
            </div>
            <Button type="submit">حفظ السيرة الذاتية</Button>
        </form>
    );
}

export default BiographyTab;
