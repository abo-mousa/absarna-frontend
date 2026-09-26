import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { useConsent } from '@/contexts/ConsentContext';
import { t } from '@/i18n';

/**
 * The reader's two choices, asked before anything they concern happens: YouTube (Google learns what
 * is watched from its player) and counting their views (a random number kept in the browser —
 * lib/viewerId).
 *
 * <h4>One question when both are open, and still two choices</h4>
 *
 * <p>A first visit used to get two stacked questions, which on a phone was half the screen of
 * banner and read like a warning. Now it is one short, calm paragraph, the two things named in a
 * line each, and one pair of buttons that answers both — while staying separable, because consent
 * to one purpose is never consent to another: «أختار كلّاً على حدة» opens a switch per purpose, both
 * OFF until the reader turns one on (a pre-ticked box is not consent). Someone who has already
 * answered one of the two sees only the other, on its own.
 *
 * <h4>The two buttons are the same size, and that is the requirement</h4>
 *
 * <p>Consent has to be freely given, which regulators have read concretely: refusing must be as
 * easy as accepting. A banner with a solid «أوافق» and a grey text link «رفض» is the single most
 * commonly fined pattern in Europe. So both are real buttons, side by side, the refusal first in the
 * DOM. There is no × — dismissing is not an answer — and the page is never blocked: nothing it
 * concerns loads while the question is open, and the site works the same whatever the answer.
 *
 * <p>Rendered only while a question is open; the footer's two links reopen or withdraw each.
 */
function ConsentBanner() {
    const { asking, grant, deny, askingViews, grantViews, denyViews } = useConsent();
    const [choosing, setChoosing] = useState(false);
    const [picks, setPicks] = useState({ youtube: false, views: false });
    const showing = asking || askingViews;

    // The banner is fixed, so it reserved no room: until it was answered it sat over the end of
    // every page — Today's last line and its way on to Discover, and the footer with the privacy
    // policy the banner itself links to. A spacer of its measured height, in the page's flow,
    // lets everything scroll clear of it; measured, because its height changes with the width,
    // the language and the «choose each» view.
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

    if (!showing) return null;

    const both = asking && askingViews;
    const answer = (youtube, views) => {
        if (asking) (youtube ? grant : deny)();
        if (askingViews) (views ? grantViews : denyViews)();
    };

    let title;
    let body;
    if (both) {
        title = t('consent.bothTitle');
        body = (
            <>
                <p className="text-sm text-text-secondary leading-loose" dir="auto">{t('consent.bothBody')}</p>
                <ul className="grid gap-1 text-sm text-text-secondary leading-relaxed">
                    <li className="flex gap-2"><span aria-hidden="true" className="text-gold-ink">✦</span><span dir="auto">{t('consent.bothYoutube')}</span></li>
                    <li className="flex gap-2"><span aria-hidden="true" className="text-gold-ink">✦</span><span dir="auto">{t('consent.bothViews')}</span></li>
                </ul>
                <Link to="/privacy#youtube" className="text-sm text-primary hover:underline w-fit">{t('consent.privacy')}</Link>
            </>
        );
    } else if (asking) {
        title = t('consent.title');
        body = (
            <p className="text-sm text-text-secondary leading-loose" dir="auto">
                {t('consent.body')}{' '}
                <Link to="/privacy#youtube" className="text-primary hover:underline">{t('consent.more')}</Link>
            </p>
        );
    } else {
        title = t('consent.viewsTitle');
        body = (
            <p className="text-sm text-text-secondary leading-loose" dir="auto">
                {t('consent.viewsBody')}{' '}
                <Link to="/privacy#view-counts" className="text-primary hover:underline">{t('consent.viewsMore')}</Link>
            </p>
        );
    }

    return (
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
                    {body}
                </div>

                {choosing ? (
                    // One switch per purpose, both off until the reader turns one on.
                    <div className="grid gap-2 sm:flex-shrink-0 sm:min-w-[15rem]">
                        {[['youtube', t('consent.chooseYoutube')], ['views', t('consent.chooseViews')]].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                role="switch"
                                aria-checked={picks[key]}
                                onClick={() => setPicks((p) => ({ ...p, [key]: !p[key] }))}
                                className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border-light text-sm font-semibold hover:border-gold/60"
                            >
                                <span>{label}</span>
                                <span aria-hidden="true" className={`relative w-9 h-5 rounded-full transition-colors ${picks[key] ? 'bg-primary' : 'bg-border'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${picks[key] ? 'start-[1.125rem]' : 'start-0.5'}`} />
                                </span>
                            </button>
                        ))}
                        <Button variant="outline" onClick={() => answer(picks.youtube, picks.views)}>
                            {t('consent.save')}
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-2 sm:flex-shrink-0 justify-items-center">
                        {/* Same variant, same size, same row. The refusal is FIRST in the DOM so
                            keyboard and screen-reader users reach it first. */}
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" onClick={() => answer(false, false)} className="flex-1 sm:flex-none">
                                {t('consent.deny')}
                            </Button>
                            <Button variant="outline" onClick={() => answer(true, true)} className="flex-1 sm:flex-none">
                                {t('consent.grant')}
                            </Button>
                        </div>
                        {both && (
                            <button type="button" onClick={() => setChoosing(true)} className="text-xs font-semibold text-text-muted hover:text-gold-ink underline-offset-2 hover:underline">
                                {t('consent.choose')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
        </>
    );
}

export default ConsentBanner;
