function EmptyState({
                        icon = '📭',
                        title = 'لا يوجد محتوى',
                        description = '',
                        action,
                    }) {
    return (
        <div className="text-center py-16 px-5 text-text-secondary">
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="mb-2 text-text-primary">{title}</h3>
            {description && <p className="mb-4">{description}</p>}
            {action}
        </div>
    );
}

export default EmptyState;
