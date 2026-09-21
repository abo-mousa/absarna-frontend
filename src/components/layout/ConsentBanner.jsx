import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { useConsent } from '@/contexts/ConsentContext';
import { t } from '@/i18n';

/**
 * Asks whether Google may be sent data about this reader, before anything is.
 *
 * <h4>The two buttons are the same size, and that is the requirement</h4>
 *
 * <p>Consent has to be freely given, which regulators have read concretely: refusing must be as
 * easy as accepting. A banner with a solid «أوافق» and a grey text link «رفض» is the single most
 * commonly fined pattern in Europe, and it fails for a reason that survives translation — if one
 * answer takes a click and the other takes finding something, the answer was not free. So both are
 * real buttons, side by side, in the same row.
 *
 * <p>There is no «إغلاق» and no ×. Dismissing is not an answer, and a banner that can be made to
 * go away without deciding is a banner that trains people to make it go away.
 *
 * <h4>It does not block the page</h4>
 *
 * <p>A bar at the bottom, not a modal over the middle. Nothing behind it is loading from Google
 * while the question is open — that is the whole arrangement — so there is nothing to protect the
 * reader from by trapping them. A wall would also make the refusal less free, since the fastest
 * way past a wall is to agree with it.
 *
 * <p>Rendered only while the question is open, and the footer's «إعدادات الخصوصية» link is what
 * reopens it. Withdrawal has to be as easy as consent was, and a link on every page is that.
 */
function ConsentBanner() {
    const { asking, grant, deny } = useConsent();

    if (!asking) return null;

    return (
        <div
            // `role="region"` and a label rather than `role="dialog"`: it is not modal, nothing is
            // trapped, and announcing a dialog that does not behave like one is worse for a screen
            // reader than announcing nothing.
            role="region"
            aria-label={t('consent.label')}
            className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-surface/95 backdrop-blur
                       shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
        >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 grid gap-3 sm:flex sm:items-center sm:gap-6">
                <div className="grid gap-1 flex-1">
                    <strong className="text-sm">{t('consent.title')}</strong>
                    <p className="text-sm text-text-secondary leading-loose" dir="auto">
                        {t('consent.body')}{' '}
                        {/* Named in the sentence rather than left as "our partners", which is the
                            wording the policy exists to prevent: consent is only informed if the
                            recipient is identified. */}
                        <Link to="/privacy#youtube" className="text-primary hover:underline">
                            {t('consent.more')}
                        </Link>
                    </p>
                </div>

                {/* Same variant, same size, same row — see the header. The refusal is FIRST in the
                    DOM so keyboard and screen-reader users reach it first, which costs a sighted
                    reader nothing and is the ordering that cannot be accused of steering. */}
                <div className="flex gap-2 sm:flex-shrink-0">
                    <Button variant="outline" onClick={deny} className="flex-1 sm:flex-none">
                        {t('consent.deny')}
                    </Button>
                    <Button variant="outline" onClick={grant} className="flex-1 sm:flex-none">
                        {t('consent.grant')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ConsentBanner;
