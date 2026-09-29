import { Modal, Badge } from '@/components/ui';
import { useChannelStatusHistory } from '@/hooks/useAdminData';
import { formatWhen, statusLabel } from '@/lib/channelStatus';
import { t } from '@/i18n';

const STATUS_VARIANT = { PENDING: 'featured', ACTIVE: 'success', REJECTED: 'danger', SUSPENDED: 'muted' };

/** Every recorded approve / reject / suspend of one channel — the audit trail, newest first. */
export default function StatusHistoryDialog({ channel, open, onClose }) {
    const { data = [], isLoading } = useChannelStatusHistory(channel?.id, open);
    return (
        <Modal open={open} onClose={onClose} title={t('admin.history.title', { name: channel?.name ?? '' })} maxWidth="640px">
            {isLoading ? (
                <p className="text-sm text-text-muted">{t('common.loading')}</p>
            ) : data.length === 0 ? (
                <p className="text-sm text-text-muted">{t('admin.history.empty')}</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {data.map((row) => (
                        <li key={row.id} className="border border-border-light rounded-lg p-3 text-sm bg-surface">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Badge variant={STATUS_VARIANT[row.fromStatus] ?? 'muted'}>{statusLabel(row.fromStatus)}</Badge>
                                <span aria-hidden="true">←</span>
                                <Badge variant={STATUS_VARIANT[row.toStatus] ?? 'muted'}>{statusLabel(row.toStatus)}</Badge>
                                <span className="text-xs text-text-muted">
                                    {formatWhen(row.changedAt)}
                                    {' · '}
                                    {t('admin.history.by', { name: row.actorUsername ?? `#${row.actorUserId ?? '?'}` })}
                                </span>
                            </div>
                            <p className="text-text-secondary whitespace-pre-wrap">{row.reason || t('admin.history.noReason')}</p>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
}
