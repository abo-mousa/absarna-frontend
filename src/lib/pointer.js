/**
 * What the visitor's primary input can do — the question behind every hover-only affordance.
 *
 * <p>`(hover: hover)` asks whether the PRIMARY pointing device can hover. A mouse and a trackpad
 * can; a finger cannot, and never will — there is no state between "not touching" and "pressing".
 * So any control revealed by `:hover` and nothing else simply does not exist on a phone, and any
 * consequence previewed by `:hover` before a click is a consequence a phone visitor only ever
 * discovers by causing it.
 *
 * <p><b>This is for behaviour, not for styling.</b> A hover-only *style* is better fixed in CSS —
 * Tailwind takes `[@media(hover:none)]:…` and it costs no state, no re-render and no JS at all
 * (see `VideoControlBar`'s volume slider). Reach for this function only when the component has to
 * take a different *action*, which CSS cannot express: `SubscribeButton`'s confirm step exists on
 * touch and does not exist under a mouse, because under a mouse hover already did the warning.
 *
 * <p>Read once and cached. A visitor does not swap their phone for a desktop mid-session, and the
 * one real edge — a mouse plugged into a tablet — changes a control from "press twice" to "press
 * twice", which is not worth a media-query listener and a re-render on every mount.
 *
 * <p>Defaults to `true` (assume a mouse) where `matchMedia` is missing, which is the node test
 * environment rather than any browser: "assume hover" is the behaviour this app has always had,
 * so an unanswerable question changes nothing.
 */
let canHover = null;

export const primaryPointerCanHover = () => {
    if (canHover === null) {
        canHover = typeof window === 'undefined' || typeof window.matchMedia !== 'function'
            ? true
            : window.matchMedia('(hover: hover)').matches;
    }
    return canHover;
};
