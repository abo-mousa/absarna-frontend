import { suggestEmail } from '@/lib/emailTypo';
import { t } from '@/i18n';

/**
 * «هل تقصد name@gmail.com؟» under an email field — a tap puts it in. Says nothing until the address
 * has an @ and a domain we can be fairly sure was mistyped (`lib/emailTypo`); never changes
 * anything by itself.
 */
function EmailTypoHint({ value, onAccept }) {
    const suggestion = suggestEmail(value);
    if (!suggestion) return null;
    return (
        <p className="-mt-2 text-sm text-amber-800 dark:text-amber-200" aria-live="polite">
            {t('auth.emailTypo.didYouMean')}
            <button type="button" onClick={() => onAccept(suggestion)} className="font-semibold underline">
                <bdi dir="ltr">{suggestion}</bdi>
            </button>
            {t('auth.emailTypo.questionMark')}
        </p>
    );
}

export default EmailTypoHint;
