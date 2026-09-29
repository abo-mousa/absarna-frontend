import { dateLocale, parseTimestamp } from '@/lib/datetime';
import { t } from '@/i18n';

/** The reader-facing name of a channel status, or a dash for "none yet" (a first transition's from). */
export const statusLabel = (status) => (status ? t(`admin.channelStatus.${status}`) : '—');

export const formatWhen = (value) => {
    if (!value) return '';
    const at = parseTimestamp(value).locale(dateLocale());
    return at.isValid() ? at.format(t('adminReports.dateFormat')) : '';
};
