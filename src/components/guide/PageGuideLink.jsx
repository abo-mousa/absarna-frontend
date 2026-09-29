import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { KhatamStar } from '../ui/Khatam';
import PageGuideSheet from './PageGuideSheet';
import Spotlight from './Spotlight';
import { isRtl, t } from '@/i18n';

const OPENED_HERE = 'pageGuide';

/**
 * «كيف تعمل هذه الصفحة؟»: a quiet line at the END of a page that opens its guide (`PageShell`'s
 * `guide`). It sat in the header once, as a button on every visit's first line — there for the
 * reader who needs it, and in the way of everyone who already knows the page. At the end it is
 * found by someone looking for it and passed over by someone who is not. The account menu's
 * «الدليل» is the other way in, to every page's guide at once.
 *
 * <p>The open sheet is `?guide=1`, so Back closes it and a link can open it (the full guide's
 * «افتح الصفحة»). Closing a sheet this button opened goes back one entry rather than replacing
 * it, or every look at the guide would leave a duplicate of the page in the history.
 */
function PageGuideLink({ id }) {
    const [params, setParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [spot, setSpot] = useState(null);
    const open = params.get('guide') === '1';

    const show = () => {
        const next = new URLSearchParams(params);
        next.set('guide', '1');
        setParams(next, { state: { [OPENED_HERE]: true }, preventScrollReset: true });
    };
    const close = useCallback(() => {
        if (location.state?.[OPENED_HERE]) {
            navigate(-1);
            return;
        }
        const next = new URLSearchParams(params);
        next.delete('guide');
        setParams(next, { replace: true, preventScrollReset: true });
    }, [location.state, navigate, params, setParams]);
    const showMe = useCallback((target) => {
        close();
        // After the sheet has slid away, so the frame lands on the page and not under the panel.
        setTimeout(() => setSpot(target), 280);
    }, [close]);
    const endSpot = useCallback(() => setSpot(null), []);

    return (
        <>
            <div className="mt-12 flex justify-center">
                <button
                    type="button"
                    onClick={show}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    className="group inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                    <span className="relative w-5 h-5 inline-flex items-center justify-center" aria-hidden="true">
                        <KhatamStar filled={false} strokeWidth={7} className="absolute inset-0 w-full h-full text-gold/80 transition-transform duration-300 group-hover:rotate-45" />
                        <span className="relative text-[0.7rem] font-bold leading-none text-gold-ink">{isRtl() ? '؟' : '?'}</span>
                    </span>
                    {t('guide.sheet.pageLink')}
                </button>
            </div>
            <PageGuideSheet id={id} open={open} onClose={close} onShowMe={showMe} />
            {spot && <Spotlight anchor={spot.anchor} title={spot.title} onDone={endSpot} />}
        </>
    );
}

export default PageGuideLink;
