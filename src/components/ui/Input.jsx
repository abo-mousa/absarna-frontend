function Input({
                   label,
                   value,
                   onChange,
                   placeholder,
                   type = 'text',
                   required,
                   disabled,
                   dir,
                   textarea = false,
                   rows = 3,
                   className = '',
                   ...rest
               }) {
    const baseClass = `w-full px-3.5 py-2.5 rounded-md border border-border bg-surface text-[0.95rem]
        outline-none transition-colors focus:border-primary resize-${textarea ? 'y' : 'none'}
        disabled:bg-surface-hover disabled:cursor-not-allowed ${className}`;

    return (
        <div>
            {label && (
                <label className="block mb-1.5 font-semibold text-sm text-text-secondary">
                    {label}
                    {required && <span className="text-red-600"> *</span>}
                </label>
            )}

            {textarea ? (
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    dir={dir}
                    rows={rows}
                    className={baseClass}
                    {...rest}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    dir={dir}
                    className={baseClass}
                    {...rest}
                />
            )}
        </div>
    );
}

export default Input;
