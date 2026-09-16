export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * The address a reader writes to for support, a privacy request, or a takedown complaint.
 *
 * <p><b>There is deliberately no fallback.</b> Every other value in this module has one because a
 * wrong-but-plausible default is harmless there — an API base URL that points at localhost fails
 * loudly on the first request. An email address fails the other way round: a made-up
 * `info@absarna.com` renders a perfectly normal-looking `mailto:` that a reader clicks, writes a
 * takedown notice to, and never hears back from, because nobody has ever owned that mailbox. The
 * complaint is then lost in a way neither side can see. So an unset value stays empty and the
 * Contact page says plainly that the address is not configured yet — visibly missing beats
 * invisibly broken, the same rule `t()` follows for a missing string.
 *
 * <p>Trimmed because this arrives from a `.env` file where a trailing space is invisible, and it
 * ends up inside a `mailto:` URL where it is not.
 *
 * <p>Read at BUILD time like everything else here: changing it means a rebuild, not a restart.
 * That is a real constraint on the operator and it is why the not-configured state has to be a
 * designed screen rather than an assertion — a deploy that forgets it must still serve a usable
 * site.
 */
export const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL || '').trim();
