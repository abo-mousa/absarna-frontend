import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastContext = createContext();

const DEFAULT_DURATION_MS = 3000;
// Kept in sync with the `duration-200` exit transition on each toast below — this is how
// long a toast stays mounted (fading out) after it's marked `leaving`, before actually
// being removed from the list.
const EXIT_TRANSITION_MS = 200;

const STYLES = {
    success: { wrapper: 'bg-emerald-600 text-white', Icon: CheckCircle },
    error: { wrapper: 'bg-red-600 text-white', Icon: XCircle },
};

let idCounter = 0;

function ToastItem({ toast, onDismiss }) {
    const { message, type, leaving } = toast;
    const { wrapper, Icon } = STYLES[type] || STYLES.success;

    return (
        <div
            role="status"
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-md shadow-lg
                text-sm font-semibold max-w-[calc(100vw-2rem)]
                transition-all duration-200 ${wrapper}
                ${leaving ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0 animate-toast-in'}`}
        >
            <Icon size={18} className="shrink-0" />
            <span>{message}</span>
            <button
                onClick={() => onDismiss(toast.id)}
                aria-label="إغلاق"
                className="shrink-0 opacity-80 hover:opacity-100"
            >
                <X size={16} />
            </button>
        </div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const startDismiss = useCallback((id) => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
        setTimeout(() => dismiss(id), EXIT_TRANSITION_MS);
    }, [dismiss]);

    const showToast = useCallback((message, type = 'success', duration = DEFAULT_DURATION_MS) => {
        const id = ++idCounter;
        setToasts((prev) => [...prev, { id, message, type, leaving: false }]);
        setTimeout(() => startDismiss(id), duration);
    }, [startDismiss]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-5 inset-x-0 z-[3000] flex flex-col items-center gap-2 pointer-events-none px-4">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={startDismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
