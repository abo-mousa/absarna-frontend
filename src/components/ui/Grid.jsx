// minWidth/gap stay inline styles on purpose: they're runtime-variable values
// (per-usage card sizing), and Tailwind's JIT scanner can't see class names
// built from interpolated props at runtime.
function Grid({ children, minWidth = '280px', gap = '24px', className = '' }) {
    return (
        <div
            className={className}
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}, 1fr))`,
                gap,
            }}
        >
            {children}
        </div>
    );
}

export default Grid;
