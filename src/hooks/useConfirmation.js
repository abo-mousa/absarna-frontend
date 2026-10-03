import { useCallback, useRef, useState } from 'react';

/**
 * A yes/no question asked from code that wants an answer, in the platform's own dialog.
 *
 * <p>For the places that used `window.confirm` inside a handler or an async flow: the browser's
 * dialog ignores the page's direction and answers «OK / Cancel» in the phone's language under an
 * Arabic question. `ask(title)` resolves true on confirm and false on cancel or close; the caller
 * renders `<ConfirmDialog {...dialog} />` once.
 *
 * @returns {[(title: string, options?: {danger?: boolean, confirmLabel?: string}) => Promise<boolean>, object]}
 */
export function useConfirmation() {
    const resolver = useRef(null);
    const [question, setQuestion] = useState(null);

    const ask = useCallback((title, options = {}) => new Promise((resolve) => {
        // A second question while one is open answers the first "no" rather than leaving it hanging.
        resolver.current?.(false);
        resolver.current = resolve;
        setQuestion({ title, ...options });
    }), []);

    const settle = useCallback((answer) => {
        const resolve = resolver.current;
        resolver.current = null;
        setQuestion(null);
        resolve?.(answer);
    }, []);

    const dialog = {
        open: question !== null,
        title: question?.title ?? '',
        body: question?.body,
        cancelLabel: question?.cancelLabel,
        danger: question?.danger ?? false,
        confirmLabel: question?.confirmLabel,
        onConfirm: () => settle(true),
        onClose: () => settle(false),
    };
    return [ask, dialog];
}

export default useConfirmation;
