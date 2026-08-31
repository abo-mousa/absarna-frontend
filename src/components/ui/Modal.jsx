import { X } from 'lucide-react';

function Modal({ open, onClose, title, children, maxWidth = '800px' }) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-surface rounded-xl w-full max-h-[90vh] overflow-auto shadow-lg"
                style={{ maxWidth }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-border-light">
                    <h3 className="m-0">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-text-primary transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

export default Modal;
