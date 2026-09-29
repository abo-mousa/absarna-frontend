import { createContext, useContext } from 'react';

export const NO_REJECTED_FIELDS = { rejected: new Set(), messages: new Map(), token: null };

/**
 * What `RejectedFields` hands its `Input`s: the refused field names, the sentence for each, and
 * the error they came from.
 */
export const RejectedFieldsContext = createContext(NO_REJECTED_FIELDS);

export function useRejectedFields() {
    return useContext(RejectedFieldsContext);
}
