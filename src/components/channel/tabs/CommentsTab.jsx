import { Eye, EyeOff, Pin, PinOff } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useChannelComments, useModerateComment } from '@/hooks/useCommentModeration';
import { t } from '@/i18n';

/** Moderating comments left on this channel's content: pin, hide, and page through the rest. */
export default function CommentsTab({ slug, active }) {
    const { showToast } = useToast();
    const {
        data: pages, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage,
    } = useChannelComments(slug, 50, active);
    const moderate = useModerateComment(slug);

    const comments = pages?.pages.flatMap((page) => page.content) || [];
    const total = pages?.pages[0]?.totalItems ?? comments.length;

    const apply = (comment, changes) => {
        moderate.mutate({ id: comment.id, ...changes }, {
            onError: () => showToast(t('channelManage.commentUpdateFailed'), 'error'),
        });
    };

    return (
        <div>
            <h3 className="text-lg font-bold mb-3">{t('channelManage.commentsHeading', { count: total })}</h3>
            {isLoading ? (
                <p className="text-sm text-text-muted py-2">{t('common.loading')}</p>
            ) : comments.length === 0 ? (
                <p className="text-sm text-text-muted py-4">{t('channelManage.noComments')}</p>
            ) : (
                <div className="grid gap-2">
                    {comments.map((comment) => (
                        <div
                            key={comment.id}
                            className={`p-3 rounded-md border border-border-light ${
                                comment.hidden ? 'bg-surface-hover' : 'bg-surface'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3 mb-1.5">
                                <div className="min-w-0">
                                    <strong className="text-primary text-sm">{comment.userName}</strong>
                                    {comment.hidden && (
                                        <span className="mr-2 text-xs text-text-muted">{t('channelManage.commentHidden')}</span>
                                    )}
                                    {comment.pinned && (
                                        <span className="mr-2 text-xs text-gold">{t('channelManage.commentPinned')}</span>
                                    )}
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => apply(comment, { pinned: !comment.pinned })}
                                        title={comment.pinned ? t('channelManage.unpin') : t('channelManage.pin')}
                                        aria-label={comment.pinned ? t('channelManage.unpin') : t('channelManage.pin')}
                                        className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover hover:text-primary transition-colors"
                                    >
                                        {comment.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                                    </button>
                                    <button
                                        onClick={() => apply(comment, { hidden: !comment.hidden })}
                                        title={comment.hidden ? t('channelManage.show') : t('channelManage.hide')}
                                        aria-label={comment.hidden ? t('channelManage.show') : t('channelManage.hide')}
                                        className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                                    >
                                        {comment.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </button>
                                </div>
                            </div>
                            <p className={`text-sm ${comment.hidden ? 'text-text-muted' : 'text-text-secondary'}`}>
                                {comment.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {hasNextPage && (
                <div className="text-center mt-6">
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                    >
                        {isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
                    </button>
                </div>
            )}
        </div>
    );
}
