import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CornerUpLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { EmailVerificationNotice } from '../auth';
import { useComments, useCreateComment, useReplyComment } from '../../hooks/useComments';

function CommentsSection({ type, id }) {
    const { token, user } = useAuth();
    const { data: comments = [], isLoading } = useComments(type, id);
    const createComment = useCreateComment(type, id);
    const replyComment = useReplyComment(type, id);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);

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
                    alert('فشل في إرسال التعليق');
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
                    alert('فشل في إرسال الرد');
                }
            },
        });
    };

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('ar-EG', {
                year: 'numeric', month: 'long', day: 'numeric',
            });
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="mt-8">
            <h3 className="mb-4 text-lg font-bold">التعليقات ({comments.length})</h3>

            {token ? (
                <form onSubmit={handleSubmit} className="grid gap-3 mb-6 bg-surface p-5 rounded-lg border border-border-light">
                    <div className="text-sm text-text-muted">
                        التعليق باسم <strong className="text-primary">{user?.fullName || user?.username}</strong>
                    </div>
                    {needsVerification && (
                        <EmailVerificationNotice message="يجب توثيق بريدك الإلكتروني قبل إضافة تعليق" />
                    )}
                    <textarea
                        placeholder="اكتب تعليقك هنا..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        className="px-3.5 py-2.5 rounded-md border border-border resize-y outline-none focus:border-primary transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={createComment.isPending}
                        className="px-5 py-2.5 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                    >
                        {createComment.isPending ? 'جاري الإرسال...' : 'إرسال التعليق'}
                    </button>
                </form>
            ) : (
                <div className="mb-6 bg-surface p-5 rounded-lg border border-border-light text-center text-text-secondary">
                    <Link to="/login" className="text-primary font-semibold">سجّل الدخول</Link> لإضافة تعليق
                </div>
            )}

            {isLoading ? (
                <p className="text-text-muted">جاري التحميل...</p>
            ) : comments.length === 0 ? (
                <p className="text-text-muted text-center py-5">لا توجد تعليقات بعد — كن أول من يعلق!</p>
            ) : (
                <div className="grid gap-3">
                    {comments.map((comment) => (
                        <div key={comment.id} className="bg-surface p-4 rounded-md border border-border-light">
                            <div className="flex justify-between mb-2">
                                <strong className="text-primary">{comment.userName}</strong>
                                <span className="text-xs text-text-muted">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-text-secondary leading-relaxed">{comment.content}</p>

                            {token && (
                                <button
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="flex items-center gap-1 mt-2 text-primary font-semibold text-sm"
                                >
                                    <CornerUpLeft size={14} /> رد
                                </button>
                            )}

                            {replyingTo === comment.id && (
                                <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="grid gap-2 mt-3">
                                    <textarea
                                        placeholder="اكتب ردك..."
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        rows={2}
                                        className="px-3 py-2 rounded-md border border-border outline-none focus:border-primary transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary-light text-primary rounded-md font-semibold w-fit"
                                    >
                                        إرسال الرد
                                    </button>
                                </form>
                            )}

                            {comment.replies?.length > 0 && (
                                <div className="mt-3 pr-5 border-r-2 border-border-light">
                                    {comment.replies.map((reply) => (
                                        <div key={reply.id} className="mb-2 px-3 py-2 bg-surface-hover rounded-md">
                                            <strong className="text-sm text-primary">{reply.userName}</strong>
                                            <p className="text-sm text-text-secondary mt-1">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CommentsSection;
