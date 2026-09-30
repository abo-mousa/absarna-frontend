import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ExternalLink, LayoutDashboard, Mail, ShieldCheck, ShieldOff, UserRound } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import AdminNav from '../components/admin/AdminNav';
import { Badge, Button, Pager, QueryState, SearchField } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useEmptyPageStepBack } from '../hooks/useEmptyPageStepBack';
import { useAdminUser, useAdminUsers, useUpdateUserRole } from '../hooks/useAdminData';
import { statusLabel } from '@/lib/channelStatus';
import { describeError } from '@/lib/describeError';
import { dateLocale, parseTimestamp } from '@/lib/datetime';
import { reasonLabel, reportLink, statusLabel as reportStatusLabel, targetTypeLabel } from '@/lib/reports';
import { formatCount } from '@/lib/numbers';
import { t } from '@/i18n';

/** A report's statuses in the order they are worked, each with the badge colour it carries here. */
const REPORT_STATUSES = [
    { key: 'OPEN', variant: 'featured' },
    { key: 'ACTIONED', variant: 'danger' },
    { key: 'DISMISSED', variant: 'muted' },
];

const ROLES = ['USER', 'CREATOR', 'CHANNEL_ADMIN', 'PLATFORM_ADMIN'];
const ROLE_VARIANT = { PLATFORM_ADMIN: 'danger', CHANNEL_ADMIN: 'featured', CREATOR: 'success', USER: 'muted' };
const CHANNEL_VARIANT = { PENDING: 'featured', ACTIVE: 'success', REJECTED: 'danger', SUSPENDED: 'muted' };

const formatMoment = (value) => {
    if (!value) return '';
    const at = parseTimestamp(value).locale(dateLocale());
    return at.isValid() ? at.format(t('adminReports.dateFormat')) : '';
};

const roleLabel = (role) => t(`adminUsers.roles.${role}`);

function UserBadges({ user }) {
    return (
        <span className="inline-flex gap-1.5 flex-wrap">
            <Badge variant={ROLE_VARIANT[user.role] ?? 'muted'}>{roleLabel(user.role)}</Badge>
            <Badge variant={user.emailVerified ? 'success' : 'muted'}>
                {user.emailVerified ? t('adminUsers.verified') : t('adminUsers.unverified')}
            </Badge>
            {!user.active && <Badge variant="danger">{t('adminUsers.inactive')}</Badge>}
        </span>
    );
}

/**
 * One account, in full: who they are, what they own, what they reported and how that ended.
 *
 * <p>This is the page a moderator reaches from "reporter: …" on a report and from the owner
 * link on a channel row, and the one place a role can be changed. It shows nothing from the
 * reader's private history — what a person watched is nobody's business here.
 */
