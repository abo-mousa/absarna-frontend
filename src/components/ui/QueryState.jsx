import Spinner from './Spinner';
import EmptyState from './EmptyState';
import { t } from '@/i18n';

// Collapses the loading/error/empty/success four-branch ternary repeated across most
// pages that render a useQuery/useInfiniteQuery result into one component.
function QueryState({
                        isLoading,
                        isError,
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
        return <EmptyState icon="⚠️" title={errorTitle} description={errorDescription} action={errorAction} />;
    }
    if (isEmpty) {
        return (
            <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
        );
    }
    return children;
}

export default QueryState;
