import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal } from '@/components/ui';
import { useConsent } from '@/contexts/ConsentContext';
import { t } from '@/i18n';

/**
 * The reader's two choices, asked before anything they concern happens: YouTube (Google learns what
 * is watched from its player) and counting their views (a random number kept in the browser —
 * lib/viewerId).
 *
 * <h4>Two layers: a short question, and the details behind «More details»</h4>
 *
 * <p>The banner used to carry the whole explanation, and on a phone that was a block of text over
 * the page before anyone had read a line of it. Now the banner is one sentence and the two
 * buttons, and everything else — each purpose's full account, a switch per purpose, the links into
 * the privacy policy — is in a dialog the reader opens if they want to know more.
 *
 * <p><b>What the short layer may not lose</b>, because consent has to be informed and freely given:
 * <ul>
 *   <li>It still NAMES every purpose it asks about, in a clause each («Google sees that you watch
 *       them», «we count each of your views once»). Detail can move behind a link; the purposes
 *       cannot, or «Allow» is agreement to something the reader was never told.</li>
 *   <li>Refusing is exactly as easy as allowing: both are real buttons, the same variant and size,
 *       side by side, the refusal first in the DOM. A solid «Allow» beside a grey link — or a
 *       refusal that lives only inside the dialog — is the most commonly fined pattern in Europe.
 *       The dialog repeats both, as «Refuse all» and «Allow all», for the same reason.</li>
 *   <li>Consent to one purpose is never consent to another: the dialog's switches are per purpose,
 *       and one the reader never said yes to is OFF (a pre-ticked box is not consent).</li>
 * </ul>
 *
 * <p>There is no × on the banner — dismissing is not an answer — and closing the dialog answers
 * nothing either: it returns to the banner. The page is never blocked: nothing either purpose
 * concerns loads while the question is open, and the site works the same whatever the answer.
 * Someone who has answered one of the two is asked only the other, on the banner.
 *
 * <h4>The dialog is also the footer's «Your privacy choices»</h4>
 *
 * <p>One dialog, opened from either place, and it always shows BOTH purposes, each switch starting
 * from what the reader decided last — a reader who allowed both sees both on, and changes one
 * without re-answering the other. A purpose never answered starts off, which is the no-pre-ticking
 * rule and not an exception to it. Every button there records both choices; nothing changes until
 * one is pressed. The banner renders only while a question is open; the dialog, whenever it is.
 */
