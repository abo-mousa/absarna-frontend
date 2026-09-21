import { safeStorage } from '@/lib/safeStorage';

/**
 * Whether this reader has agreed to let Google receive data about them.
 *
 * <h4>What this is actually about</h4>
 *
 * <p>Imported videos play from YouTube's own player, and every card for one asks
 * `img.youtube.com` for its thumbnail. Both are requests from the reader's browser straight to
 * Google, carrying their IP address, user agent and the page they came from — on the home feed, in
 * search and on channel pages, before anyone has clicked anything. The player additionally stores
 * things on the device; `youtube-nocookie` reduces that and does not remove it.
 *
 * <p>Google's own EU User Consent Policy requires consent for that storage and disclosure of
 * Google as a recipient. ePrivacy requires the consent to come <b>before</b> the storage, not
 * after, and GDPR requires it to be freely given, specific, informed, unambiguous and as easy to
 * withdraw as it was to give.
 *
 * <h4>Three states, and the third is the important one</h4>
 *
 * <p>`GRANTED`, `DENIED`, and <b>undecided</b> — and undecided behaves exactly like denied. That
 * is the whole point: consent has to precede the request, so a reader who has not answered yet
 * must not have already been reported to Google by the time they are asked. {@link allowsYouTube}
 * is therefore written as "is it granted", never as "is it not denied" — the same hold-list shape,
 * and for the same reason, as the content-review gate in the backend.
 *
 * <h4>Shown to everyone, not only to EU readers</h4>
 *
 * <p>GDPR Article 3(1) attaches to the <em>operator's</em> establishment, not the reader's
 * location: this platform is run from the EU and its servers are in Germany, so the obligation
 * applies to every reader it processes data about. Geo-gating the banner would therefore be both
 * legally wrong and technically unreliable — IP geolocation is a guess, and a wrong guess here is
 * a breach rather than a cosmetic error. Asking everybody is simpler and strictly safer.
 *
 * <h4>Storing the answer needs no consent of its own</h4>
 *
 * <p>The one key this writes is strictly necessary to honour the choice the reader just made —
 * without it the banner would ask again on every page, which is itself a dark pattern. That is the
 * standard exemption and it is the reason this module stores exactly one thing and nothing else.
 */

/** The key. Versioned, so a future change to WHAT is being consented to re-asks rather than
 *  inheriting an answer to a different question. */
export const CONSENT_KEY = 'consent.youtube.v1';

export const GRANTED = 'granted';
export const DENIED = 'denied';

/**
 * The stored decision, or `null` when the reader has not made one.
 *
 * <p>Anything unrecognised reads as `null`. A corrupted or half-written value is not an answer,
 * and treating it as one would either ask a reader who has already decided or — far worse — load
 * Google for one who has not.
 */
export function readConsent(storage = safeStorage) {
    const value = storage.getItem(CONSENT_KEY);
    return value === GRANTED || value === DENIED ? value : null;
}

/** Records a decision. `null` clears it, which is what "ask me again" means. */
export function writeConsent(value, storage = safeStorage) {
    if (value === GRANTED || value === DENIED) {
        storage.setItem(CONSENT_KEY, value);
    } else {
        storage.removeItem(CONSENT_KEY);
    }
}

/**
 * May this reader's browser be sent to Google?
 *
 * <p><b>Granted, never "not denied".</b> Undecided is not permission, and writing the test the
 * other way round would load a thumbnail from Google on the first page of a reader's first visit —
 * the exact request this exists to hold back — while reading as perfectly sensible code.
 */
export function allowsYouTube(consent) {
    return consent === GRANTED;
}

/**
 * Should the banner be on screen?
 *
 * <p>Only while the question is open. A banner that persists after an answer is a banner that
 * teaches people to dismiss it, and one that reappears after a refusal is not a free choice.
 */
export function shouldAskConsent(consent) {
    return consent === null;
}
