import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { KhatamStar } from '../ui/Khatam';
import PageGuideSheet from './PageGuideSheet';
import Spotlight from './Spotlight';
import { isRtl, t } from '@/i18n';

const OPENED_HERE = 'pageGuide';

/**
 * «دليل الصفحة»: the quiet button at the end of a page's header line that opens its guide. It is
 * the only way the guide opens — nothing here calls attention to itself.
 *
 * <p>The open sheet is `?guide=1`, so Back closes it and a link can open it (the full guide's
 * «افتح الصفحة»). Closing a sheet this button opened goes back one entry rather than replacing
 * it, or every look at the guide would leave a duplicate of the page in the history.
 */
function PageGuideButton({ id, className = '' }) {
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
            <button
                type="button"
                onClick={show}
                aria-label={t('guide.sheet.buttonAria')}
                aria-haspopup="dialog"
                aria-expanded={open}
                className={`group inline-flex items-center gap-2 h-9 ps-1.5 pe-1.5 sm:pe-3 rounded-full border border-border-light bg-surface text-sm font-semibold text-text-secondary
                    hover:text-text-primary hover:border-gold transition-colors ${className}`}
            >
                <span className="relative w-6 h-6 inline-flex items-center justify-center" aria-hidden="true">
                    <KhatamStar filled={false} strokeWidth={7} className="absolute inset-0 w-full h-full text-gold transition-transform duration-300 group-hover:rotate-45" />
                    <span className="relative text-[0.8rem] font-bold leading-none text-gold-ink">{isRtl() ? '؟' : '?'}</span>
                </span>
                <span className="hidden sm:inline">{t('guide.sheet.button')}</span>
            </button>
            <PageGuideSheet id={id} open={open} onClose={close} onShowMe={showMe} />
            {spot && <Spotlight anchor={spot.anchor} title={spot.title} onDone={endSpot} />}
        </>
    );
}

export default PageGuideButton;
