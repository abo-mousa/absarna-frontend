import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const baseClass = `w-full px-3.5 py-2.5 rounded-md border border-border bg-surface text-[0.95rem]
        outline-none transition-colors focus:border-primary resize-${textarea ? 'y' : 'none'}
        disabled:bg-surface-hover disabled:cursor-not-allowed ${isPassword ? 'pr-10' : ''} ${className}`;

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
            ) : isPassword ? (
                <div className="relative">
                    <input
                        type={inputType}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled}
                        dir={dir}
                        className={baseClass}
                        {...rest}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        className="absolute inset-y-0 right-2.5 flex items-center text-text-muted hover:text-text-secondary"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
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
