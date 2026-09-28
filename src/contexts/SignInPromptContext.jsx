import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Bookmark, Flag, Heart, Lock, LogIn, MessageSquare, UserPlus } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { KhatamStar } from '../components/ui/Khatam';
import { t } from '@/i18n';

/** The actions that have words of their own; anything else gets the generic ones. */
export const SIGN_IN_ACTIONS = ['like', 'bookmark', 'subscribe', 'report', 'comment', 'goal'];

const known = (action) => (SIGN_IN_ACTIONS.includes(action) ? action : 'generic');

/** The i18n key for what the popup says a press needed an account for. */
export const signInReasonKey = (action) => `signInPrompt.reason.${known(action)}`;

/** The i18n key for the popup's headline, which names the action rather than the account. */
export const signInHeadlineKey = (action) => `signInPrompt.headline.${known(action)}`;

// The badge shows the control that was pressed, so the popup reads as the answer to that press.
const ICONS = { like: Heart, bookmark: Bookmark, subscribe: Bell, report: Flag, comment: MessageSquare };

function ActionGlyph({ action }) {
    if (action === 'goal') return <KhatamStar filled={false} strokeWidth={9} className="w-7 h-7 text-gold" />;
    const Icon = ICONS[action] || Lock;
    return <Icon size={28} strokeWidth={1.75} aria-hidden="true" />;
}

const SignInPromptContext = createContext(null);

/**
 * The one small popup every account-only control opens for a reader who is not signed in.
 *
 * <p>These controls used to be DISABLED, with the reason only in `title`. A tooltip is a hover
 * affordance, and most readers here are on a phone, where a greyed heart that does nothing when
 * tapped is indistinguishable from a broken one. So the control stays pressable, looks locked,
 * and the press says what it needs and offers both ways in — sign in AND create an account, since
 * most people pressing it have no account yet.
 *
 * <p>Both links carry `state.from`, which Login and Register read, so the reader lands back on the
 * page they were on rather than on the home page.
 */
export function SignInPromptProvider({ children }) {
    const location = useLocation();
    // The action outlives `open` so the popup keeps its words while it fades out, rather than
    // flicking to the generic ones for the last 200 ms.
    const [action, setAction] = useState('generic');
    const [open, setOpen] = useState(false);

    const promptSignIn = useCallback((nextAction = 'generic') => {
        setAction(nextAction);
        setOpen(true);
    }, []);
    const close = useCallback(() => setOpen(false), []);
    const value = useMemo(() => ({ promptSignIn }), [promptSignIn]);

    const back = { from: location.pathname + location.search };

    return (
        <SignInPromptContext.Provider value={value}>
            {children}
            <Modal open={open} onClose={close} title={t(signInHeadlineKey(action))} maxWidth="400px" bare>
                {/* The band: the brand's star, large and faint, behind a badge carrying the icon
                    of the control that was pressed, with a gold lock on its shoulder — the same
                    lock the control itself wears while signed out. */}
                <div className="relative overflow-hidden bg-gradient-to-b from-primary-light to-surface pt-9 pb-5 flex justify-center">
                    <KhatamStar
                        filled={false}
                        strokeWidth={2}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-56 text-primary/10 pointer-events-none"
                    />
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-surface text-primary shadow-md ring-4 ring-primary/10
                            flex items-center justify-center">
                            <ActionGlyph action={action} />
                        </div>
                        <span className="absolute -bottom-1 -end-1 w-7 h-7 rounded-full bg-gold text-white
                            ring-2 ring-surface flex items-center justify-center">
                            <Lock size={13} strokeWidth={2.5} aria-hidden="true" />
                        </span>
                    </div>
                </div>

                <div className="px-6 pb-6 text-center">
                    <h3 className="m-0 mb-2 text-xl font-bold text-text-primary">{t(signInHeadlineKey(action))}</h3>
                    <p className="m-0 mb-6 text-text-secondary leading-relaxed">{t(signInReasonKey(action))}</p>

                    <div className="grid gap-2.5">
                        <Link
                            to="/register"
                            state={back}
                            onClick={close}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg
                                bg-primary text-white font-semibold shadow-sm hover:bg-primary-dark hover:no-underline
                                active:scale-[0.98] transition"
                        >
                            <UserPlus size={18} aria-hidden="true" /> {t('signInPrompt.register')}
                        </Link>
                        <Link
                            to="/login"
                            state={back}
                            onClick={close}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg
                                border border-border bg-surface text-text-primary font-semibold
                                hover:border-primary hover:text-primary hover:no-underline active:scale-[0.98] transition"
                        >
                            <LogIn size={18} aria-hidden="true" /> {t('signInPrompt.login')}
                        </Link>
                    </div>

                    <p className="m-0 mt-5 pt-4 border-t border-border-light text-xs text-text-muted leading-relaxed">
                        {t('signInPrompt.free')}
                    </p>
                </div>
            </Modal>
        </SignInPromptContext.Provider>
    );
}

/** `promptSignIn(action)` opens the popup; `action` is one of {@link SIGN_IN_ACTIONS}. */
export function useSignInPrompt() {
    const context = useContext(SignInPromptContext);
    if (!context) throw new Error('useSignInPrompt must be used inside SignInPromptProvider');
    return context;
}
