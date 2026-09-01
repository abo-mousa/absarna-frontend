import Spinner from './Spinner';
import EmptyState from './EmptyState';

// Collapses the loading/error/empty/success four-branch ternary repeated across most
// pages that render a useQuery/useInfiniteQuery result into one component.
function QueryState({
                        isLoading,
                        isError,
                        isEmpty = false,
                        errorTitle = 'حدث خطأ',
                        errorDescription,
                        errorAction,
                        emptyIcon = '📭',
                        emptyTitle = 'لا توجد بيانات',
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
