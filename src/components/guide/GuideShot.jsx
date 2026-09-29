import { useRef, useState } from 'react';
import { KhatamStar } from '../ui/Khatam';
import { shotMeta, shotSrc } from './guideShotMeta';
import { useTheme } from '@/contexts/ThemeContext';
import { handMoved } from '@/lib/pointer';
import { t } from '@/i18n';

const FRAME_PAD = 6;

/**
 * A screenshot of the real page, on a mat, with its captions under it — and nothing drawn on the
 * picture until a caption is chosen (product owner, 2026-09-29). Numbers and leader lines were
 * tried and dropped: a dense page has no clear place for them, so they sat on the very words and
 * stars they explained. Now a caption, touched or pointed at, dims the rest of the picture and
 * frames its part in gold — the same gesture «أرِني في الصفحة» makes on the page itself — and the
 * frame glides from one part to the next. Pointing at a part of the picture lights its caption.
 *
 * <p>`cut` fades an edge where the picture is a slice of something longer (the milestone road).
 */
function GuideShot({ name, captions = [], cut = null }) {
    const theme = useTheme()?.theme;
    // A click pins a part; pointing previews one over the pin and gives it back on leaving. Kept
    // apart because one state for both made a click on a hovered caption toggle it off.
    const [pinned, setPinned] = useState(null);
    const [pointed, setPointed] = useState(null);
    const picture = useRef(null);
    const meta = shotMeta(name);
    if (!meta) return null;
    const active = pointed ?? pinned;
    const marks = meta.marks.slice(0, captions.length);
    // The frame keeps the last place it framed while it fades, so it never shrinks to a corner.
    const [x, y, w, h] = marks[active ?? 0] || [0, 0, 100, 100];
    const on = active != null;
    // Larger parts under smaller ones, so a part inside another (a legend inside its grid) can
    // still be pointed at.
    const areas = marks.map((mark, index) => ({ mark, index })).sort((a, b) => b.mark[2] * b.mark[3] - a.mark[2] * a.mark[3]);
    const choose = (index) => {
        setPinned((current) => (current === index ? null : index));
        setPointed(null);
        picture.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    // Only the hand points: a part scrolled under a still cursor is not being pointed at.
    const enter = (index) => (event) => { if (handMoved(event)) setPointed(index); };
    const leave = () => setPointed(null);

    return (
        <figure className="flex flex-col gap-3">
            <div className="relative rounded-lg bg-bg ring-1 ring-border-light p-2.5 sm:p-3">
                <span className="absolute -top-2.5 end-3 z-10 px-2 py-0.5 rounded-sm border border-border-light bg-surface text-[0.65rem] font-semibold text-text-muted">
                    {t('guide.sheet.example')}
                </span>
                <div
                    ref={picture}
                    className="relative overflow-hidden rounded-md ring-1 ring-border-light shadow-[0_1px_2px_rgb(0_0_0/0.05),0_10px_28px_-14px_rgb(0_0_0/0.35)] scroll-my-4"
                    style={{ aspectRatio: `${meta.w} / ${meta.h}` }}
                >
                    <img
                        src={shotSrc(name, meta.locale, theme, meta.ext)}
                        alt=""
                        width={meta.w}
                        height={meta.h}
                        loading="lazy"
                        decoding="async"
                        draggable="false"
                        className="absolute inset-0 w-full h-full select-none"
                    />
                    {cut && (
                        <span aria-hidden="true"
                              className={`absolute inset-x-0 h-12 pointer-events-none from-bg to-transparent ${cut === 'top' ? 'top-0 bg-gradient-to-b' : 'bottom-0 bg-gradient-to-t'}`} />
                    )}
                    {/* Physical left/top: the marks were measured on the picture as it is. */}
                    {areas.map(({ mark: [ax, ay, aw, ah], index }) => (
                        <span
                            key={index}
                            aria-hidden="true"
                            onMouseEnter={enter(index)}
                            onMouseLeave={leave}
                            onClick={() => choose(index)}
                            className="absolute cursor-pointer"
                            style={{ left: `${ax}%`, top: `${ay}%`, width: `${aw}%`, height: `${ah}%` }}
                        />
                    ))}
                    <span
                        aria-hidden="true"
                        className={`absolute rounded-md pointer-events-none ring-2 ring-gold transition-[left,top,width,height,opacity] duration-300 ease-out motion-reduce:transition-opacity ${
                            on ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                            left: `calc(${x}% - ${FRAME_PAD}px)`,
                            top: `calc(${y}% - ${FRAME_PAD}px)`,
                            width: `calc(${w}% + ${2 * FRAME_PAD}px)`,
                            height: `calc(${h}% + ${2 * FRAME_PAD}px)`,
                            boxShadow: '0 0 0 200vmax rgb(20 16 8 / 0.42), 0 0 0 5px rgb(var(--color-gold) / 0.25)',
                        }}
                    />
                </div>
            </div>
            {captions.length > 0 && (
                <ul className="flex flex-col gap-1">
                        {captions.map((caption, index) => {
                            const lit = active === index;
                            return (
                                <li key={caption}>
                                    <button
                                        type="button"
                                        aria-pressed={lit}
                                        onClick={() => choose(index)}
                                        onMouseEnter={enter(index)}
                                        onMouseLeave={leave}
                                        // Keyboard focus only: a click focuses the button too, and
                                        // would keep showing a part the click just unpinned.
                                        onFocus={(event) => { if (event.target.matches(':focus-visible')) setPointed(index); }}
                                        onBlur={leave}
                                        className={`flex items-start gap-3 w-full text-start rounded-md px-3 py-2 transition-colors ring-1 ${
                                            lit ? 'bg-gold-light/70 ring-gold/50' : 'ring-transparent hover:bg-surface-hover'
                                        }`}
                                    >
                                        <KhatamStar
                                            filled={lit}
                                            strokeWidth={9}
                                            className={`w-3.5 h-3.5 mt-[0.3rem] flex-shrink-0 transition-colors ${lit ? 'text-gold' : 'text-gold/70'}`}
                                        />
                                        <span className="text-sm leading-relaxed text-text-primary">{caption}</span>
                                    </button>
                                </li>
                            );
                        })}
                </ul>
            )}
        </figure>
    );
}

export default GuideShot;
