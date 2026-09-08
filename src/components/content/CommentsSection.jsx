import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CornerUpLeft, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { EmailVerificationNotice } from '../auth';
import { Modal } from '../ui';
import dayjs from '@/lib/dayjsAr';
import {
    useComments,
    useCreateComment,
    useReplyComment,
    useUpdateComment,
    useDeleteComment,
} from '../../hooks/useComments';
import { t } from '@/i18n';

const MAX_COMMENT_LENGTH = 2000;

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = dayjs(dateStr).locale('ar-latn');
    if (!date.isValid()) return '';
    // Relative for anything recent (matches the app's non-addictive-but-still-friendly tone),
    // an absolute date+time once it's old enough that "منذ 12 يوماً" stops being useful.
    if (dayjs().diff(date, 'day') < 7) return date.fromNow();
    return date.format(t('comments.absoluteDateFormat'));
}

function countComments(comments) {
    return comments.reduce((total, c) => total + 1 + (c.replies?.length || 0), 0);
}

function CommentsSection({ type, id }) {
    const { token, user } = useAuth();
    const { showToast } = useToast();
    const { data: comments = [], isLoading } = useComments(type, id);
    const createComment = useCreateComment(type, id);
    const replyComment = useReplyComment(type, id);
    const updateComment = useUpdateComment(type, id);
    const deleteComment = useDeleteComment(type, id);

    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setNeedsVerification(false);
        createComment.mutate(newComment.trim(), {
            onSuccess: () => setNewComment(''),
            onError: (err) => {
                if (err.response?.data?.emailVerificationRequired) {
                    setNeedsVerification(true);
                } else {
                    showToast(t('comments.createFailed'), 'error');
                }
            },
        });
    };

    const handleReplySubmit = (e, parentId) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setNeedsVerification(false);
        replyComment.mutate({ parentId, content: replyContent.trim() }, {
            onSuccess: () => {
                setReplyContent('');
                setReplyingTo(null);
            },
            onError: (err) => {
                if (err.response?.data?.emailVerificationRequired) {
                    setNeedsVerification(true);
                } else {
                    showToast(t('comments.replyFailed'), 'error');
                }
            },
        });
    };

    const startEdit = (comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    const handleEditSubmit = (e, commentId) => {
        e.preventDefault();
        if (!editContent.trim()) return;
        updateComment.mutate({ commentId, content: editContent.trim() }, {
            onSuccess: () => setEditingId(null),
            onError: () => showToast(t('comments.editFailed'), 'error'),
        });
    };

    const confirmDelete = () => {
        const commentId = deletingId;
        setDeletingId(null);
        deleteComment.mutate(commentId, {
            onError: () => showToast(t('comments.deleteFailed'), 'error'),
        });
    };

    const renderOwnerActions = (comment) => {
        if (!user || comment.userId !== user.id) return null;
        return (
            <div className="flex gap-1">
                <button
                    onClick={() => startEdit(comment)}
                    title={t('common.edit')}
                    aria-label={t('comments.editAria')}
                    className="p-1 text-text-muted hover:text-primary transition-colors"
                >
                    <Pencil size={14} />
                </button>
                <button
                    onClick={() => setDeletingId(comment.id)}
                    title={t('common.delete')}
                    aria-label={t('comments.deleteAria')}
                    className="p-1 text-text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        );
    };

    const renderEditForm = (comment) => (
        <form onSubmit={(e) => handleEditSubmit(e, comment.id)} className="grid gap-2 mt-2">
            <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                rows={2}
                autoFocus
                className="px-3 py-2 rounded-md border border-border outline-none focus:border-primary transition-colors"
            />
            <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{editContent.length}/{MAX_COMMENT_LENGTH}</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-text-secondary text-sm font-semibold"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={updateComment.isPending}
                        className="px-4 py-1.5 bg-primary text-white rounded-md font-semibold text-sm disabled:opacity-60"
                    >
                        {t('common.save')}
                    </button>
                </div>
            </div>
        </form>
    );

    return (
        <div className="mt-8">
            <h3 className="mb-4 text-lg font-bold">{t('comments.heading', { count: countComments(comments) })}</h3>

            {token ? (
                <form onSubmit={handleSubmit} className="grid gap-3 mb-6 bg-surface p-5 rounded-lg border border-border-light">
                    <div className="text-sm text-text-muted">
                        {t('comments.commentingAs')} <strong className="text-primary">{user?.fullName || user?.username}</strong>
                    </div>
                    {needsVerification && (
                        <EmailVerificationNotice message={t('auth.verificationNotice.beforeComment')} />
                    )}
                    <textarea
                        placeholder={t('comments.placeholder')}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        maxLength={MAX_COMMENT_LENGTH}
                        rows={3}
                        className="px-3.5 py-2.5 rounded-md border border-border resize-y outline-none focus:border-primary transition-colors"
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">{newComment.length}/{MAX_COMMENT_LENGTH}</span>
                        <button
                            type="submit"
                            disabled={createComment.isPending}
                            className="px-5 py-2.5 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                        >
                            {createComment.isPending ? t('common.sending') : t('comments.submit')}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="mb-6 bg-surface p-5 rounded-lg border border-border-light text-center text-text-secondary">
                    <Link to="/login" className="text-primary font-semibold">{t('comments.loginPrompt')}</Link> {t('comments.loginPromptSuffix')}
                </div>
            )}

            {isLoading ? (
                <p className="text-text-muted">{t('common.loading')}</p>
            ) : comments.length === 0 ? (
                <p className="text-text-muted text-center py-5">{t('comments.empty')}</p>
            ) : (
                <div className="grid gap-3">
                    {comments.map((comment) => (
                        <div key={comment.id} className="bg-surface p-4 rounded-md border border-border-light">
                            <div className="flex justify-between mb-2">
                                <strong className="text-primary">{comment.userName}</strong>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-text-muted">{formatDate(comment.createdAt)}</span>
                                    {renderOwnerActions(comment)}
                                </div>
                            </div>

                            {editingId === comment.id ? (
                                renderEditForm(comment)
                            ) : (
                                <p className="text-text-secondary leading-relaxed">{comment.content}</p>
                            )}

                            {token && editingId !== comment.id && (
                                <button
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="flex items-center gap-1 mt-2 text-primary font-semibold text-sm"
                                >
                                    <CornerUpLeft size={14} /> {t('comments.reply')}
                                </button>
                            )}

                            {replyingTo === comment.id && (
                                <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="grid gap-2 mt-3">
                                    <textarea
                                        placeholder={t('comments.replyPlaceholder')}
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        maxLength={MAX_COMMENT_LENGTH}
                                        rows={2}
                                        className="px-3 py-2 rounded-md border border-border outline-none focus:border-primary transition-colors"
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-text-muted">{replyContent.length}/{MAX_COMMENT_LENGTH}</span>
                                        <button
                                            type="submit"
                                            disabled={replyComment.isPending}
                                            className="px-4 py-2 bg-primary-light text-primary rounded-md font-semibold w-fit disabled:opacity-60"
                                        >
                                            {replyComment.isPending ? t('common.sending') : t('comments.submitReply')}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {comment.replies?.length > 0 && (
                                <div className="mt-3 pr-5 border-r-2 border-border-light">
                                    {comment.replies.map((reply) => (
                                        <div key={reply.id} className="mb-2 px-3 py-2 bg-surface-hover rounded-md">
                                            <div className="flex justify-between">
                                                <strong className="text-sm text-primary">{reply.userName}</strong>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-text-muted">{formatDate(reply.createdAt)}</span>
                                                    {renderOwnerActions(reply)}
                                                </div>
                                            </div>
                                            {editingId === reply.id ? (
                                                renderEditForm(reply)
                                            ) : (
                                                <p className="text-sm text-text-secondary mt-1">{reply.content}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal open={!!deletingId} onClose={() => setDeletingId(null)} title={t('comments.deleteTitle')} maxWidth="400px">
                <p className="text-text-secondary mb-5">{t('comments.deleteConfirm')}</p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => setDeletingId(null)}
                        className="px-4 py-2 text-text-secondary font-semibold"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={confirmDelete}
                        disabled={deleteComment.isPending}
                        className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold disabled:opacity-60"
                    >
                        {t('common.delete')}
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default CommentsSection;
