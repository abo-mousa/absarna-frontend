import { ViewTabs } from '../ui';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptions } from '@/hooks/useChannels';
import { t } from '@/i18n';

/**
 * «من قنواتك | كل القنوات» over a listing — the Posts page's switch, for Books and Articles. Only
 * for a signed-in reader who follows a channel: for anyone else «من قنواتك» is a tab that can only
 * ever be empty. The narrowing is the backend's (`?followed=true`).
 */
function ChannelScopeTabs({ followed, onChange }) {
    const { token } = useAuth();
    const { data: subscriptions = [] } = useSubscriptions(!!token);
    if (!token || subscriptions.length === 0) return null;
    return (
        <div className="border-b border-border mb-6">
            <ViewTabs
                label={t('common.channelScope.label')}
                items={[
                    { key: 'followed', label: t('common.channelScope.followed'), active: followed, onClick: () => onChange(true) },
                    { key: 'all', label: t('common.channelScope.all'), active: !followed, onClick: () => onChange(false) },
                ]}
            />
        </div>
    );
}

export default ChannelScopeTabs;
