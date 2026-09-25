import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Check, ExternalLink, Users, X, Flag } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import AdminNav from '../components/admin/AdminNav';
import { Badge, Button, Pager, QueryState } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { useChannel } from '../hooks/useChannels';
import { useDecideReport, useReportQueue, useReportsForTarget } from '../hooks/useReports';
import {
    REPORT_STATUS,
    REPORT_TARGET_TYPE,
    corroboration,
    reasonLabel,
    statusLabel,
    targetPath,
    targetTypeLabel,
} from '@/lib/reports';
import { describeError } from '@/lib/describeError';
import { dateLocale, parseTimestamp } from '@/lib/datetime';
import { formatCount } from '@/lib/numbers';
import { t } from '@/i18n';

// Which statuses read as outstanding work. OPEN is the queue; the other two are a record of what
// was already decided, and colouring them the same would make a worked-through filter look like a
// backlog.
const STATUS_VARIANT = {
    [REPORT_STATUS.OPEN]: 'featured',
    [REPORT_STATUS.ACTIONED]: 'danger',
    [REPORT_STATUS.DISMISSED]: 'muted',
};

const STATUS_FILTERS = [REPORT_STATUS.OPEN, REPORT_STATUS.ACTIONED, REPORT_STATUS.DISMISSED];

const formatMoment = (value) => {
    if (!value) return '';
    // Zone-aware, for the same reason CommentsSection is: the backend's timestamps name no zone
    // and the servers run UTC. On a moderation queue the shift is worse than cosmetic — it is the
    // record of when a report came in.
    const moment = parseTimestamp(value).locale(dateLocale());
    return moment.isValid() ? moment.format(t('adminReports.dateFormat')) : '';
};

/**
 * A link to the reported thing.
 *
 * <p>Three of the five target types have a page of their own; a post is a card inside its
 * channel's page and a comment lives under whatever it was written on. For those two this falls
 * back to the <b>channel</b>, which is somewhere a moderator can actually act — the tools that
 * change anything (hide, delete, suspend) all live on a channel or a content page, never here.
 *
 * <p>The channel lookup is by id and costs nothing per extra row: `useChannel` is keyed by what it
 * is given, so every report against the same channel shares one cached query.
 */
function ReportedTarget({ targetType, targetId, channelId }) {
    const path = targetPath(targetType, targetId);
    // Enabled only where there is no direct route — an ordinary video report must not spend a
    // request learning a channel nobody is going to click.
    const { data: channel } = useChannel(channelId, !path && !!channelId);

    if (path) {
        return (
            <Link to={path} className="inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                <ExternalLink size={13} />
                {t('adminReports.openTarget')}
            </Link>
        );
    }
    if (channel?.slug) {
        return (
            <Link
                to={`/channel/${channel.slug}`}
                className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
            >
                <ExternalLink size={13} />
                {t('adminReports.openChannel')}
            </Link>
        );
    }
    return <span className="text-text-muted">{t('adminReports.noDirectLink')}</span>;
}

/**
 * The other complaints standing against the same target.
 *
 * <p>Fetched only once a moderator asks. `openReportsOnTarget` on the row already says how many
 * there are — that number is what turns a queue of separate objections into one case — and the
 * rest is worth a request only when someone is actually reading that case. Pre-fetching it per
 * row would be a request per row for a screen where most are never opened.
 */
