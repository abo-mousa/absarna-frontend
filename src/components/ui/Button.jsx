const VARIANTS = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-primary-light text-primary hover:bg-primary/20',
    outline: 'bg-transparent text-text-secondary border border-border hover:bg-surface-hover',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-text-secondary hover:bg-surface-hover',
};

const SIZES = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-[0.95rem]',
    lg: 'px-7 py-3.5 text-lg',
};

function Button({
                    variant = 'primary',
                    size = 'md',
                    children,
                    onClick,
                    disabled,
                    fullWidth,
                    icon,
                    type = 'button',
                    className = '',
                }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors
                ${VARIANTS[variant]} ${SIZES[size]}
                ${fullWidth ? 'w-full' : ''}
                ${disabled ? 'opacity-50 pointer-events-none' : ''}
                ${className}`}
        >
            {icon && <span>{icon}</span>}
            {children}
        </button>
    );
}

export default Button;
