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
 *
 * <p><b>Two halves, because they are written in two directions.</b> `name` is someone's own words
 * (the series title, or format and category) and takes the direction of its own text; `place` is
 * the app's count («١٠٣ من ١٤٠», "103 of 140") and takes the interface's. Joined into one
 * `dir="auto"` run, an Arabic series title made the whole line right-to-left, and the English
 * build's "1 of 30" came out reordered inside it. `text` is the two joined, for anything that
 * needs the line as a single string (a tooltip, a test).
 */
export function videoKicker(video) {
    if (video?.seriesId && video.seriesTitle) {
        const position = Number(video.seriesPosition);
        const total = Number(video.seriesLength);
        let place = null;
        if (position > 0 && total >= position) {
            place = t('series.placeOf', { position, total });
        } else if (position > 0) {
            place = t('series.place', { position });
        }
        const name = video.seriesTitle;
        return { text: place ? `${name} · ${place}` : name, name, place, seriesId: video.seriesId };
    }
    // Outside a series: what kind of thing it is, then what it is about — «وثائقي · تاريخ». Either
    // half alone when the other is missing. The format is the effective one (the channel's
    // default fills in a video with none), so an imported catalogue says something here without
    // its owner editing a single row.
    const parts = [formatLabel(video?.format), video?.category].filter(Boolean);
    if (parts.length) {
        const text = parts.join(' · ');
        return { text, name: text, place: null, seriesId: null };
    }
    return null;
}
