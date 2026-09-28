import { ViewTabs } from '../ui';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/i18n';

/**
 * «من قنواتك | كل القنوات» over a listing — the Posts page's switch, for Books and Articles, and
 * shown as Posts shows it: to every signed-in reader. One who follows nothing gets the empty
 * state's way back to «كل القنوات». The narrowing is the backend's (`?followed=true`).
 */
function ChannelScopeTabs({ followed, onChange }) {
    const { token } = useAuth();
    if (!token) return null;
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
