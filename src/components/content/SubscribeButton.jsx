import { useEffect, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionStatus, useToggleSubscription } from '../../hooks/useChannels';
import { primaryPointerCanHover } from '@/lib/pointer';
import { t } from '@/i18n';

/** How long an armed button waits for the confirming press before going back to its resting state. */
export const CONFIRM_WINDOW_MS = 3000;

/**
 * What a press of the button should do, given who is pressing and what it currently shows.
 *
 * <p>Exported and tested rather than left inline, because the whole point of the control is the
 * one case that is easy to get wrong — the press that must NOT unsubscribe — and there is no jsdom
 * here to press it in.
 *
 * @returns `'login'`, `'arm'` (show the consequence and wait for a second press) or `'toggle'`.
 */
export const pressOutcome = ({ authenticated, subscribed, needsConfirm, armed }) => {
    if (!authenticated) return 'login';
    if (subscribed && needsConfirm && !armed) return 'arm';
    return 'toggle';
};

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
 * <b>On a touchscreen that warning never happened.</b> A finger cannot hover, so the swap a mouse
 * gets for free never rendered and the very first tap on "✓ مشترك" unsubscribed — the one outcome
 * the label was written to prevent, delivered without a word, on the devices most people read this
 * platform on. So where the primary pointer cannot hover, the first press *arms* the button
 * instead: it shows exactly what hover shows — ✕ "إلغاء الاشتراك" in the same red — and the second
 * press is what unsubscribes. Hover already is a first step; this is that step made pressable.
 *
 * <p>The arming is deliberately not a modal: a dialog for a two-way, one-tap-to-restore action is
 * heavier than the action, and this reuses a warning the component already had wording and colour
 * for. It expires by itself after {@link CONFIRM_WINDOW_MS} and on blur, because an armed button
 * left armed is a trap set for whoever presses it next — failing back to "does nothing" is the
 * right way for it to fail.
 *
 * `variant="banner"` is the white-on-primary treatment for the channel header; `inline` is the
 * ordinary pill used in a page body.
 */
function SubscribeButton({ channelId, variant = 'inline', className = '' }) {
    const { token } = useAuth();
    const navigate = useNavigate();
    const { data: status } = useSubscriptionStatus(channelId, !!token && !!channelId);
    const toggleSubscription = useToggleSubscription(channelId);
    const [armed, setArmed] = useState(false);

    const subscribed = status?.subscribed || false;
    const needsConfirm = !primaryPointerCanHover();
    // `subscribed` guards the render as well as the press: an arming that is somehow outlived by a
    // subscription changing underneath it (another tab, a second copy of this button on the page)
    // must not leave an ✕ sitting on a channel the viewer no longer follows.
    const showArmed = armed && subscribed;

    useEffect(() => {
        if (!armed) return undefined;
        const timer = setTimeout(() => setArmed(false), CONFIRM_WINDOW_MS);
        return () => clearTimeout(timer);
    }, [armed]);

    const handleClick = () => {
        const outcome = pressOutcome({ authenticated: !!token, subscribed, needsConfirm, armed: showArmed });
        if (outcome === 'login') {
            navigate('/login');
            return;
        }
        if (outcome === 'arm') {
            setArmed(true);
            return;
        }
        setArmed(false);
        toggleSubscription.mutate(subscribed);
    };

    // Armed repeats what hover would have said, in the colour hover would have said it in — the
    // two states are one warning reached two ways, so they must not look like two different
    // things. Written as whole alternatives rather than appended classes: `bg-white/20` and
    // `bg-white/30` in one string is a coin toss decided by stylesheet order, not by which came
    // last in the JSX.
    const palette = variant === 'banner'
        ? (subscribed
            ? (showArmed
                ? 'bg-white/30 text-white'
                : 'bg-white/20 text-white hover:bg-white/30')
            : 'bg-white text-primary hover:bg-white/90')
        : (subscribed
            ? (showArmed
                ? 'bg-surface-hover text-red-500 border border-red-400'
                : 'bg-surface-hover text-text-secondary border border-border hover:border-red-400 hover:text-red-500')
            : 'bg-primary text-white hover:bg-primary-dark');

    return (
        <button
            type="button"
            onClick={handleClick}
            // An armed button that is tabbed or tapped away from disarms. The timeout above would
            // get there anyway; this gets there at the moment the viewer's attention does.
            onBlur={() => setArmed(false)}
            disabled={toggleSubscription.isPending}
            // A CONSTANT accessible name plus `aria-pressed`, which is the whole toggle-button
            // contract. This used to change the name with the state *as well*, so a screen reader
            // announced "إلغاء الاشتراك, pressed" — two readings of one control that contradict
            // each other, since a control named for un-subscribing being *pressed* implies the
            // un-subscribing is what already happened. The name says what the control is for;
            // `aria-pressed` says where it currently sits. The visible label still changes on
            // hover/focus, which is the sighted equivalent.
            //
            // Armed is the one state that overrides this, because there the name is no longer a
            // contradiction: a button waiting for its second press genuinely *is* "press again to
            // unsubscribe", and that is a change of what the next press does, which a screen
            // reader has no other way to learn. The visible swap is the sighted equivalent again —
            // and without this a VoiceOver user on a phone gets the confirm step and none of the
            // reason for it, which is worse than not having one.
            aria-label={showArmed ? t('channel.unsubscribeConfirmAria') : t('channel.subscribeToggleAria')}
            aria-pressed={subscribed}
            className={`group flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm
                transition-colors disabled:opacity-60
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary
                ${palette} ${className}`}
        >
            {toggleSubscription.isPending ? (
                '...'
            ) : !subscribed ? (
                <><Bell size={18} /> {t('channel.subscribe')}</>
            ) : showArmed ? (
                // Already the warning: no hover swap to do, and nothing to swap back to until the
                // press lands or the window closes.
                <><X size={18} /> {t('channel.unsubscribe')}</>
            ) : (
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
            )}
        </button>
    );
}

export default SubscribeButton;
