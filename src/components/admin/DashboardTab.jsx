import { useStats } from '../../hooks/useAdminData';
import { Spinner } from '../ui';

const cards = [
    { key: 'videos', label: 'فيديو', color: 'text-[#1a56db]' },
    { key: 'books', label: 'كتاب', color: 'text-gold' },
    { key: 'articles', label: 'مقال', color: 'text-emerald-600' },
];

function DashboardTab() {
    const { data: stats = {}, isLoading } = useStats();

    if (isLoading) return <Spinner />;

    return (
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-5">
            {cards.map(({ key, label, color }) => (
                <div key={key} className="bg-surface p-6 rounded-xl text-center border border-border-light">
                    <div className={`text-4xl font-bold ${color}`}>{stats[key] || 0}</div>
                    <div className="text-text-secondary mt-1">{label}</div>
                </div>
            ))}
        </div>
    );
}

export default DashboardTab;
