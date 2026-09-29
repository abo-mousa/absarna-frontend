import { t, tOptional } from '@/i18n';

/**
 * The form fields the backend refused, from a failed request: `VALIDATION_FAILED` answers with
 * the request DTO's own field names (`title`, `logoUrl`…), which the forms use as the `field` of
 * each `Input`, and a field-shaped business refusal (a taken slug) names its field here too. An
 * empty set for any other error, so a form can pass whatever error it last had without first
 * asking what kind it was.
 */
export function rejectedFieldsOf(error) {
    return new Set(fieldMessagesOf(error).keys());
}

/**
 * Refusals the backend makes in a service rather than in bean validation, but which are about one
 * field all the same. They arrive as a `reason` with no `fields`, so without this the toast said
 * the address was taken and the form marked nothing.
 */
const REASON_FIELDS = {
    CHANNEL_SLUG_TAKEN: 'slug',
    CHANNEL_SLUG_RESERVED: 'slug',
    CHANNEL_SLUG_INVALID: 'slug',
};

/**
 * The sentence for one refused field — `{field, code, min, max, value}` from the backend's
 * `fieldErrors`. A wording for this field's own rule wins (`errors.fieldRules.byField.slug.Pattern`:
 * "an address takes only…" says more than "not in the accepted format"), then the rule's general
 * wording, then a plain "not accepted". Never the backend's English: it words nothing for a reader.
 */
export function fieldErrorMessage({ field, code, min, max, value } = {}) {
    const own = field && code ? tOptional(`errors.fieldRules.byField.${field}.${code}`) : null;
    if (own) return own;
    if (code === 'Size') {
        if (min != null && max != null) return t('errors.fieldRules.sizeBetween', { min, max });
        if (max != null) return t('errors.fieldRules.sizeMax', { max });
        if (min != null) return t('errors.fieldRules.sizeMin', { min });
    }
    if ((code === 'Min' || code === 'Max') && value != null) {
        return t(`errors.fieldRules.${code === 'Min' ? 'min' : 'max'}`, { value });
    }
    return (code && tOptional(`errors.fieldRules.${code}`)) || t('errors.fieldRules.Invalid');
}

/**
 * Every refused field of a failed request and the sentence to show under it, as a `Map` in the
 * order the backend listed them. The first rule a field broke is the one worded — one fix at a
 * time, and a blank field is also "too short". An empty map for anything else.
 *
 * <p>Reads `fieldErrors` (which rule), falls back to `fields` (names only, a backend from before
 * `fieldErrors`) with the plain sentence, and maps a field-shaped `reason` onto its field.
 */
export function fieldMessagesOf(error) {
    const data = error?.response?.data;
    const messages = new Map();
    if (!data) return messages;
    const fieldReason = REASON_FIELDS[data.reason];
    if (fieldReason) {
        messages.set(fieldReason, tOptional(`errors.reasons.${data.reason}`) ?? t('errors.fieldRules.Invalid'));
        return messages;
    }
    if (data.reason !== 'VALIDATION_FAILED') return messages;
    if (Array.isArray(data.fieldErrors)) {
        for (const entry of data.fieldErrors) {
            if (!entry || typeof entry.field !== 'string' || !entry.field || messages.has(entry.field)) continue;
            messages.set(entry.field, fieldErrorMessage(entry));
        }
    }
    if (Array.isArray(data.fields)) {
        for (const name of data.fields) {
            if (typeof name === 'string' && name && !messages.has(name)) {
                messages.set(name, t('errors.fieldRules.Invalid'));
            }
        }
    }
    return messages;
}

/**
 * Only the server's answer from a failed request — what `RejectedFields` reads — for a form to
 * keep in state. The whole axios error carries the request too, and on the signup and profile
 * forms that is the password just typed: nothing sends it anywhere, but a form has no reason to
 * hold it after the request has failed.
 */
export function keepRefusal(error) {
    const data = error?.response?.data;
    return data ? { response: { data } } : null;
}
