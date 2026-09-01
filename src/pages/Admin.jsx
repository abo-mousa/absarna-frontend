import { Link } from 'react-router-dom';
import { Video, BookOpen, FileText, Tv, Bell, Shield, Check, X } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { Button } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { useStats } from '../hooks/useAdminData';
import { usePendingChannels, useApproveChannel, useRejectChannel } from '../hooks/useChannels';

function Admin() {
    usePageMeta({ title: 'لوحة التحكم' });
    const { showToast } = useToast();
    const { data: stats = {} } = useStats();
    const { data: pendingChannels = [] } = usePendingChannels();
    const approveChannel = useApproveChannel();
    const rejectChannel = useRejectChannel();

    const handleApprove = (id) => {
        approveChannel.mutate(id, { onError: () => showToast('فشل في الموافقة', 'error') });
    };

    const handleReject = (id) => {
        rejectChannel.mutate(id, { onError: () => showToast('فشل في الرفض', 'error') });
    };

    const statCards = [
        { icon: Video, label: 'فيديوهات', value: stats.videos || 0, color: 'bg-primary' },
        { icon: BookOpen, label: 'كتب', value: stats.books || 0, color: 'bg-gold' },
        { icon: FileText, label: 'مقالات', value: stats.articles || 0, color: 'bg-emerald-600' },
        { icon: Tv, label: 'قنوات نشطة', value: stats.activeChannels || 0, color: 'bg-[#1a56db]' },
        { icon: Bell, label: 'بانتظار الموافقة', value: stats.pendingChannels || 0, color: 'bg-[#D97706]' },
    ];

    return (
        <div className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
                <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Shield size={24} /> لوحة التحكم
                    </h1>
                    <Link to="/admin/channels" className="px-5 py-2.5 bg-primary text-white rounded-md font-semibold">
                        إدارة القنوات
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    {statCards.map((card, i) => (
                        <div key={i} className="flex items-center gap-3 bg-surface p-4 rounded-lg border border-border-light">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0 ${card.color}`}>
                                <card.icon size={22} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <div className="text-text-muted text-xs">{card.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Bell size={18} /> قنوات بانتظار الموافقة
                </h2>

                {pendingChannels.length === 0 ? (
                    <div className="bg-surface p-6 rounded-lg text-center text-text-muted border border-border-light">
                        لا توجد قنوات بانتظار الموافقة
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {pendingChannels.map((channel) => (
                            <div key={channel.id} className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border-light flex-wrap">
                                <div
                                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                                    style={{ background: channel.primaryColor || '#0D6B4D' }}
                                >
                                    {channel.name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                    <strong>{channel.name}</strong>
                                    <p className="text-sm text-text-muted">@{channel.slug}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="primary" size="sm" onClick={() => handleApprove(channel.id)} icon={<Check size={14} />}>
                                        موافقة
                                    </Button>
                                    <Button variant="danger" size="sm" onClick={() => handleReject(channel.id)} icon={<X size={14} />}>
                                        رفض
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Admin;
