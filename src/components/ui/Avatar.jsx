import { useState } from 'react';
import { useConsent } from '@/contexts/ConsentContext';
import { isGoogleHostedImage } from '@/lib/consent';

const SIZES = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-2xl',
};

/**
 * A channel logo or a user's picture, falling back to the initial.
 *
 * <p><b>`onError` is not polish here.</b> `src` is an owner-supplied external URL — a YouTube
 * avatar prefilled by `/api/youtube/resolve`, or anything typed into the channel form — so it can
 * be dead, moved, hotlink-blocked, or refused by the SPA's own `img-src` policy, which names a
 * fixed list of hosts. A failed `<img>` renders as the browser's broken-image glyph inside a
 * `rounded-full` box, which reads as a bug rather than as "this channel has no logo". The
 * initial-letter block below is a perfectly good answer and was already written; nothing routed
 * to it once an image had been attempted.
 *
 * <p>The failed URL is latched rather than a boolean, so a re-render does not retry a URL already
 * known to fail while a genuinely different `src` still gets its own attempt.
 *
 * <p><b>A Google-hosted picture waits for consent</b>, like every other request to Google on this
 * site: the logos the create form prefilled from YouTube are `yt3.ggpht.com` links, and drawing one
 * sends the reader's browser to Google before they have answered the banner. Every channel logo in
 * the app is drawn here — cards, channel page, sidebar — so this is the one place that has to know.
 * Until consent, the initial below is what shows. An uploaded logo is on our own host and is never
 * held back.
 */
/**
 * <p><b>One look for every picture-less channel and account: the brand's own pair.</b> The initial
 * is gold on the platform's teal — the two colours of the iris mark itself. It used to be each
 * channel's `primaryColor`, which put a random palette down the sidebar and across the cards, and
 * the colour picker behind it has gone from the create form now that a channel can have a photo.
 */
function Avatar({ src, name = '', size = 'md', className = '' }) {
    const [failedSrc, setFailedSrc] = useState(null);
    const { youtubeAllowed } = useConsent();
    const heldForConsent = isGoogleHostedImage(src) && !youtubeAllowed;

    if (src && src !== failedSrc && !heldForConsent) {
        return (
            <img
                src={src}
                alt={name}
                onError={() => setFailedSrc(src)}
                className={`${SIZES[size]} rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <div
            className={`${SIZES[size]} rounded-full bg-primary text-gold flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
        >
            {name?.trim()?.[0]?.toUpperCase() || '?'}
        </div>
    );
}

export default Avatar;
