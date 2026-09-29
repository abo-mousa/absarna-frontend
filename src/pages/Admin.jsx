import { Link } from 'react-router-dom';
import { Video, BookOpen, FileText, Tv, Shield, ShieldCheck, Flag, Bell, ArrowLeft } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import AdminNav from '../components/admin/AdminNav';
import { QueryState } from '../components/ui';
import { usePageMeta } from '../hooks/usePageMeta';
import { useStats } from '../hooks/useAdminData';
import { useAdminAttention } from '../hooks/useAdminAttention';
import { dateLocale, parseTimestamp } from '@/lib/datetime';
import { formatCount } from '@/lib/numbers';
import { t } from '@/i18n';

const waitingSince = (value) => {
    if (!value) return null;
    const at = parseTimestamp(value).locale(dateLocale());
    return at.isValid() ? at.fromNow() : null;
};

/**
 * The admin's front page: the three queues and how long their front has waited.
 *
 * <p>It used to be five catalogue totals and a second, poorer copy of the pending-channel queue —
 * no link to the channel, no reason line. Neither was work: a count of videos on the platform
 * tells an admin nothing to do next, and the queue is on its own page with everything that
 * page has. What an admin opening this needs is the answer to one question, "is anything
 * waiting on me, and for how long" — which is what `/api/admin/attention` returns, and what the
 * cards below show, each leading to the page where the work is. The catalogue totals stay as a
 * quiet line at the bottom, because "how big is the platform" is still occasionally asked.
 */
function Admin() {
    usePageMeta({ title: t('admin.title') });
    const { data: stats = {} } = useStats();
    const { data: attention, isLoading, isError, error, refetch } = useAdminAttention();

    const queues = [
        {
            id: 'channels',
            to: '/admin/channels',
            icon: Tv,
            label: t('admin.overview.pendingChannels'),
            count: attention?.pendingChannels ?? 0,
            since: attention?.oldestPendingChannelAt,
            hint: t('admin.overview.pendingChannelsHint'),
        },
        {
            id: 'held',
            to: '/admin/review',
            icon: ShieldCheck,
            label: t('admin.overview.held'),
            count: attention?.reviewHeld ?? 0,
            since: attention?.oldestFindingAt,
            hint: t('admin.overview.heldHint', {
                notes: formatCount(Math.max(0, (attention?.reviewBacklog ?? 0) - (attention?.reviewHeld ?? 0))),
            }),
        },
        {
            id: 'reports',
            to: '/admin/reports',
            icon: Flag,
            label: t('admin.overview.openReports'),
            count: attention?.openReports ?? 0,
            since: attention?.oldestOpenReportAt,
            hint: t('admin.overview.openReportsHint'),
        },
    ];

    const catalogue = [
        { icon: Video, label: t('admin.stats.videos'), value: stats.videos },
        { icon: BookOpen, label: t('admin.stats.books'), value: stats.books },
        { icon: FileText, label: t('admin.stats.articles'), value: stats.articles },
        { icon: Tv, label: t('admin.stats.activeChannels'), value: stats.activeChannels },
    ];

    return (
        <PageShell>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
                <AdminNav current="overview" />

                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 mb-2">
                    <Shield size={24} /> {t('admin.title')}
                </h1>
                <p className="text-text-secondary mb-6">{t('admin.overview.intro')}</p>

                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Bell size={18} /> {t('admin.overview.queues')}
                </h2>
                <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
                    <div className="grid gap-4 sm:grid-cols-3 mb-8">
                        {queues.map((queue) => {
                            const since = waitingSince(queue.since);
                            const empty = queue.count === 0;
                            return (
                                <Link
                                    key={queue.id}
                                    to={queue.to}
                                    className={`block rounded-lg border p-4 transition-colors hover:bg-surface-hover ${
                                        empty ? 'border-border-light bg-surface' : 'border-gold bg-gold/5'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            empty ? 'bg-surface-hover text-text-muted' : 'bg-gold text-gray-900'
                                        }`}>
                                            <queue.icon size={20} />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold leading-none">{formatCount(queue.count)}</div>
                                            <div className="text-text-muted text-xs mt-1">{queue.label}</div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-secondary">
                                        {empty
                                            ? t('admin.overview.nothingWaiting')
                                            : since
                                                ? t('admin.overview.waitingSince', { when: since })
                                                : queue.hint}
                                    </p>
                                    {!empty && <p className="text-xs text-text-muted mt-1">{queue.hint}</p>}
                                    <p className="text-xs font-semibold text-primary mt-2 inline-flex items-center gap-1">
                                        {t('admin.overview.open')}
                                        <ArrowLeft size={12} className="ltr:rotate-180" aria-hidden="true" />
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                </QueryState>

                <h2 className="text-sm font-bold text-text-muted mb-2">{t('admin.overview.catalogue')}</h2>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
                    {catalogue.map((card) => (
                        <span key={card.label} className="inline-flex items-center gap-1.5">
                            <card.icon size={14} aria-hidden="true" />
                            <span className="font-semibold">{formatCount(card.value ?? 0)}</span>
                            {card.label}
                        </span>
                    ))}
                </div>
            </div>
        </PageShell>
    );
}

export default Admin;
