import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Play } from 'lucide-react';
import { Modal, Button, KhatamStar, Spinner } from '@/components/ui';
import { useSeriesDetail } from '@/hooks/useSeries';
import { useGoals } from '@/hooks/useGoals';
import { goalFor, bookPortion } from '@/lib/journey';
import { averageMinutes, chosenByText, itemKey, prefillFor } from '@/lib/goalChoice';
import { amountText, learningTime } from '@/lib/goalText';
import { Poster } from './parts';
import PaceStepper from '../PaceStepper';
import PortionTrack from '../PortionTrack';
import { formatDigits, t } from '@/i18n';

/**
 * What a reader sees before committing to a programme or a book: enough to answer "is this for me,
 * and can I keep it up?" without leaving the choice — the first episode to try, how long an episode
 * runs, the whole in hours, where a portion a day leads, and every episode by name, paged inside the sheet.
 *
 * <p>«اجعله وِردي» here is the ONE commit button of the whole choosing flow: a card anywhere opens
 * this sheet, and nothing else starts a goal. A programme already pursued says so and links to it.
 */
function PreviewSheet({ item, proposal = null, deadline = null, shortlist, onToggle, onCommit, onClose }) {
    const series = item.kind === 'FINISH_SERIES';
    const detail = useSeriesDetail(series ? item.targetId : null, 20, series);
    const goals = useGoals();
    const existing = goalFor(goals.data, series ? { seriesId: item.targetId } : { bookId: item.targetId });
    const page = detail.data?.pages?.[0];
    const episodes = detail.data?.pages?.flatMap((each) => each.content || []) || [];
    const firstEpisode = episodes[0] || item.firstEpisode || null;

    const units = series ? (page?.series?.contentCount ?? item.episodes ?? 0) : (item.pages ?? item.book?.pages ?? 0);
    // From the first page only, so the figures above do not shift as «تحميل المزيد» loads more.
    const average = series ? averageMinutes(page?.content || []) : null;
    // The reader's own pace: from the proposal they opened (whatever they set on its card), else
    // one episode, or a month's worth of pages; − and + re-cut the track, and it is what the goal
    // dialog opens with.
    const [chosen, setChosen] = useState(null);
    const amount = chosen ?? (proposal?.amount || (series ? 1 : bookPortion(units, 0)));
    const saved = shortlist.some((entry) => itemKey(entry) === itemKey(item));
    const description = series ? page?.series?.description : item.book?.description;

    return (
        <Modal open onClose={onClose} title={item.title} maxWidth="620px">
            <div className="flex flex-col gap-5">
                {/* The picture is a thumbnail beside the facts, not a hero: what a reader is deciding
                    on is the episodes below, and on a phone a full-width poster pushed them off the
                    first screen. */}
                <div className="flex items-start gap-4">
                    <Poster item={{ ...item, firstEpisode }} className="aspect-video w-32 sm:w-40 flex-shrink-0" />
                    <div className="flex flex-col gap-1 min-w-0">
                        {item.channelName && <span className="text-sm text-text-secondary">{item.channelName}</span>}
                        <span className="text-sm">
                            {[
                                units ? amountText(series ? 'EPISODES' : 'PAGES', units) : null,
                                average ? t('journey.choose.perEpisode', { minutes: learningTime(average) }) : null,
                                average && units ? t('journey.choose.total', { time: learningTime(average * units) }) : null,
                            ].filter(Boolean).join(' · ')}
                        </span>
                        {item.chosenBy ? <span className="text-sm text-gold-ink">{chosenByText(item.chosenBy)}</span> : null}
                        {series && firstEpisode && (
                            <Link to={`/video/${firstEpisode.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold mt-1">
                                <Play size={14} fill="currentColor" aria-hidden="true" />{t('journey.choose.watchFirst')}
                            </Link>
                        )}
                    </div>
                </div>

                {description && <p dir="auto" className="font-reading text-sm leading-loose text-text-secondary line-clamp-3">{description}</p>}

                {units > 0 && (
                    <div className="flex flex-col gap-3 rounded-md bg-bg p-3">
                        <PaceStepper measure={series ? 'EPISODES' : 'PAGES'} amount={amount} onChange={setChosen} max={Math.max(1, units)} />
                        {series && average ? (
                            <span className="text-xs text-center text-text-secondary -mt-1">
                                {t('journey.choose.aboutMinutesADay', { minutes: learningTime(average * amount) })}
                            </span>
                        ) : null}
                        <PortionTrack total={units} amount={amount} measure={series ? 'EPISODES' : 'PAGES'} deadline={deadline} />
                    </div>
                )}

                {/* Every episode by name, inside the sheet: the titles are what the programme
                    holds, and the reader should not have to leave the choice to read past three. */}
                {series && (
                    <section className="flex flex-col">
                        {units > 0 && <h3 className="text-sm font-bold pb-1">{t('journey.choose.allEpisodes', { count: amountText('EPISODES', units) })}</h3>}
                        {detail.isLoading && <Spinner />}
                        <ol>
                            {episodes.map((video, index) => (
                                <li key={video.id} className="flex items-start justify-between gap-3 py-2 border-b border-border-light text-sm">
                                    <span className="flex items-start gap-3 min-w-0">
                                        <span className="text-text-muted w-6 flex-shrink-0 tabular-nums">{formatDigits(index + 1)}</span>
                                        <span dir="auto" className="line-clamp-2">{video.title}</span>
                                    </span>
                                    {video.duration && <span className="text-text-muted flex-shrink-0">{formatDigits(video.duration)}</span>}
                                </li>
                            ))}
                        </ol>
                        {detail.hasNextPage && (
                            <Button variant="ghost" className="mt-2 self-center" onClick={() => detail.fetchNextPage()} disabled={detail.isFetchingNextPage}>
                                {detail.isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
                            </Button>
                        )}
                    </section>
                )}

                <div className="sticky -bottom-6 -mx-6 -mb-6 px-6 py-4 flex items-center gap-3 border-t border-border-light bg-surface">
                    <button
                        type="button"
                        onClick={() => onToggle(item)}
                        aria-pressed={saved}
                        aria-label={saved ? t('journey.choose.saved') : t('journey.choose.save')}
                        className={`w-12 h-12 flex-shrink-0 rounded-md border border-border flex items-center justify-center ${saved ? 'text-primary' : 'text-text-primary'}`}
                    >
                        <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
                    </button>
                    {existing ? (
                        <Link to={`/journey/goals/${existing.id}`} className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-md border border-border font-semibold hover:no-underline">
                            <KhatamStar filled className="w-4 h-4 text-gold" strokeWidth={10} />{t('journey.inWird')}
                        </Link>
                    ) : (
                        <Button className="flex-1 h-12" onClick={() => onCommit(prefillFor(item, amount, deadline))}>{t('journey.choose.makeIt')}</Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}

export default PreviewSheet;
