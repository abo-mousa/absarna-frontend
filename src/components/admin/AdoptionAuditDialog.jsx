import { useEffect, useState } from 'react';
import { Modal, Pager } from '@/components/ui';
import { useAdoptionAudit } from '@/hooks/useAdminData';
import { dateLocale, parseTimestamp } from '@/lib/datetime';
import { t } from '@/i18n';

const when = (value) => {
    if (!value) return '';
    const at = parseTimestamp(value).locale(dateLocale());
    return at.isValid() ? at.format(t('adminReports.dateFormat')) : '';
};

/**
 * The affirmations an owner recorded on their imported metadata — `video_metadata_adoption`,
 * read through the platform-admin-only audit endpoint. It is the record that makes leaving the
 * YouTube API survivable, and it had no screen: producing it meant a curl command and a JSON
 * file. Each row shows the exact text affirmed and the wording the owner read.
 */
export default function AdoptionAuditDialog({ channel, open, onClose }) {
    // Paged: the record is one row per imported video, thousands for an imported catalogue.
    // Another channel's audit starts at its own first page.
    const [page, setPage] = useState(0);
    useEffect(() => setPage(0), [channel?.slug]);
    const { data, isLoading, isError } = useAdoptionAudit(channel?.slug, page, open);
    const records = data?.records ?? [];
    return (
        <Modal open={open} onClose={onClose} title={t('admin.audit.title', { name: channel?.name ?? '' })} maxWidth="820px">
            <p className="text-sm text-text-secondary mb-4">{t('admin.audit.intro')}</p>
            {isLoading && <p className="text-sm text-text-muted">{t('common.loading')}</p>}
            {isError && <p className="text-sm text-red-600">{t('admin.audit.failed')}</p>}
            {!isLoading && !isError && records.length === 0 && (
                <p className="text-sm text-text-muted">{t('admin.audit.empty')}</p>
            )}
            {records.length > 0 && (
                <>
                    <p className="text-xs text-text-muted mb-2">{t('admin.audit.count', { count: data?.totalItems ?? records.length })}</p>
                    <ul className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                        {records.map((row, i) => (
                            <li key={`${row.videoId}-${i}`} className="border border-border-light rounded-lg p-3 text-sm bg-surface">
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted mb-1">
                                    <span>{t('admin.audit.video', { id: row.videoId })}</span>
                                    <span dir="ltr">{row.youtubeVideoId}</span>
                                    <span>{when(row.adoptedAt)}</span>
                                    <span>{t('admin.audit.user', { id: row.userId })}</span>
                                    <span>{row.verificationMethod ?? ''} · {row.claimState ?? ''}</span>
                                    <span dir="ltr">{row.affirmationVersion}</span>
                                </div>
                                <p dir="auto" className="font-semibold">{row.titleSnapshot}</p>
                                {row.speakerSnapshot && <p dir="auto" className="text-text-secondary">{row.speakerSnapshot}{row.durationSnapshot ? ` · ${row.durationSnapshot}` : ''}</p>}
                                {row.descriptionSnapshot && (
                                    <p dir="auto" className="text-text-muted text-xs mt-1 line-clamp-3 whitespace-pre-wrap">{row.descriptionSnapshot}</p>
                                )}
                                <p dir="auto" className="text-xs text-text-secondary mt-2 italic">{row.affirmationText}</p>
                            </li>
                        ))}
                    </ul>
                    <Pager
                        page={data?.currentPage ?? page}
                        totalPages={data?.totalPages}
                        hasPrevious={data?.hasPrevious ?? page > 0}
                        hasNext={data?.hasNext ?? false}
                        onChange={setPage}
                    />
                </>
            )}
        </Modal>
    );
}
