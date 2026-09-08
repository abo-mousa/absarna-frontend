import { useState } from 'react';

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
 */
function Avatar({ src, name = '', size = 'md', color, className = '' }) {
    const [failedSrc, setFailedSrc] = useState(null);

    if (src && src !== failedSrc) {
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
            className={`${SIZES[size]} rounded-full text-white flex items-center justify-center font-semibold flex-shrink-0 ${color ? '' : 'bg-primary'} ${className}`}
            style={color ? { background: color } : undefined}
        >
            {name?.trim()?.[0]?.toUpperCase() || '?'}
        </div>
    );
}

export default Avatar;