function UserDetail({ id }) {
    const { showToast } = useToast();
    const { data, isLoading, isError, error, refetch } = useAdminUser(id);
    const updateRole = useUpdateUserRole();
    const [role, setRole] = useState(null);

    const user = data?.user;
    const chosenRole = role ?? user?.role ?? 'USER';

    const saveRole = () => {
        updateRole.mutate({ id: user.id, role: chosenRole }, {
            onSuccess: () => {
                showToast(t('adminUsers.roleSaved'), 'success');
                setRole(null);
            },
            onError: (err) => showToast(describeError(err, t('adminUsers.roleFailed')), 'error'),
        });
    };

    return (
        <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            {user && (
                <div className="grid gap-6">
                    <section className="bg-surface border border-border-light rounded-lg p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <UserRound size={18} /> {user.username}
                                    <span className="text-text-muted text-sm font-normal">#{user.id}</span>
                                </h2>
                                <p dir="ltr" className="text-sm text-text-secondary inline-flex items-center gap-1.5 mt-1">
                                    <Mail size={14} aria-hidden="true" /> {user.email}
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                    {t('adminUsers.joined', { date: formatMoment(user.createdAt) })}
                                    {data.locale ? ` · ${String(data.locale).toUpperCase()}` : ''}
                                </p>
                            </div>
                            <UserBadges user={user} />
                        </div>

                        <div className="mt-4 pt-4 border-t border-border-light flex items-end gap-3 flex-wrap">
                            <div>
                                <label htmlFor="admin-user-role" className="block text-xs font-semibold mb-1.5">
                                    {t('adminUsers.roleLabel')}
                                </label>
                                <select
                                    id="admin-user-role"
                                    value={chosenRole}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm outline-none focus:border-primary transition-colors"
                                >
                                    {ROLES.map((value) => (
                                        <option key={value} value={value}>{roleLabel(value)}</option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                size="sm"
                                onClick={saveRole}
                                disabled={chosenRole === user.role || updateRole.isPending}
                                icon={chosenRole === 'PLATFORM_ADMIN' ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                            >
                                {t('adminUsers.saveRole')}
                            </Button>
                            <p className="text-xs text-text-muted basis-full">{t('adminUsers.roleHint')}</p>
                        </div>
                        {data.roleChanges?.length > 0 && (
                            <ul className="grid gap-1 mt-3 text-xs text-text-secondary">
                                {data.roleChanges.map((change, index) => (
                                    <li key={`${change.changedAt}-${index}`}>
                                        {t('adminUsers.roleChange', {
                                            from: change.fromRole ? roleLabel(change.fromRole) : '—',
                                            to: roleLabel(change.toRole),
                                            by: change.actorUsername ?? t('adminUsers.roleChangeUnknownActor'),
                                        })}
                                        {' · '}
                                        <span className="text-text-muted">{formatMoment(change.changedAt)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section>
                        <h3 className="text-base font-bold mb-2">{t('adminUsers.channels', { count: data.channels.length })}</h3>
                        {data.channels.length === 0 ? (
                            <p className="text-sm text-text-muted">{t('adminUsers.noChannels')}</p>
                        ) : (
                            <ul className="grid gap-2">
                                {data.channels.map((channel) => (
                                    <li key={channel.id} className="bg-surface border border-border-light rounded-lg p-3 flex items-center gap-3 flex-wrap">
                                        <Link to={`/channel/${channel.slug}`} className="font-semibold hover:text-primary hover:underline inline-flex items-center gap-1">
                                            {channel.name} <ExternalLink size={13} aria-hidden="true" />
                                        </Link>
                                        <span className="text-xs text-text-muted">@{channel.slug}</span>
                                        <Badge variant={CHANNEL_VARIANT[channel.status] ?? 'muted'}>{statusLabel(channel.status)}</Badge>
                                        <Link to={`/channel/${channel.slug}/manage`} className="text-xs text-primary font-semibold inline-flex items-center gap-1 ms-auto">
                                            <LayoutDashboard size={13} aria-hidden="true" /> {t('adminUsers.openDashboard')}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section>
                        <h3 className="text-base font-bold mb-2">{t('adminUsers.reports')}</h3>
                        {/* One badge per status that has any, in the colours the report badges
                            below use. Not a dotted line of counts: the Arabic zero «٠» is itself a
                            dot, so «٠ مفتوحة · ٠ …» read as a row of dots — and a zero says nothing
                            the list under it does not. */}
                        {REPORT_STATUSES.some(({ key }) => (data.reportsFiled?.[key] ?? 0) > 0) && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {REPORT_STATUSES.filter(({ key }) => (data.reportsFiled?.[key] ?? 0) > 0).map(({ key, variant }) => (
                                    <Badge key={key} variant={variant}>
                                        {t('adminUsers.statusCount', {
                                            status: reportStatusLabel(key),
                                            count: formatCount(data.reportsFiled[key]),
                                        })}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        {data.reportsDecided > 0 && (
                            <p className="text-sm text-text-secondary mb-3">
                                {t('adminUsers.reportsDecided', { count: formatCount(data.reportsDecided) })}
                            </p>
                        )}
                        {data.recentReports.length === 0 ? (
                            <p className="text-sm text-text-muted">{t('adminUsers.noReports')}</p>
                        ) : (
                            <ul className="grid gap-2">
                                {data.recentReports.map((report) => {
                                    const link = reportLink(report);
                                    return (
                                        <li key={report.id} className="bg-surface border border-border-light rounded-lg p-3 text-sm">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <strong>{reasonLabel(report.reason)}</strong>
                                                <Badge variant="muted">{targetTypeLabel(report.targetType)}</Badge>
                                                <Badge variant={REPORT_STATUSES.find(({ key }) => key === report.status)?.variant ?? 'muted'}>
                                                    {reportStatusLabel(report.status)}
                                                </Badge>
                                                <span className="text-xs text-text-muted">{formatMoment(report.createdAt)}</span>
                                                {link && (
                                                    <Link to={link} className="text-xs text-primary font-semibold ms-auto inline-flex items-center gap-1">
                                                        <ExternalLink size={12} aria-hidden="true" /> {t('adminReports.openTarget')}
                                                    </Link>
                                                )}
                                            </div>
                                            {report.targetTitle && <p dir="auto" className="text-text-secondary mt-1 line-clamp-1">{report.targetTitle}</p>}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>
            )}
        </QueryState>
    );
}

/**
 * The platform admin's user lookup — a search by name or address, and one account in full.
 *
 * <p>Until this there was no user administration at all: "reporter #12" on a report and the
 * owner id on a channel row led nowhere, and the one lever against an abusive account was
 * deleting their channel. Read-mostly on purpose; the role change is the one write, because the
 * endpoint existed and had no screen.
 */
function AdminUsers() {
    usePageMeta({ title: t('adminUsers.title') });
    const { id } = useParams();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const debounced = useDebouncedValue(search.trim(), 300);
    const { data, isLoading, isError, error, refetch } = useAdminUsers(debounced, page);
    useEmptyPageStepBack(page, setPage, data, isLoading);
    const rows = data?.content ?? [];

    return (
        <PageShell>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <AdminNav current="users" />

                {id ? (
                    <>
                        <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-4">
                            <ArrowRight size={14} className="ltr:rotate-180" aria-hidden="true" />
                            {t('adminUsers.back')}
                        </Link>
                        <UserDetail id={id} />
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                            <h1 className="text-xl sm:text-2xl font-bold">{t('adminUsers.title')}</h1>
                            <SearchField
                                value={search}
                                onChange={(value) => { setPage(0); setSearch(value); }}
                                placeholder={t('adminUsers.searchPlaceholder')}
                                className="min-w-[260px]"
                                autoFocus
                            />
                        </div>
                        <p className="text-text-secondary text-sm mb-4">{t('adminUsers.intro')}</p>

                        <QueryState
                            isLoading={isLoading}
                            isError={isError}
                            error={error}
                            onRetry={refetch}
                            isEmpty={rows.length === 0}
                            emptyIcon={UserRound}
                            emptyTitle={t('adminUsers.empty')}
                        >
                            <p className="text-xs text-text-muted mb-2">{t('adminUsers.count', { count: formatCount(data?.totalItems ?? 0) })}</p>
                            <ul className="grid gap-2">
                                {rows.map((user) => (
                                    <li key={user.id}>
                                        <Link
                                            to={`/admin/users/${user.id}`}
                                            className="flex items-center gap-3 flex-wrap bg-surface border border-border-light rounded-lg p-3 hover:bg-surface-hover transition-colors"
                                        >
                                            <span className="font-semibold">{user.username}</span>
                                            <span dir="ltr" className="text-sm text-text-muted">{user.email}</span>
                                            <span className="ms-auto"><UserBadges user={user} /></span>
                                            <span className="text-xs text-text-muted basis-full sm:basis-auto">
                                                {t('adminUsers.joined', { date: formatMoment(user.createdAt) })}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </QueryState>
                        <Pager
                            page={data?.currentPage ?? page}
                            totalPages={data?.totalPages ?? 0}
                            hasPrevious={data?.hasPrevious ?? page > 0}
                            hasNext={data?.hasNext ?? false}
                            onChange={setPage}
                        />
                    </>
                )}
            </div>
        </PageShell>
    );
}

export default AdminUsers;
