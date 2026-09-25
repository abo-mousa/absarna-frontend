import { tOptional } from '@/i18n';

/**
 * Words for a video's format (backend `VideoFormat`). Only words live here: the list of formats,
 * their families and which are in use all come from `GET /api/formats` (`useFormats`), so this
 * client keeps no copy of the enum and no rule about it — a mobile app reads the same list.
 *
 * <p>`tOptional`, because the value is data: a format the backend adds before this catalog knows
 * it is a normal state, and it renders nothing rather than a key.
 */
export function formatLabel(format) {
    return format ? tOptional(`formats.one.${format}`) || '' : '';
}

/** «وثائقيات», for a chip. Falls back to the singular, then to nothing. */
export function formatChipLabel(format) {
    return format ? tOptional(`formats.many.${format}`) || formatLabel(format) : '';
}
