import { t } from '@/i18n';
import { formatLabel } from '@/lib/formats';

/**
 * The gold line above a card's title: what the item belongs to, before what it is called.
 *
 * <p>For a video in a series it is the series and the video's place in it — «السيرة النبوية · ١٠٣
 * من ١٤٠» — which is what someone scanning a grid of lectures needs first: whether this is part
 * one or part eighty. The position is the backend's `seriesPosition`/`seriesLength`, counted the
 * way the series page counts, and never `orderInSeries`, which is a sort key an owner may leave
 * null or space out. A video with a series but no position (an owner's own hidden or processing
 * row) gets the series name alone. Anything else gets its format and its category, or no line at
 * all.
 *
 * <p>`seriesId` comes back alongside the text so the card can make the line a link to the series
 * page, and only when it names one.
 */
export function videoKicker(video) {
    if (video?.seriesId && video.seriesTitle) {
        const position = Number(video.seriesPosition);
        const total = Number(video.seriesLength);
        let text = video.seriesTitle;
        if (position > 0 && total >= position) {
            text = t('series.positionOf', { series: video.seriesTitle, position, total });
        } else if (position > 0) {
            text = t('series.position', { series: video.seriesTitle, position });
        }
        return { text, seriesId: video.seriesId };
    }
    // Outside a series: what kind of thing it is, then what it is about — «وثائقي · تاريخ». Either
    // half alone when the other is missing. The format is the effective one (the channel's
    // default fills in a video with none), so an imported catalogue says something here without
    // its owner editing a single row.
    const parts = [formatLabel(video?.format), video?.category].filter(Boolean);
    if (parts.length) return { text: parts.join(' · '), seriesId: null };
    return null;
}
