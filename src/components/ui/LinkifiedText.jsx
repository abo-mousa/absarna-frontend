import { safeExternalUrl } from '@/lib/media';

/**
 * Renders user-authored text, turning bare URLs into links.
 *
 * <p>YouTube descriptions are largely links — to the rest of a series, to the author's other
 * channels, to source material — and importing them as plain text throws that away: the reader
 * sees a URL and has to select and copy it by hand.
 *
 * <p><b>Never `dangerouslySetInnerHTML`.</b> This text comes from YouTube and from channel owners,
 * so it is untrusted. The string is split on a URL pattern and the pieces are rendered as React
 * children — text stays text, and a link is an element we construct — which makes injection
 * impossible by construction rather than by sanitising.
 *
 * <p>Each candidate still goes through `safeExternalUrl`, the same scheme allowlist every other
 * external link on the site uses. Anything it rejects is left as plain text: showing the
 * characters is right, making them clickable is not.
 */

// Deliberately narrow: http(s) only, and no attempt at bare "www." or naked domains. A greedy
// matcher on Arabic prose finds "links" in ordinary punctuation, and a wrong link is worse than a
// missing one.
const URL_PATTERN = /(https?:\/\/[^\s<>"'()]+)/g;

// A URL at the end of a sentence collects the sentence's punctuation. Trailing characters that
// cannot end a URL are handed back to the text.
const TRAILING = /[.,;:!؟،]+$/;

function LinkifiedText({ text, className = '' }) {
    if (!text) return null;

    const pieces = String(text).split(URL_PATTERN);

    return (
        <p className={`whitespace-pre-wrap ${className}`}>
            {pieces.map((piece, index) => {
                // split() with one capture group alternates text, match, text, match…
                if (index % 2 === 0) return piece;

                const trailing = piece.match(TRAILING)?.[0] ?? '';
                const candidate = trailing ? piece.slice(0, -trailing.length) : piece;
                const href = safeExternalUrl(candidate);

                if (!href) return piece;
                return (
                    <span key={index}>
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            // dir="ltr" so a URL inside Arabic text is not reordered into
                            // nonsense by the bidi algorithm.
                            dir="ltr"
                            className="text-primary hover:underline break-all"
                        >
                            {candidate}
                        </a>
                        {trailing}
                    </span>
                );
            })}
        </p>
    );
}

export default LinkifiedText;
