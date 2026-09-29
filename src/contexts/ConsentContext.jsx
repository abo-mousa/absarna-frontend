import { createContext, useContext, useMemo, useState } from 'react';
import {
    DENIED,
    GRANTED,
    allowsYouTube,
    readConsent,
    readViewsConsent,
    shouldAskConsent,
    writeConsent,
    writeViewsConsent,
} from '@/lib/consent';
import { forgetViewerId } from '@/lib/viewerId';

const ConsentContext = createContext(null);

/**
 * Holds the reader's decision about Google, and is the only thing that may answer it.
 *
 * <p>The reasoning — what is being consented to, why undecided behaves as refused, and why the
 * question is asked of every reader rather than only European ones — is in `lib/consent`. This is
 * the React half.
 *
 * <p><b>Read once, into state, and never re-read.</b> Storage is not reactive: a component that
 * called `readConsent()` during render would keep whatever it saw first, so revoking consent in
 * the footer would leave the player on the page behind it still loaded. One piece of state, one
 * provider, one re-render — which is what makes "withdraw" actually withdraw rather than take
 * effect on the next navigation.
 *
 * <p>Sits ABOVE the router in `App`, because the banner is site-wide and the gate has to be
 * readable from a card on any route.
 */
export function ConsentProvider({ children }) {
    // Lazy initialiser, so the read happens once rather than on every render. `safeStorage`
    // underneath, so a browser with site data blocked returns null — undecided, which holds
    // Google back. Failing closed is the correct direction for this particular question.
    const [consent, setConsent] = useState(() => readConsent());
    const [viewsConsent, setViewsConsent] = useState(() => readViewsConsent());
    // Whether the details dialog is open — here rather than in the banner, because the footer
    // opens it too, on a page where the banner itself has long been answered.
    const [choicesOpen, setChoicesOpen] = useState(false);

    const value = useMemo(() => ({
        consent,
        /** Whether a YouTube thumbnail or player may be loaded for this reader. */
        youtubeAllowed: allowsYouTube(consent),
        /** Whether the banner should be on screen. */
        asking: shouldAskConsent(consent),
        grant: () => {
            writeConsent(GRANTED);
            setConsent(GRANTED);
        },
        deny: () => {
            writeConsent(DENIED);
            setConsent(DENIED);
        },
        /**
         * The footer's «خياراتك في الخصوصية»: opens the same details dialog the banner's «More
         * details» does, showing each choice AS IT STANDS — a reader who allowed both sees both
         * switches on — and changes nothing until they press a button there.
         *
         * <p>This is the withdrawal route, and it has to be as easy to reach as the banner was —
         * so it is a footer link on every page rather than a control buried in the privacy policy,
         * and «Refuse all» is on the dialog's first screen. It used to CLEAR both decisions and
         * bring the banner back, which made changing one choice mean answering both again from
         * switches that all started off.
         */
        choicesOpen,
        openChoices: () => setChoicesOpen(true),
        closeChoices: () => setChoicesOpen(false),

        // The second, separate purpose: counting this visitor's views (lib/viewerId). Its own
        // answer, never inferred from YouTube's.
        viewsAllowed: viewsConsent === GRANTED,
        askingViews: viewsConsent === null,
        grantViews: () => {
            writeViewsConsent(GRANTED);
            setViewsConsent(GRANTED);
        },
        /** Refusing and withdrawing are one act: record the no, and delete the id at once. */
        denyViews: () => {
            writeViewsConsent(DENIED);
            forgetViewerId();
            setViewsConsent(DENIED);
        },
    }), [consent, viewsConsent, choicesOpen]);

    return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

/**
 * The reader's decision.
 *
 * <p>Falls back to a refusing, non-asking shape when no provider is above it — a component
 * rendered outside the tree (a test, a future island) must not be the reason Google gets loaded.
 */
export function useConsent() {
    return useContext(ConsentContext) ?? {
        consent: null,
        youtubeAllowed: false,
        asking: false,
        grant: () => {},
        deny: () => {},
        choicesOpen: false,
        openChoices: () => {},
        closeChoices: () => {},
        viewsAllowed: false,
        askingViews: false,
        grantViews: () => {},
        denyViews: () => {},
    };
}
