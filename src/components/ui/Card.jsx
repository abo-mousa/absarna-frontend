function Card({ children, onClick, padding = 'p-6', hover = true, className = '' }) {
    return (
        <div
            onClick={onClick}
            className={`bg-surface rounded-lg border border-border-light shadow-sm transition-all
                ${padding}
                ${onClick ? 'cursor-pointer' : ''}
                ${hover ? 'hover:shadow-md hover:-translate-y-0.5' : ''}
                ${className}`}
        >
            {children}
        </div>
    );
}

export default Card;
