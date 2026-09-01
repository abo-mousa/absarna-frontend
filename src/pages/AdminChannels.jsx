import { Check, X, Pause } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { Spinner, Avatar, Badge, Button } from '../components/ui';
import {
    usePendingChannels,
    useAllAdminChannels,
    useApproveChannel,
    useRejectChannel,
    useSuspendChannel,
} from '../hooks/useChannels';

const STATUS_VARIANT = {
    PENDING: 'featured',
    ACTIVE: 'success',
    REJECTED: 'danger',
    SUSPENDED: 'muted',
};

const STATUS_LABEL = {
    PENDING: 'بانتظار الموافقة',
    ACTIVE: 'نشط',
    REJECTED: 'مرفوض',
    SUSPENDED: 'معلق',
};

function AdminChannels() {
    const { data: pendingChannels = [], isLoading: pendingLoading } = usePendingChannels();
    const { data: allChannels = [], isLoading: allLoading } = useAllAdminChannels();
    const approveChannel = useApproveChannel();
    const rejectChannel = useRejectChannel();
    const suspendChannel = useSuspendChannel();

    const loading = pendingLoading || allLoading;

    const handleApprove = (id) => {
        approveChannel.mutate(id, { onError: () => alert('فشل في الموافقة') });
    };

    const handleReject = (id) => {
        rejectChannel.mutate(id, { onError: () => alert('فشل في الرفض') });
    };

    const handleSuspend = (id) => {
        suspendChannel.mutate(id, { onError: () => alert('فشل في التعليق') });
    };

    if (loading) {
        return (
            <div dir="rtl" className="min-h-screen bg-bg">
                <Navbar />
                <Spinner />
            </div>
        );
    }

    return (
        <div dir="rtl" className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">
                <h1 className="text-xl font-bold mb-6">إدارة القنوات</h1>

                <h2 className="text-base font-bold mb-3">بانتظار الموافقة ({pendingChannels.length})</h2>

                {pendingChannels.length === 0 ? (
                    <p className="text-text-muted mb-8">لا توجد قنوات بانتظار الموافقة</p>
                ) : (
                    <div className="grid gap-3 mb-8">
                        {pendingChannels.map((channel) => (
                            <div key={channel.id} className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border-light flex-wrap">
                                <Avatar name={channel.name} color={channel.primaryColor} />
                                <div className="flex-1 min-w-[150px]">
                                    <strong>{channel.name}</strong>
                                    <p className="text-sm text-text-muted">@{channel.slug}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleApprove(channel.id)} icon={<Check size={14} />}>موافقة</Button>
                                    <Button variant="danger" size="sm" onClick={() => handleReject(channel.id)} icon={<X size={14} />}>رفض</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <h2 className="text-base font-bold mb-3">جميع القنوات ({allChannels.length})</h2>

                <div className="grid gap-3">
                    {allChannels.map((channel) => (
                        <div key={channel.id} className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border-light flex-wrap">
                            <Avatar name={channel.name} color={channel.primaryColor} />
                            <div className="flex-1 min-w-[150px]">
                                <strong>{channel.name}</strong>
                                <p className="text-sm text-text-muted">@{channel.slug}</p>
                            </div>
                            <Badge variant={STATUS_VARIANT[channel.status]}>{STATUS_LABEL[channel.status]}</Badge>
                            {channel.status === 'ACTIVE' && (
                                <Button size="sm" onClick={() => handleSuspend(channel.id)} icon={<Pause size={14} />} className="!bg-gold hover:!bg-gold">
                                    تعليق
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AdminChannels;
