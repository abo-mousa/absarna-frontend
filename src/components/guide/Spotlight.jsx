import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { KhatamStar } from '../ui/Khatam';
import { t } from '@/i18n';

const PAD = 8;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * «أرِني في الصفحة»: the page dimmed around one of its parts, a gold frame on it and its name
 * beside it. Nothing on the page is changed or clicked for the reader — a click anywhere, Escape
 * or «فهمت» puts it away.
 *
 * <p>The frame follows the element every frame rather than being placed once, because the page
 * scrolls smoothly to it after the frame appears, and a late-loading image above it can still
 * move it.
 */
function Spotlight({ anchor, title, onDone }) {
    const [rect, setRect] = useState(null);
    const done = useRef(null);

    useLayoutEffect(() => {
        const element = document.querySelector(`[data-guide="${anchor}"]`);
        if (!element) {
            onDone();
            return undefined;
        }
        element.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
        let frame;
        let last = '';
        const track = () => {
            const r = element.getBoundingClientRect();
            const key = `${r.left}|${r.top}|${r.width}|${r.height}`;
            if (key !== last) {
                last = key;
                setRect({ left: r.left, top: r.top, width: r.width, height: r.height });
            }
            frame = requestAnimationFrame(track);
        };
        track();
        return () => cancelAnimationFrame(frame);
    }, [anchor, onDone]);

    useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') onDone(); };
        document.addEventListener('keydown', onKey);
        done.current?.focus({ preventScroll: true });
        return () => document.removeEventListener('keydown', onKey);
    }, [onDone]);

    if (!rect) return null;
    const hole = {
        left: Math.max(4, rect.left - PAD),
        top: Math.max(4, rect.top - PAD),
        width: Math.min(window.innerWidth - 8, rect.width + 2 * PAD),
        height: Math.min(window.innerHeight - 8, rect.height + 2 * PAD),
    };
    const cardWidth = Math.min(320, window.innerWidth - 32);
    const below = hole.top + hole.height + 16 + 110 < window.innerHeight;
    const above = hole.top - 16 - 110 > 0;
    const cardTop = below ? hole.top + hole.height + 14 : above ? hole.top - 14 - 96 : window.innerHeight - 16 - 96;
    const cardLeft = Math.min(Math.max(16, hole.left + hole.width / 2 - cardWidth / 2), window.innerWidth - 16 - cardWidth);

    return createPortal((
        <div className="fixed inset-0 z-[2100]" onClick={onDone} role="presentation">
            <div
                aria-hidden="true"
                className="fixed rounded-lg border-2 border-gold pointer-events-none motion-safe:transition-[left,top,width,height] motion-safe:duration-200"
                style={{ ...hole, boxShadow: '0 0 0 200vmax rgb(0 0 0 / 0.55), 0 0 0 6px rgb(var(--color-gold) / 0.25)' }}
            />
            <div
                role="dialog"
                aria-label={title}
                className="fixed flex items-center gap-3 p-3.5 rounded-lg bg-surface border border-border-light shadow-xl motion-safe:animate-[guide-pop_240ms_ease-out_both]"
                style={{ top: cardTop, left: cardLeft, width: cardWidth }}
                onClick={(event) => event.stopPropagation()}
            >
                <KhatamStar className="w-5 h-5 flex-shrink-0 text-gold" />
                <p className="flex-1 font-serif text-[1.3rem] font-semibold leading-tight">{title}</p>
                <button
                    ref={done}
                    type="button"
                    onClick={onDone}
                    className="px-3.5 py-1.5 rounded-md bg-primary text-white text-sm font-semibold"
                >
                    {t('guide.sheet.gotIt')}
                </button>
            </div>
        </div>
    ), document.body);
}

export default Spotlight;
