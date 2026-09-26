import { useMemo } from 'react';
import { rejectedFieldsOf } from '@/lib/rejectedFields';
import { NO_REJECTED_FIELDS, RejectedFieldsContext } from './rejectedFieldsContext';

/**
 * Marks the fields the backend refused in the form inside it: every `Input` whose `field` is in
 * the last failed submit's `VALIDATION_FAILED` list turns red and says `aria-invalid`, beside the
 * toast that says something was refused. `error` is the submit's error as it came back (a
 * mutation's `error`, or a caught one kept in state); null clears the marks. A field stops being
 * marked the moment it is edited — the `token` (the error itself) is how an `Input` knows its edit
 * came after this refusal and not an earlier one.
 */
export function RejectedFields({ error, children }) {
    const value = useMemo(() => {
        const rejected = rejectedFieldsOf(error);
        return rejected.size ? { rejected, token: error } : NO_REJECTED_FIELDS;
    }, [error]);
    return <RejectedFieldsContext.Provider value={value}>{children}</RejectedFieldsContext.Provider>;
}

export default RejectedFields;
