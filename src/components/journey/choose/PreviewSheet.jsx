import { Link } from 'react-router-dom';
import { Bookmark, Play } from 'lucide-react';
import { Modal, Button, KhatamStar, Spinner } from '@/components/ui';
import { useSeriesDetail } from '@/hooks/useSeries';
import { useGoals } from '@/hooks/useGoals';
import { goalFor, bookPortion } from '@/lib/journey';
import { averageMinutes, chosenByText, daysToFinish, finishText, itemKey, prefillFor } from '@/lib/goalChoice';
import { amountText, learningTime } from '@/lib/goalText';
import { Poster, WeekStrip } from './parts';
import { formatDigits, t } from '@/i18n';

/**
 * What a reader sees before committing to a programme or a book: enough to answer "is this for me,
 * and can I keep it up?" without leaving the choice — the first episode to try, how long an episode
 * runs, the whole in hours, where a portion a day leads, and the first few episodes by name.
 *
 * <p>«اجعله وِردي» here is the ONE commit button of the whole choosing flow: a card anywhere opens
 * this sheet, and nothing else starts a goal. A programme already pursued says so and links to it.
 */
function PreviewSheet({ item, proposal = null, deadline = null, deadlineDays = null, shortlist, onToggle, onCommit, onClose }) {
    const series = item.kind === 'FINISH_SERIES';
    const detail = useSeriesDetail(series ? item.targetId : null, 20, series);
    const goals = useGoals();
    const existing = goalFor(goals.data, series ? { seriesId: item.targetId } : { bookId: item.targetId });
    const page = detail.data?.pages?.[0];
    const episodes = page?.content || [];
    const firstEpisode = episodes[0] || item.firstEpisode || null;

    const units = series ? (page?.series?.contentCount ?? item.episodes ?? 0) : (item.pages ?? item.book?.pages ?? 0);
    const average = series ? averageMinutes(episodes) : null;
    const amount = proposal?.amount || (series ? 1 : bookPortion(units, 0));
    const days = daysToFinish(units, amount);
    const saved = shortlist.some((entry) => itemKey(entry) === itemKey(item));
    const description = series ? page?.series?.description : item.book?.description;

    return (
        <Modal open onClose={onClose} title={item.title} maxWidth="620px">
            <div className="flex flex-col gap-5">
                <div className="relative">
                    <Poster item={{ ...item, firstEpisode }} className="aspect-video w-full" />
                    {series && firstEpisode && (
                        <Link
                            to={`/video/${firstEpisode.id}`}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/10 hover:bg-black/20 hover:no-underline"
                        >
                            <span className="w-14 h-14 rounded-full bg-surface text-primary flex items-center justify-center shadow">
                                <Play size={22} fill="currentColor" aria-hidden="true" />
                            </span>
                            <span className="px-3 py-1 rounded-full bg-black/70 text-white text-xs font-semibold">{t('journey.choose.watchFirst')}</span>
                        </Link>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    {item.channelName && <span className="text-sm text-text-secondary">{item.channelName}</span>}
                    <span className="text-sm">
                        {[
                            units ? amountText(series ? 'EPISODES' : 'PAGES', units) : null,
                            average ? t('journey.choose.perEpisode', { minutes: learningTime(average) }) : null,
                            average && units ? t('journey.choose.total', { time: learningTime(average * units) }) : null,
                        ].filter(Boolean).join(' · ')}
                    </span>
                    {item.chosenBy ? <span className="text-sm text-gold-ink">{chosenByText(item.chosenBy)}</span> : null}
                </div>

                {description && <p dir="auto" className="font-reading text-sm leading-loose text-text-secondary line-clamp-3">{description}</p>}

                {units > 0 && (
                    <div className="flex flex-col gap-2 rounded-md border border-border-light p-3">
                        <span className="text-sm font-semibold">{t('journey.choose.paceDaily', { amount: amountText(series ? 'EPISODES' : 'PAGES', amount) })}</span>
                        <WeekStrip days={days} deadlineDays={deadlineDays} />
                        <span className="text-sm text-primary-dark dark:text-primary font-semibold">
                            {proposal && !proposal.fitsDeadline ? t('journey.choose.missesDeadline') : finishText(days)}
                        </span>
                    </div>
                )}

                {series && (
                    <div className="flex flex-col">
                        {detail.isLoading && <Spinner />}
                        {episodes.slice(0, 3).map((video, index) => (
                            <div key={video.id} className="flex items-center justify-between gap-3 py-2 border-b border-border-light text-sm">
                                <span className="flex items-center gap-3 min-w-0">
                                    <span className="text-text-muted w-4">{index + 1}</span>
                                    <span dir="auto" className="truncate">{video.title}</span>
                                </span>
                                {video.duration && <span className="text-text-muted flex-shrink-0">{formatDigits(video.duration)}</span>}
                            </div>
                        ))}
                        {units > 3 && (
                            <Link to={`/series/${item.targetId}`} className="pt-2 text-sm font-semibold">
                                {t('journey.choose.allEpisodes', { count: amountText('EPISODES', units) })}
                            </Link>
                        )}
                    </div>
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
