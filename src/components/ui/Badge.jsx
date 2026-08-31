const VARIANTS = {
    default: 'bg-primary-light text-primary',
    featured: 'bg-gold-light text-[#8B6914]',
    muted: 'bg-surface-hover text-text-secondary',
    success: 'bg-emerald-100 text-emerald-600',
    danger: 'bg-red-100 text-red-600',
};

function Badge({ children, variant = 'default' }) {
    return (
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${VARIANTS[variant]}`}>
            {children}
        </span>
    );
}

export default Badge;
