const SIZES = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-2xl',
};

function Avatar({ src, name = '', size = 'md', color, className = '' }) {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={`${SIZES[size]} rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <div
            className={`${SIZES[size]} rounded-full text-white flex items-center justify-center font-semibold flex-shrink-0 ${color ? '' : 'bg-primary'} ${className}`}
            style={color ? { background: color } : undefined}
        >
            {name?.trim()?.[0]?.toUpperCase() || '?'}
        </div>
    );
}

export default Avatar;
