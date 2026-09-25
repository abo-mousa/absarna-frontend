import { t, tOptional } from '@/i18n';

/**
 * A video's format (backend `VideoFormat`): what kind of thing it is, as opposed to what it is
 * about (`category`). The backend sends the enum's name; the words for it live in the catalog
 * under `formats.one` (a card's kicker) and `formats.many` (a chip).
 *
 * <p>The list here is the backend's, in its order — news first, then learning — and is used only
 * where every option must be offered (the edit form, the channel default). Discover's chips come
 * from `GET /api/formats` instead, which lists only formats some video actually has.
 */
export const FORMATS = [
    'REPORT', 'ANALYSIS', 'INTERVIEW', 'TESTIMONY',
    'DOCUMENTARY', 'PROGRAMME', 'LECTURE', 'TALK', 'SHORT_FILM',
];

/**
 * «وثائقي» for DOCUMENTARY. `tOptional`, because the value is data: a format the backend adds
 * before this catalog knows it is a normal state, and it renders nothing rather than a key.
 */
export function formatLabel(format) {
    return format ? tOptional(`formats.one.${format}`) || '' : '';
}

/** «وثائقيات», for a chip. Falls back to the singular, then to nothing. */
export function formatChipLabel(format) {
    return format ? tOptional(`formats.many.${format}`) || formatLabel(format) : '';
}

/**
 * The option list for a video's format select, and the value it starts on.
 *
 * <p>The backend cannot clear a format through PATCH (it merges, skipping nulls), so the empty
 * option — "same as the channel" — is offered only while the video has no explicit format of its
 * own. Offering it after one is set would be a control that saves and changes nothing.
 * `video.format` is the effective one; `formatInherited` says it came from the channel.
 */
export function formatSelectOptions(video, channelDefault) {
    const explicit = video && !video.formatInherited ? video.format || '' : '';
    const inherited = channelDefault || (video?.formatInherited ? video.format : null);
    const options = FORMATS.map((value) => ({ value, label: formatLabel(value) }));
    if (!explicit) {
        options.unshift({
            value: '',
            label: inherited ? t('formats.inherit', { format: formatLabel(inherited) }) : t('formats.unset'),
        });
    }
    return { value: explicit, options };
}
