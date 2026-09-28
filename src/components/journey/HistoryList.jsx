import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, ListVideo } from 'lucide-react';
import { QueryState, ViewTabs } from '../ui';
import { VideoCard, BookCard } from '../content';
import { useGroupedWatchHistory, useReadingHistory } from '@/hooks/useVideos';
import { formatCount } from '@/lib/numbers';
import { t } from '@/i18n';

/**
 * What the reader watched and read, newest first — the old History page, now a section of the
 * record. A series is one entry (the backend groups it: the card resumes the episode watched last,
 * the line under it opens the series). Clearing lives in the record's control panel, once, with
 * the question the old per-list button never asked: the counts too, or only the list.
 */
function HistoryList() {
    const navigate = useNavigate();
    const [kind, setKind] = useState('videos');
    const watchHistory = useGroupedWatchHistory();
    const readingHistory = useReadingHistory();
    const isVideos = kind === 'videos';
    const { data: history = [], isLoading, isError, error, refetch } = isVideos ? watchHistory : readingHistory;
    return (
        <div>
            <div className="mb-5 border-b border-border">
                <ViewTabs
                    label={t('journey.record.historyTitle')}
                    items={[
                        { key: 'videos', label: t('common.videos'), active: isVideos, onClick: () => setKind('videos') },
                        { key: 'books', label: t('common.books'), active: !isVideos, onClick: () => setKind('books') },
                    ]}
                />
            </div>
            <QueryState
                isLoading={isLoading}
                isError={isError}
                error={error}
                onRetry={refetch}
                isEmpty={history.length === 0}
                errorTitle={t('history.loadFailed')}
                emptyIcon={HistoryIcon}
                emptyTitle={isVideos ? t('history.emptyWatch') : t('history.emptyRead')}
                emptyDescription={isVideos ? t('history.emptyWatchDescription') : t('history.emptyReadDescription')}
            >
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                    {isVideos
                        ? history.map((entry) => (
                              // Keyed by videoId: a watch row has no id of its own.
                              <div key={entry.videoId} className="min-w-0">
                                  <VideoCard
                                      video={entry.video}
                                      onClick={() => navigate(`/video/${entry.videoId}`)}
                                      watch={{ progress: entry.progress, finished: entry.finished }}
                                  />
                                  {entry.episodesWatched != null && entry.video?.seriesId && (
                                      <button
                                          type="button"
                                          onClick={() => navigate(`/series/${entry.video.seriesId}`)}
                                          className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-gold-ink hover:underline"
                                      >
                                          <ListVideo size={14} className="flex-shrink-0" />
                                          {t('history.episodesWatched', { count: formatCount(entry.episodesWatched) })}
                                      </button>
                                  )}
                              </div>
                          ))
                        : history.map((entry) => (
                              <BookCard key={entry.id} book={entry.book} progress={entry.progress} />
                          ))}
                </div>
            </QueryState>
        </div>
    );
}

export default HistoryList;
