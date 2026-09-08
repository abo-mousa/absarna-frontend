import Spinner from './Spinner';
import EmptyState from './EmptyState';
import { describeError } from '@/lib/describeError';
import { t } from '@/i18n';

/**
 * Collapses the loading/error/empty/success four-branch ternary repeated across most pages that
 * render a useQuery/useInfiniteQuery result.
 *
 * <p>Two things changed on 2026-09-08, both about the error branch, which every caller reached
 * with a fixed title and nothing else:
 *
 * <ul>
 *   <li><b>`error`</b> — the axios error itself. `describeError` turns it into a sentence that
 *       distinguishes being offline, being rate-limited (in the backend's own Arabic wording,
 *       which the CORS ordering exists to make readable), a 404 and a server fault. Before this
 *       all four rendered as «حدث خطأ» with no hint what to do next, which is the difference
 *       between "check your connection", "wait a minute" and "this is gone".</li>
 *   <li><b>`onRetry`</b> — a default action, because the commonest cause of an error here is
 *       transient and the page offered no way to try again short of a full reload, which on a
 *       paginated list also discards every page already loaded. Pass the query's own `refetch`.
 *       An explicit `errorAction` still wins where a caller has something better to offer.</li>
 * </ul>
 */
function QueryState({
                        isLoading,
                        isError,
                        error,
                        onRetry,
                        isEmpty = false,
                        errorTitle = t('common.errorTitle'),
                        errorDescription,
                        errorAction,
                        emptyIcon = '📭',
                        emptyTitle = t('common.noData'),
                        emptyDescription,
                        emptyAction,
                        children,
                    }) {
    if (isLoading) return <Spinner />;
    if (isError) {
        // `errorTitle` is the caller's own wording for *this list* failing ("تعذر تحميل
        // الفيديوهات") and stays the title. The described error goes underneath, saying which
        // kind of failure it was — the two answer different questions.
        const description = errorDescription ?? (error ? describeError(error) : undefined);
        const action = errorAction ?? (onRetry ? (
            <button
                type="button"
                onClick={() => onRetry()}
                className="px-5 py-2 bg-primary text-white rounded-md font-semibold text-sm"
            >
                {t('common.retry')}
            </button>
        ) : undefined);
        return <EmptyState icon="⚠️" title={errorTitle} description={description} action={action} />;
    }
    if (isEmpty) {
        return (
            <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
        );
    }
    return children;
}

export default QueryState;
