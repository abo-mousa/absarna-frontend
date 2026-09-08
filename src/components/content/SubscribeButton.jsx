import { Bell, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionStatus, useToggleSubscription } from '../../hooks/useChannels';
import { t } from '@/i18n';

/**
 * Follow / unfollow a channel.
 *
 * <b>One component for both places it appears</b> (the channel banner and a video's detail page),
 * because the thing that was actually missing was not the ability to unsubscribe — the toggle and
 * its endpoint have always been there — but any sign that the button does it. A subscribed state
 * rendered as "✓ مشترك" reads as a status, not a control, so people concluded there was no way
 * out. Defining the affordance twice would mean fixing it twice.
 *
 * While subscribed, hover and keyboard focus swap the label to "إلغاء الاشتراك" with an ✕, so the
 * consequence of pressing it is visible before pressing it. Done with `group-hover`/`group-focus`
 * utilities rather than React state so it costs no re-render and works under keyboard focus for
 * free.
 *
 * `variant="banner"` is the white-on-primary treatment for the channel header; `inline` is the
 * ordinary pill used in a page body.
 */
function SubscribeButton({ channelId, variant = 'inline', className = '' }) {
    const { token } = useAuth();
    const navigate = useNavigate();
    const { data: status } = useSubscriptionStatus(channelId, !!token && !!channelId);
    const toggleSubscription = useToggleSubscription(channelId);

    const subscribed = status?.subscribed || false;

    const handleClick = () => {
        if (!token) {
            navigate('/login');
            return;
        }
        toggleSubscription.mutate(subscribed);
    };

    const palette = variant === 'banner'
        ? (subscribed
            ? 'bg-white/20 text-white hover:bg-white/30'
            : 'bg-white text-primary hover:bg-white/90')
        : (subscribed
            ? 'bg-surface-hover text-text-secondary border border-border hover:border-red-400 hover:text-red-500'
            : 'bg-primary text-white hover:bg-primary-dark');

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={toggleSubscription.isPending}
            // A CONSTANT accessible name plus `aria-pressed`, which is the whole toggle-button
            // contract. This used to change the name with the state *as well*, so a screen reader
            // announced "إلغاء الاشتراك, pressed" — two readings of one control that contradict
            // each other, since a control named for un-subscribing being *pressed* implies the
            // un-subscribing is what already happened. The name says what the control is for;
            // `aria-pressed` says where it currently sits. The visible label still changes on
            // hover/focus, which is the sighted equivalent.
            aria-label={t('channel.subscribeToggleAria')}
            aria-pressed={subscribed}
            className={`group flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm
                transition-colors disabled:opacity-60
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary
                ${palette} ${className}`}
        >
            {toggleSubscription.isPending ? (
                '...'
            ) : subscribed ? (
                <>
                    {/* Two icons and two labels, one hidden at a time — `hidden` toggled by the
                        parent's hover/focus so there is no state to keep in sync. */}
                    <Check size={18} className="group-hover:hidden group-focus-visible:hidden" />
                    <X size={18} className="hidden group-hover:block group-focus-visible:block" />
                    <span className="group-hover:hidden group-focus-visible:hidden">
                        {t('channel.subscribed')}
                    </span>
                    <span className="hidden group-hover:inline group-focus-visible:inline">
                        {t('channel.unsubscribe')}
                    </span>
                </>
            ) : (
                <><Bell size={18} /> {t('channel.subscribe')}</>
            )}
        </button>
    );
}

export default SubscribeButton;
