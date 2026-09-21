import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { direction, isRtl, t } from '@/i18n';

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
                   // Defaults to the INTERFACE's direction, which on the Arabic build is the RTL
                   // almost every field on it wants. Callers with genuinely Latin-script content
                   // (username, email, slug, password) already pass `dir="ltr"` explicitly and are
                   // unaffected by which build they are rendered in.
                   dir = direction(),
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
    // `text-start`, not a physical side chosen from `dir`: the class sits on the field itself, so
    // the logical property resolves against the field's own `dir` — which is exactly the question
    // being asked. One class now answers both interface directions where the ternary answered one.
    const textAlignClass = dir === 'auto' ? '' : 'text-start';

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

    // THE SLOTS FOLLOW THE INTERFACE, THE VALUE FOLLOWS THE FIELD. The floating label and the
    // password eye are interface furniture: they sit on the same visual sides as every other label
    // and control on the page, whatever script the field's *value* is in. They are children of the
    // wrapper, which deliberately carries no `dir`, so plain `start-*`/`end-*` on them resolve
    // against the page and need nothing computed here.
    //
    // The field's own padding cannot do that, because the padding is ON the field and the field
    // states its own `dir` — a logical `ps-*` there would reserve the room on whichever side the
    // VALUE starts, which is precisely the side the eye is not on. So these two stay physical and
    // are picked from the INTERFACE direction, written out in full because Tailwind scans for
    // literal class names.
    // A single conditional `pl-*` (not a base `pl-3.5` plus a conditional override) — Tailwind's
    // generated stylesheet doesn't order utilities by their numeric value, so two `pl-*` classes
    // on the same element race on source order in the compiled CSS, not which one "looks like"
    // the override. `pl-3.5` was winning over `pl-10`/`pl-11` regardless of which value was tried.
    // Symmetric vertical padding — the floated label doesn't actually need reserved top room:
    // it already straddles the border independently via `top-0 -translate-y-1/2` below, which
    // works regardless of the input's own padding. Asymmetric padding here was only pushing the
    // typed text off-center relative to both the box and the (properly centered) eye icon.
    const rtlInterface = isRtl();
    const labelSidePad = rtlInterface ? 'pr-3.5' : 'pl-3.5';
    const eyeSidePad = isPassword
        ? (rtlInterface ? 'pl-11' : 'pr-11')
        : (rtlInterface ? 'pl-3.5' : 'pr-3.5');

    const fieldClass = `peer w-full ${labelSidePad} ${eyeSidePad} py-2.5 rounded-md border border-border bg-surface
        text-[0.95rem] outline-none transition-colors focus:border-primary resize-${textarea ? 'y' : 'none'}
        disabled:bg-surface-hover disabled:cursor-not-allowed ${textAlignClass} ${className}`;

    // Deliberately NOT `textAlignClass`/the field's `dir` here: a field's `dir="ltr"` describes
    // its *value* (a username, an email, a URL — Latin content the user types), not the label
    // annotating it, which is in the interface's language regardless of the field's own value
    // direction. `start-*` and the element carries no `dir`, so it resolves against the page —
    // the interface's start, which is the one side the eye toggle (pinned to the interface's end)
    // can never collide with.
    const labelClass = `absolute start-3 top-1/2 -translate-y-1/2 bg-surface px-1 text-text-muted
        text-[0.95rem] text-start transition-all duration-150 pointer-events-none
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
        // No `dir` on the wrapper: it would hand the field's VALUE direction to the label and the
        // eye toggle, which are interface furniture and belong to the page's. The field elements
        // below state their own.
        <div className="relative">
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

            <label htmlFor={id} className={labelClass}>
                {floatingLabel}
            </label>

            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? t('fields.hidePassword') : t('fields.showPassword')}
                    className="absolute inset-y-0 end-2.5 flex items-center text-text-muted hover:text-text-secondary"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            )}
        </div>
    );
}

export default Input;