function ConsentBanner() {
    const {
        asking, grant, deny, youtubeAllowed,
        askingViews, grantViews, denyViews, viewsAllowed,
        choicesOpen, openChoices, closeChoices,
    } = useConsent();
    const [picks, setPicks] = useState({ youtube: false, views: false });
    const showing = asking || askingViews;

    // Each time the dialog opens, its switches start from the choices as they stand: a stored
    // «granted» is on, a refusal or no answer yet is off. Not while it is open — the reader's own
    // flips are what «Save» records.
    useEffect(() => {
        if (choicesOpen) setPicks({ youtube: youtubeAllowed, views: viewsAllowed });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [choicesOpen]);

    // The banner is fixed, so it reserved no room: until it was answered it sat over the end of
    // every page — Today's last line and its way on to Discover, and the footer with the privacy
    // policy the banner itself links to. A spacer of its measured height, in the page's flow,
    // lets everything scroll clear of it; measured, because its height changes with the width
    // and the language.
    const bannerRef = useRef(null);
    const [height, setHeight] = useState(0);
    useLayoutEffect(() => {
        const banner = bannerRef.current;
        if (!showing || !banner) return undefined;
        const measure = () => setHeight(banner.offsetHeight);
        measure();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(banner);
        return () => observer.disconnect();
    }, [showing]);

    const both = asking && askingViews;
    // The banner's two buttons answer only what it asked; an answered purpose stays as it was.
    const answer = (youtube, views) => {
        if (asking) (youtube ? grant : deny)();
        if (askingViews) (views ? grantViews : denyViews)();
    };
    // The dialog's buttons record both, since it shows both.
    const decide = (youtube, views) => {
        (youtube ? grant : deny)();
        (views ? grantViews : denyViews)();
        closeChoices();
    };

    let title;
    let summary;
    if (both) {
        title = t('consent.bothTitle');
        summary = t('consent.short');
    } else if (asking) {
        title = t('consent.title');
        summary = t('consent.shortYoutube');
    } else {
        title = t('consent.viewsTitle');
        summary = t('consent.shortViews');
    }

    // Both purposes, each as the dialog shows it: its full account, where in the privacy policy it
    // is set out, and its switch.
    const purposes = [
        { key: 'youtube', heading: t('consent.title'), body: t('consent.body'), more: t('consent.more'), href: '/privacy#youtube', label: t('consent.chooseYoutube') },
        { key: 'views', heading: t('consent.viewsTitle'), body: t('consent.viewsBody'), more: t('consent.viewsMore'), href: '/privacy#view-counts', label: t('consent.chooseViews') },
    ];

    return (
        <>
        {showing && (
        <>
        <div aria-hidden="true" style={{ height }} />
        <div
            ref={bannerRef}
            // `role="region"` and a label rather than `role="dialog"`: it is not modal, nothing is
            // trapped, and announcing a dialog that does not behave like one is worse for a screen
            // reader than announcing nothing.
            role="region"
            aria-label={t('consent.label')}
            // Above the phone's bottom tab bar, not under it: at bottom-0 the bar (z-1000) covered
            // the Accept/Decline row, so on a phone the question could not be answered at all.
            className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] lg:bottom-0 inset-x-0 z-50 border-t border-border bg-surface/95 backdrop-blur
                       shadow-[0_-4px_24px_rgba(0,0,0,0.08)] max-h-[70vh] overflow-y-auto"
        >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 grid gap-3 sm:flex sm:items-center sm:gap-6">
                <div className="grid gap-1.5 flex-1">
                    <strong className="text-sm">{title}</strong>
                    <p className="text-sm text-text-secondary leading-relaxed" dir="auto">
                        {summary}{' '}
                        <button
                            type="button"
                            onClick={openChoices}
                            aria-haspopup="dialog"
                            className="text-primary font-semibold hover:underline"
                        >
                            {t('consent.details')}
                        </button>
                    </p>
                </div>

                {/* Same variant, same size, same row. The refusal is FIRST in the DOM so keyboard
                    and screen-reader users reach it first. */}
                <div className="flex gap-2 w-full sm:w-auto sm:flex-shrink-0">
                    <Button variant="outline" onClick={() => answer(false, false)} className="flex-1 sm:flex-none">
                        {t('consent.deny')}
                    </Button>
                    <Button variant="outline" onClick={() => answer(true, true)} className="flex-1 sm:flex-none">
                        {t('consent.grant')}
                    </Button>
                </div>
            </div>
        </div>
        </>
        )}

        <Modal open={choicesOpen} onClose={closeChoices} title={t('consent.label')} maxWidth="640px">
            <div className="grid gap-5">
                <p className="text-sm text-text-secondary leading-relaxed" dir="auto">{t('consent.detailsIntro')}</p>
                {purposes.map((purpose) => (
                    <section key={purpose.key} className="grid gap-2 border-t border-border-light pt-4">
                        <div className="flex items-center justify-between gap-3">
                            <h4 className="m-0 text-base font-bold">{purpose.heading}</h4>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={picks[purpose.key]}
                                aria-label={purpose.label}
                                onClick={() => setPicks((p) => ({ ...p, [purpose.key]: !p[purpose.key] }))}
                                className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${picks[purpose.key] ? 'bg-primary' : 'bg-border'}`}
                            >
                                <span aria-hidden="true" className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${picks[purpose.key] ? 'start-[1.375rem]' : 'start-0.5'}`} />
                            </button>
                        </div>
                        <p className="text-sm text-text-secondary leading-loose" dir="auto">{purpose.body}</p>
                        {/* Closes the dialog on the way: left open, it would sit over the very
                            section of the policy it links to. */}
                        <Link to={purpose.href} onClick={closeChoices} className="text-sm text-primary hover:underline w-fit">
                            {purpose.more}
                        </Link>
                    </section>
                ))}
                {/* Refusing all is as near as allowing all — and from the footer, «Refuse all» is
                    the withdrawal, two presses from any page. */}
                <div className="flex flex-wrap gap-2 justify-end border-t border-border-light pt-4">
                    <Button variant="outline" onClick={() => decide(false, false)}>
                        {t('consent.denyAll')}
                    </Button>
                    <Button variant="outline" onClick={() => decide(picks.youtube, picks.views)}>
                        {t('consent.save')}
                    </Button>
                    <Button variant="outline" onClick={() => decide(true, true)}>
                        {t('consent.grantAll')}
                    </Button>
                </div>
            </div>
        </Modal>
        </>
    );
}

export default ConsentBanner;