function OtherReports({ targetType, targetId, excludeId }) {
    const { data = [], isLoading, isError } = useReportsForTarget(targetType, targetId);
    const others = data.filter((report) => report.id !== excludeId);

    if (isLoading) return <p className="text-xs text-text-muted mt-2">{t('common.loading')}</p>;
    if (isError) return <p className="text-xs text-text-muted mt-2">{t('adminReports.otherReportsFailed')}</p>;
    if (others.length === 0) return null;

    return (
        <div className="mt-3 pt-3 border-t border-border-light">
            <p className="text-xs font-semibold mb-2">{t('adminReports.otherReports')}</p>
            <ul className="grid gap-2">
                {others.map((report) => (
                    <li key={report.id} className="text-xs bg-surface-hover rounded-md p-2.5">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <strong>{reasonLabel(report.reason)}</strong>
                            <Badge variant={STATUS_VARIANT[report.status] ?? 'muted'}>
                                {statusLabel(report.status)}
                            </Badge>
                            <span className="text-text-muted">{formatMoment(report.createdAt)}</span>
                        </div>
                        <p className="text-text-secondary leading-relaxed">
                            {report.note || t('adminReports.noNote')}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * The platform's queue of viewer reports.
 *
 * <h2>What a decision here is, and what it is not</h2>
 *
 * <p><b>Deciding a report records a judgement. It does not touch the content.</b> Nothing is
 * hidden, deleted or suspended by pressing these buttons — those are separate actions, through
 * the tools that already exist, which is why every row links through to the reported item. This
 * is said at the top of the page and again beside the buttons, because a moderator who believes
 * «تم التصرف» took the video down, and is wrong, leaves reported content published while the
 * queue says it was handled. That is the worst thing this screen could be wrong about, and it is
 * a mistake the UI can only prevent by saying so.
 *
 * <p><b>Two terminal states, not one.</b> "I looked and acted" and "I looked and it was fine" are
 * the same amount of work and completely different facts, and they are the only measure of
 * whether reporting is working at all: a reporter whose reports are always dismissed is either
 * mistaken or abusing the button, and a target repeatedly actioned is a channel with a pattern.
 *
 * <p>Platform admin only, like the review queue and unlike comment moderation, which is
 * channel-scoped. A report is frequently ABOUT the channel that would otherwise be judging it.
 */
function AdminReports() {
    usePageMeta({ title: t('adminReports.title') });
    const { showToast } = useToast();

    const [statuses, setStatuses] = useState([REPORT_STATUS.OPEN]);
    const [targetType, setTargetType] = useState('');
    const [page, setPage] = useState(0);
    // Per report, because a moderator may start typing a note on one row, scroll, and decide
    // another. One shared field would silently attach the wrong words to the wrong decision.
    const [moderatorNotes, setModeratorNotes] = useState({});
    const [expanded, setExpanded] = useState(null);

    const { data, isLoading, isError, error, refetch } = useReportQueue({
        statuses,
        targetType: targetType || null,
        page,
    });
    const decide = useDecideReport();

    const reports = data?.content ?? [];
    const openTotal = data?.openTotal ?? 0;

    // Every filter change goes back to page 0. Without this, narrowing a 9-page queue to one
    // status while sitting on page 7 shows an empty list that looks like "nothing matches".
    const applyFilter = (change) => {
        setPage(0);
        change();
    };

    const toggleStatus = (status) => applyFilter(() => {
        setStatuses((current) => {
            if (!current.includes(status)) return [...current, status];
            // Never empty. An empty list would fall back to the backend's default (OPEN) while
            // every filter button rendered as off — a screen showing one thing and claiming
            // another.
            if (current.length === 1) return current;
            return current.filter((value) => value !== status);
        });
    });

    const submitDecision = (report, decision) => {
        decide.mutate({ id: report.id, decision, note: moderatorNotes[report.id] }, {
            onSuccess: () => {
                setModeratorNotes((current) => {
                    const next = { ...current };
                    delete next[report.id];
                    return next;
                });
                showToast(t('adminReports.decided'), 'success');
            },
            onError: (err) => showToast(
                describeError(err, t('adminReports.decisionFailed')), 'error'),
        });
    };

    return (
        <PageShell>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <AdminNav current="reports" />

                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <h1 className="text-xl sm:text-2xl font-bold">{t('adminReports.title')}</h1>
                    {/* The size of the whole backlog, which one page cannot answer — the same
                        reason the review queue carries its depth beside the tabs. */}
                    <Badge variant={openTotal > 0 ? 'featured' : 'muted'}>
                        {t('adminReports.openTotal', { count: formatCount(openTotal) })}
                    </Badge>
                </div>

                {/* THE SENTENCE THIS SCREEN CANNOT DO WITHOUT. See the component javadoc. */}
                <div className="flex gap-2.5 items-start mb-6 p-3.5 rounded-lg border border-border bg-surface-hover text-sm">
                    <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-gold" />
                    <p className="leading-relaxed">{t('adminReports.decisionOnly')}</p>
                </div>

                <div className="flex gap-4 flex-wrap items-end mb-6">
                    <div>
                        <p className="text-xs font-semibold mb-1.5">{t('adminReports.filters.status')}</p>
                        {/* Plain toggle buttons with aria-pressed, NOT role="tablist" — the same
                            call AdminReview makes, and for the same reason: those roles promise
                            an arrow-key model that is not implemented here. */}
                        <div className="flex gap-2 flex-wrap">
                            {STATUS_FILTERS.map((status) => {
                                const active = statuses.includes(status);
                                return (
                                    <button
                                        key={status}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => toggleStatus(status)}
                                        className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${
                                            active
                                                ? 'border-primary bg-primary-light text-primary'
                                                : 'border-border-light bg-surface hover:bg-surface-hover'
                                        }`}
                                    >
                                        {statusLabel(status)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1.5" htmlFor="report-target-filter">
                            {t('adminReports.filters.targetType')}
                        </label>
                        <select
                            id="report-target-filter"
                            value={targetType}
                            onChange={(e) => applyFilter(() => setTargetType(e.target.value))}
                            className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm outline-none focus:border-primary transition-colors"
                        >
                            <option value="">{t('adminReports.filters.all')}</option>
                            {Object.values(REPORT_TARGET_TYPE).map((value) => (
                                <option key={value} value={value}>{targetTypeLabel(value)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <QueryState
                    isLoading={isLoading}
                    isError={isError}
                    error={error}
                    onRetry={refetch}
                    errorTitle={t('adminReports.loadFailed')}
                    isEmpty={reports.length === 0}
                    emptyIcon={Flag}
                    emptyTitle={t('adminReports.empty')}
                    emptyDescription={t('adminReports.emptyDescription')}
                >
                    <ul className="grid gap-3">
                        {reports.map((report) => {
                            const alsoReported = corroboration(report.openReportsOnTarget);
                            const targetKey = `${report.targetType}:${report.targetId}`;
                            const isExpanded = expanded === targetKey;
                            return (
                                <li
                                    key={report.id}
                                    className="bg-surface border border-border-light rounded-lg p-4"
                                >
                                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <strong className="text-base">{reasonLabel(report.reason)}</strong>
                                            {/* The level the backend ranked this at — the queue
                                                is already in that order; the tag says why a newer
                                                row sits above an older one. Levels 3 and 4 carry
                                                none, so the urgent rows are the marked ones. */}
                                            {report.priority === 1 && <Badge variant="danger">{t('adminReports.priority.urgent')}</Badge>}
                                            {report.priority === 2 && <Badge variant="featured">{t('adminReports.priority.high')}</Badge>}
                                            <Badge variant={STATUS_VARIANT[report.status] ?? 'muted'}>
                                                {statusLabel(report.status)}
                                            </Badge>
                                            <Badge variant="muted">{targetTypeLabel(report.targetType)}</Badge>
                                            {/* Rendered only above one — see `corroboration`. A
                                                «1» on every row would make the rows that matter
                                                harder to spot, not easier. */}
                                            {alsoReported && (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold">
                                                    <Users size={13} />
                                                    {t('adminReports.corroboration', {
                                                        count: formatCount(alsoReported),
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        <ReportedTarget
                                            targetType={report.targetType}
                                            targetId={report.targetId}
                                            channelId={report.channelId}
                                        />
                                    </div>

                                    <div className="text-xs text-text-muted mb-3 flex gap-3 flex-wrap">
                                        <span>{t('adminReports.reporter', { id: report.reporterUserId })}</span>
                                        <span>{t('adminReports.reportedAt', { date: formatMoment(report.createdAt) })}</span>
                                    </div>

                                    <p className="text-sm font-semibold mb-1">{t('adminReports.noteHeading')}</p>
                                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap mb-3">
                                        {report.note || t('adminReports.noNote')}
                                    </p>

                                    {alsoReported && (
                                        <button
                                            type="button"
                                            onClick={() => setExpanded(isExpanded ? null : targetKey)}
                                            aria-expanded={isExpanded}
                                            className="text-sm text-primary font-semibold"
                                        >
                                            {isExpanded
                                                ? t('adminReports.hideOtherReports')
                                                : t('adminReports.showOtherReports', {
                                                    count: formatCount(alsoReported - 1),
                                                })}
                                        </button>
                                    )}
                                    {isExpanded && (
                                        <OtherReports
                                            targetType={report.targetType}
                                            targetId={report.targetId}
                                            excludeId={report.id}
                                        />
                                    )}

                                    {report.status === REPORT_STATUS.OPEN ? (
                                        <div className="mt-4 pt-3 border-t border-border-light">
                                            <label
                                                className="block text-xs font-semibold mb-1.5"
                                                htmlFor={`moderator-note-${report.id}`}
                                            >
                                                {t('adminReports.moderatorNoteLabel')}
                                            </label>
                                            <textarea
                                                id={`moderator-note-${report.id}`}
                                                rows={2}
                                                value={moderatorNotes[report.id] ?? ''}
                                                onChange={(e) => setModeratorNotes((current) => ({
                                                    ...current,
                                                    [report.id]: e.target.value,
                                                }))}
                                                placeholder={t('adminReports.moderatorNotePlaceholder')}
                                                className="w-full px-3 py-2 rounded-md border border-border resize-y outline-none
                                                    focus:border-primary transition-colors bg-surface text-sm mb-3"
                                            />
                                            <div className="flex gap-2 flex-wrap">
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    icon={<Check size={14} />}
                                                    disabled={decide.isPending}
                                                    onClick={() => submitDecision(report, REPORT_STATUS.ACTIONED)}
                                                >
                                                    {decide.isPending
                                                        ? t('adminReports.deciding')
                                                        : t('adminReports.actioned')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    icon={<X size={14} />}
                                                    disabled={decide.isPending}
                                                    onClick={() => submitDecision(report, REPORT_STATUS.DISMISSED)}
                                                >
                                                    {t('adminReports.dismiss')}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-3 pt-3 border-t border-border-light text-xs text-text-muted">
                                            <div className="flex gap-3 flex-wrap">
                                                <span>{t('adminReports.decidedAt', { date: formatMoment(report.decidedAt) })}</span>
                                                {report.decidedByUserId != null && (
                                                    <span>{t('adminReports.decidedBy', { id: report.decidedByUserId })}</span>
                                                )}
                                            </div>
                                            {report.moderatorNote && (
                                                <p className="mt-2 text-text-secondary leading-relaxed whitespace-pre-wrap">
                                                    <strong className="text-text-primary">
                                                        {t('adminReports.moderatorNoteHeading')}:
                                                    </strong>{' '}
                                                    {report.moderatorNote}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </QueryState>

                {/* Outside QueryState, which renders its empty state INSTEAD of its children: a
                    filter that empties the page a moderator is standing on must still leave them
                    a way back to page 1. */}
                <Pager
                    page={data?.currentPage ?? page}
                    totalPages={data?.totalPages ?? 0}
                    hasPrevious={data?.hasPrevious ?? page > 0}
                    hasNext={data?.hasNext ?? false}
                    onChange={setPage}
                />
            </div>
        </PageShell>
    );
}

export default AdminReports;
