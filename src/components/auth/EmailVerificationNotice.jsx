import { useState } from 'react';
import { resendVerification } from '@/lib/api/auth';

// Shown wherever the backend rejects an action with 403 + emailVerificationRequired:true
// (currently: posting a comment, creating a channel) — see backend CLAUDE.md's
// "Content visibility"/security notes and content/comment + content/channel controllers.
function EmailVerificationNotice({ message }) {
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error

    const handleResend = async () => {
        setStatus('sending');
        try {
            await resendVerification();
            setStatus('sent');
        } catch (err) {
            setStatus('error');
        }
    };

    return (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 text-sm p-3 rounded-md flex flex-wrap items-center justify-between gap-2">
            <span>{message || 'يجب توثيق بريدك الإلكتروني للقيام بهذا الإجراء'}</span>

            {status === 'sent' ? (
                <span className="text-primary font-semibold">تم إرسال رابط التوثيق، تحقق من بريدك</span>
            ) : (
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={status === 'sending'}
                    className="text-primary font-semibold underline disabled:opacity-60"
                >
                    {status === 'sending' ? 'جاري الإرسال...' : 'إعادة إرسال رابط التوثيق'}
                </button>
            )}

            {status === 'error' && (
                <span className="text-red-600 text-xs w-full">تعذر إرسال الرابط، حاول لاحقاً</span>
            )}
        </div>
    );
}

export default EmailVerificationNotice;
