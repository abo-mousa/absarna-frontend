import { describe, expect, it } from 'vitest';
import { pressOutcome } from '@/components/content/SubscribeButton';

/**
 * What a press of the subscribe button does.
 *
 * <p>The case worth a test is the press that must NOT unsubscribe. Under a mouse, hover swaps the
 * label to «إلغاء الاشتراك» before the click, so the consequence is always visible first. A finger
 * cannot hover, so on a phone that warning never rendered and the first tap on «✓ مشترك» went
 * straight through — which is exactly the outcome the label exists to prevent, and exactly the
 * kind of thing no browser check on a laptop can ever see.
 */
describe('pressOutcome', () => {
    it('sends an anonymous visitor to log in, whatever the button shows', () => {
        // Before any subscribing there is an account to make. The status query is disabled without
        // a token, so `subscribed` is false here anyway — but a stale true must not become a
        // request the visitor cannot make.
        expect(pressOutcome({ authenticated: false, subscribed: false, needsConfirm: false, armed: false })).toBe('login');
        expect(pressOutcome({ authenticated: false, subscribed: true, needsConfirm: true, armed: true })).toBe('login');
    });

    it('subscribes on the first press, on every device', () => {
        // Only the un-subscribing is confirmed. A confirm step on the way *in* would be friction
        // in front of the action the platform wants, guarding something a second tap undoes.
        expect(pressOutcome({ authenticated: true, subscribed: false, needsConfirm: true, armed: false })).toBe('toggle');
        expect(pressOutcome({ authenticated: true, subscribed: false, needsConfirm: false, armed: false })).toBe('toggle');
    });

    it('unsubscribes on the first press where the pointer can hover', () => {
        // Hover has already shown the ✕ and the wording. Adding a second click for a mouse would
        // be a confirm step for a warning that was given.
        expect(pressOutcome({ authenticated: true, subscribed: true, needsConfirm: false, armed: false })).toBe('toggle');
    });

    it('warns first on a touchscreen, and unsubscribes only on the press after', () => {
        // The whole fix, in two lines: the tap that used to unsubscribe silently now arms, and the
        // deliberate second tap is what acts.
        expect(pressOutcome({ authenticated: true, subscribed: true, needsConfirm: true, armed: false })).toBe('arm');
        expect(pressOutcome({ authenticated: true, subscribed: true, needsConfirm: true, armed: true })).toBe('toggle');
    });
});
