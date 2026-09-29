import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { KhatamEmblem } from '../ui/Khatam';
import PageGuideContent from './PageGuideContent';
import { PAGE_GUIDES } from './pageGuides';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { t } from '@/i18n';

const TRANSITION_MS = 250;

const onPage = (anchor) => typeof document !== 'undefined' && !!document.querySelector(`[data-guide="${anchor}"]`);

/**
 * A page's guide, over the page: a sheet from the bottom on a phone and a panel from the reading
 * end on a wide screen, so the page it explains stays in view beside it. Opened only by the
 * reader (`PageGuideLink`), never by itself.
 */
function PageGuideSheet({ id, open, onClose, onShowMe }) {
    const [rendered, setRendered] = useState(open);
    const [visible, setVisible] = useState(false);
    const panel = useRef(null);
    const guide = PAGE_GUIDES[id];

    useEffect(() => {
        if (open) {
            setRendered(true);
            const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
            return () => cancelAnimationFrame(raf);
        }
        setVisible(false);
        const timeout = setTimeout(() => setRendered(false), TRANSITION_MS);
        return () => clearTimeout(timeout);
    }, [open]);

    useFocusTrap(open && rendered, panel, onClose);

    if (!rendered || !guide) return null;
    const title = t(`guide.pages.${id}.title`);

    return createPortal((
        <div className="fixed inset-0 z-[2000]">
            <div
                aria-hidden="true"
                onClick={onClose}
                className={`absolute inset-0 bg-black/45 lg:bg-black/25 transition-opacity duration-[250ms] ${visible ? 'opacity-100' : 'opacity-0'}`}
            />
            <div
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`guide-sheet-${id}`}
                tabIndex={-1}
                className={`absolute flex flex-col bg-surface outline-none shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.35)]
                    inset-x-0 bottom-0 max-h-[92dvh] rounded-t-xl border-t border-border-light
                    lg:inset-x-auto lg:end-0 lg:top-0 lg:bottom-0 lg:max-h-none lg:w-[31rem] lg:rounded-none lg:border-t-0 lg:border-s
                    transition-transform duration-[250ms] ease-out
                    ${visible ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-y-0 lg:ltr:translate-x-full lg:rtl:-translate-x-full'}`}
            >
                <header className="relative flex-shrink-0 border-b border-border-light bg-gradient-to-b from-gold-light/50 to-surface">
                    <span aria-hidden="true" className="block mx-auto mt-2.5 w-10 h-1 rounded-full bg-border lg:hidden" />
                    <div className="flex items-start gap-4 px-5 pt-4 pb-5 lg:pt-6">
                        <KhatamEmblem icon={guide.icon} size="sm" className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gold-ink">{t('guide.sheet.kicker')}</p>
                            <h2 id={`guide-sheet-${id}`} className="font-serif text-[2rem] font-semibold leading-none mt-1">{title}</h2>
                            <p className="text-sm text-text-secondary leading-relaxed mt-2">{t(`guide.pages.${id}.lede`)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={t('guide.sheet.close')}
                            className="flex-shrink-0 -me-1 p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">
                    <PageGuideContent id={id} available={onPage} onShowMe={onShowMe} />
                    <footer className="flex flex-col items-center gap-2 mt-10 pt-6 border-t border-border-light text-sm">
                        <Link to={`/guide/${guide.slug}`} className="font-semibold">{t('guide.sheet.fullGuide')}</Link>
                        <Link to="/guide" className="text-text-muted">{t('guide.sheet.tour')}</Link>
                    </footer>
                </div>
            </div>
        </div>
    ), document.body);
}

export default PageGuideSheet;
