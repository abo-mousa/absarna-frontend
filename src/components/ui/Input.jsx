import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Native date/color inputs render their own browser chrome instead of respecting a custom
// `placeholder` (Chrome always shows its own "mm/dd/yyyy" segments regardless of what's set,
// and `:placeholder-shown` doesn't reliably match on them) — the floating-label trick below
// depends on both, so these two types keep the plain label-above-the-box layout instead.
const FLOATING_LABEL_UNSUPPORTED_TYPES = new Set(['date', 'color']);

function Input({
                   label,
                   value,
                   onChange,
                   onFocus,
                   onBlur,
                   placeholder,
                   type = 'text',
                   required,
                   disabled,
                   // Defaults to RTL since almost every field on this Arabic-first platform is —
                   // callers with genuinely Latin-script content (username, email, slug, password)
                   // already pass `dir="ltr"` explicitly.
                   dir = 'rtl',
                   textarea = false,
                   rows = 3,
                   className = '',
                   ...rest
               }) {
    const generatedId = useId();
    const id = rest.id || generatedId;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const floating = !textarea ? !FLOATING_LABEL_UNSUPPORTED_TYPES.has(type) : true;
    // A few call sites bake a literal " *" into the label text itself instead of relying on
    // `required` to render it — strip it so it isn't shown twice.
    const cleanLabel = typeof label === 'string' ? label.replace(/\s*\*\s*$/, '') : label;
    // Explicit rather than relying on inherited `direction` — form controls don't reliably
    // pick up text-align from an ancestor's `dir` in every browser, which was leaving Arabic
    // text left-aligned even with `dir="rtl"` set on the element itself. `dir="auto"` (used for
    // fields like username/password where the content's actual script isn't known ahead of
    // time, e.g. Arabic usernames) is left with no override — the browser already aligns those
    // per-character based on the Unicode bidi algorithm, and a fixed text-left/right here would
    // fight that instead of adapting to what's actually typed.
    const textAlignClass = dir === 'auto' ? '' : dir === 'rtl' ? 'text-right' : 'text-left';

    if (!floating) {
        const baseClass = `w-full px-3.5 py-2.5 rounded-md border border-border bg-surface text-[0.95rem]
            outline-none transition-colors focus:border-primary ${textAlignClass}
            disabled:bg-surface-hover disabled:cursor-not-allowed ${className}`;

        return (
            <div>
                {cleanLabel && (
                    <label htmlFor={id} className="block mb-1.5 font-semibold text-sm text-text-secondary">
                        {cleanLabel}
                        {required && <span className="text-red-600 dark:text-red-500"> *</span>}
                    </label>
                )}
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    dir={dir}
                    className={baseClass}
                    {...rest}
                />
            </div>
        );
    }

    // The floating label doubles as the empty-state placeholder — once it floats to the
    // border there's nothing left to show inside the box, so the DOM placeholder is always
    // just a single space (needed only so `:placeholder-shown` below has something to match).
    const domPlaceholder = ' ';

    // Physical (not logical `ps-*`/`pe-*`) on purpose: the label/icon *slots* always sit on the
    // same visual sides regardless of a field's own `dir` — right for the label (matching every
    // other right-anchored label on this RTL-first site), left for the password eye toggle. Only
    // the typed *value*'s own alignment (`textAlignClass`) follows the field's `dir`.
    // A single conditional `pl-*` (not a base `pl-3.5` plus a conditional override) — Tailwind's
    // generated stylesheet doesn't order utilities by their numeric value, so two `pl-*` classes
    // on the same element race on source order in the compiled CSS, not which one "looks like"
    // the override. `pl-3.5` was winning over `pl-10`/`pl-11` regardless of which value was tried.
    // Symmetric vertical padding — the floated label doesn't actually need reserved top room:
    // it already straddles the border independently via `top-0 -translate-y-1/2` below, which
    // works regardless of the input's own padding. Asymmetric padding here was only pushing the
    // typed text off-center relative to both the box and the (properly centered) eye icon.
    const fieldClass = `peer w-full pr-3.5 ${isPassword ? 'pl-11' : 'pl-3.5'} py-2.5 rounded-md border border-border bg-surface
        text-[0.95rem] outline-none transition-colors focus:border-primary resize-${textarea ? 'y' : 'none'}
        disabled:bg-surface-hover disabled:cursor-not-allowed ${textAlignClass} ${className}`;

    // Deliberately NOT `textAlignClass`/the field's `dir` here: a field's `dir="ltr"` describes
    // its *value* (a username, an email, a URL — Latin content the user types), not the label
    // annotating it, which is Arabic here regardless of the field's own value direction. Fixed
    // to the physical right (not logical `start-*`) so it never lands on the same side as the
    // password eye toggle below, which is fixed to the physical left.
    const labelClass = `absolute right-3 top-1/2 -translate-y-1/2 bg-surface px-1 text-text-muted
        text-[0.95rem] text-right transition-all duration-150 pointer-events-none
        peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary
        peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs
        peer-disabled:bg-surface-hover`;

    const floatingLabel = cleanLabel ? (
        <>
            {cleanLabel}
            {required && <span className="text-red-600 dark:text-red-500"> *</span>}
        </>
    ) : (
        placeholder
    );

    return (
        <div className="relative" dir={dir}>
            {textarea ? (
                <textarea
                    id={id}
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={domPlaceholder}
                    required={required}
                    disabled={disabled}
                    dir={dir}
                    rows={rows}
                    className={fieldClass}
                    {...rest}
                />
            ) : (
                <input
                    id={id}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={domPlaceholder}
                    required={required}
                    disabled={disabled}
                    dir={dir}
                    className={fieldClass}
                    {...rest}
                />
            )}

            <label htmlFor={id} dir="rtl" className={labelClass}>
                {floatingLabel}
            </label>

            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    className="absolute inset-y-0 left-2.5 flex items-center text-text-muted hover:text-text-secondary"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            )}
        </div>
    );
}

export default Input;
