import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageShell from '../components/layout/PageShell';
import { Input, Button } from '../components/ui';
import {
    getPasswordRules, getPasswordStrengthLabel, isPasswordValid, validateUsername,
    USERNAME_MAX_LENGTH, EMAIL_MAX_LENGTH, FULL_NAME_MAX_LENGTH,
} from '@/lib/validation';
import { safeInternalPath } from '@/lib/navigation';
import { t } from '@/i18n';

/**
 * The two values `com.absarna.authentication.model.Gender` has, in the order they are offered.
 *
 * <p>The raw enum names, not localised keys — this is the wire value, and the backend's binder
 * rejects anything else as a 400 before `@NotNull` is even reached. The Arabic beside each one is
 * looked up at render time so the catalog stays the only place a word is written.
 *
 * <p>There is no third "prefer not to say" option because the field is `@NotNull` on the server:
 * offering one would build a control whose most considerate answer cannot be submitted.
 */
const GENDERS = ['MALE', 'FEMALE'];

function Register() {
    usePageMeta({ title: t('auth.register.heading') });
    const navigate = useNavigate();
    const location = useLocation();
    const { register } = useAuth();
    const { showToast } = useToast();
    const [form, setForm] = useState({
        username: '', email: '', password: '', confirmPassword: '', fullName: '', gender: '',
        acceptedTerms: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const passwordRules = getPasswordRules(form.password);
    const passedCount = passwordRules.filter((rule) => rule.valid).length;
    const strengthInfo = getPasswordStrengthLabel(passwordRules);
    const usernameError = form.username ? validateUsername(form.username) : '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const usernameValidationError = validateUsername(form.username);
        if (usernameValidationError) {
            setError(usernameValidationError);
            return;
        }
        // Before the password rules, not after: this is the one field with no inline feedback as
        // you type (there is nothing to type), so it is also the one most likely to be the reason
        // a submit bounces. Checked here as well as by the radios' own `required` because the
        // native constraint only fires on a real form submission — and a signup that reaches the
        // API without it comes back as an English «Gender is required».
        if (!GENDERS.includes(form.gender)) {
            setError(t('validation.genderRequired'));
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError(t('auth.passwordMismatch'));
            return;
        }
        if (!isPasswordValid(form.password)) {
            setError(t('auth.passwordTooWeak'));
            return;
        }
        // Same reason the gender check is duplicated here: the input's own `required` only fires
        // on a native submit, and a signup that reaches the API without this comes back as an
        // English «The terms of use and privacy policy must be accepted». It is checked LAST so
        // that ticking the box is the final thing asked of someone whose other fields are already
        // right — an agreement collected before the form is valid is one the person re-confirms
        // by reflex after fixing a password.
        if (!form.acceptedTerms) {
            setError(t('validation.termsRequired'));
            return;
        }

        setLoading(true);
        const result = await register(form.username, form.email, form.password, form.fullName, form.gender, form.acceptedTerms);
        if (result.success) {
            showToast(t('auth.register.created'), 'success');
            // Back where they came from, the same way Login does it. Someone who followed a claim
            // offer on a channel page arrives here with two steps behind them and no reason to
            // remember the slug — dropping them on the home page loses the one thing that made
            // signing up worth finishing.
            navigate(safeInternalPath(location.state?.from) || '/');
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <PageShell>
            <div className="max-w-[400px] mx-auto my-10 sm:my-16 p-6 sm:p-8 bg-surface rounded-lg shadow-md border border-border-light">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold">{t('auth.register.heading')}</h2>
                    <p className="text-text-muted mt-2">{t('auth.register.joinUs')}</p>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div>
                        <Input
                            label={t('fields.usernameRequired')}
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                            maxLength={USERNAME_MAX_LENGTH}
                            placeholder="username"
                            dir="ltr"
                            className={usernameError ? '!border-red-600 dark:!border-red-500' : ''}
                        />
                        {usernameError && (
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1">{usernameError}</p>
                        )}
                    </div>

                    <Input
                        label={t('fields.fullName')}
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        maxLength={FULL_NAME_MAX_LENGTH}
                        placeholder={t('fields.fullNamePlaceholder')}
                    />

                    {/*
                      * A two-option segmented control, not a <select>: with exactly two answers a
                      * dropdown costs a tap to open, a scroll on a phone, and renders as the
                      * platform's own picker sheet — while both choices fit on one line here and
                      * are visible without interacting at all.
                      *
                      * Real radio inputs underneath (sr-only, styled through `peer-checked`)
                      * rather than buttons with aria-pressed: that gives arrow-key navigation
                      * within the group, a single tab stop, the `required` constraint, and the
                      * announcement a screen reader expects, for free. `grid-cols-2` follows the
                      * page's direction on its own, so the first option sits where the reading
                      * starts in either build with no logical-property juggling, and each label is
                      * a full grid cell so the tap target is the whole box rather than the word.
                      */}
                    <fieldset>
                        <legend className="block mb-1.5 font-semibold text-sm text-text-secondary">
                            {t('fields.gender')}
                            <span className="text-red-600 dark:text-red-500"> *</span>
                        </legend>
                        <div className="grid grid-cols-2 gap-2">
                            {GENDERS.map((value) => (
                                <label key={value} className="block cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value={value}
                                        checked={form.gender === value}
                                        onChange={() => setForm({ ...form, gender: value })}
                                        required
                                        className="peer sr-only"
                                    />
                                    {/* The styled box is the input's SIBLING, not its parent, so
                                        `peer-checked` can reach it. Doing it the other way round
                                        needs `:has()`, which Firefox only shipped in 121. */}
                                    <span className="flex min-h-[44px] items-center justify-center rounded-md border border-border bg-surface px-3 py-2.5 text-[0.95rem] transition-colors hover:bg-surface-hover peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:font-semibold peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1">
                                        {value === 'MALE' ? t('fields.genderMale') : t('fields.genderFemale')}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    {/* Required, here and in RegisterRequest. An account with no address can
                        never verify, so it can never comment, like, subscribe or open a channel —
                        and cannot recover a forgotten password either. */}
                    <Input
                        label={t('fields.emailRequired')}
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        maxLength={EMAIL_MAX_LENGTH}
                        placeholder="email@example.com"
                        dir="ltr"
                    />

                    <div>
                        <Input
                            label={t('fields.passwordRequired')}
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            placeholder="••••••••"
                            dir="ltr"
                        />

                        {form.password && (
                            <div className="mt-2">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className="flex-1 h-1.5 rounded-full"
                                            style={{
                                                background: passedCount >= level ? strengthInfo.color : '#E5E7EB',
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs" style={{ color: strengthInfo.color }}>
                                    {strengthInfo.text}
                                </span>
                                <ul className="mt-1.5 grid grid-cols-1 xs:grid-cols-2 gap-x-3 gap-y-0.5">
                                    {passwordRules.map((rule) => (
                                        <li
                                            key={rule.key}
                                            className={`text-xs ${rule.valid ? 'text-primary' : 'text-text-muted'}`}
                                        >
                                            {rule.valid ? '✓' : '○'} {rule.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div>
                        <Input
                            label={t('fields.confirmPassword')}
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            required
                            placeholder="••••••••"
                            dir="ltr"
                            className={form.confirmPassword && form.confirmPassword !== form.password ? '!border-red-600 dark:!border-red-500' : ''}
                        />
                        {form.confirmPassword && form.confirmPassword !== form.password && (
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1">{t('auth.passwordMismatch')}</p>
                        )}
                    </div>

                    {/*
                      * The agreement, and the only place on the platform it is actually asked for.
                      *
                      * <p>Unticked by default and it cannot be otherwise: a pre-ticked box is not
                      * consent in any jurisdiction that has looked at the question, and the whole
                      * point of `users.terms_accepted_at` is to be a record somebody can rely on.
                      *
                      * <p>Both documents open in a NEW TAB. A router navigation from here throws
                      * away every field already typed, so a reader who does the thing the sentence
                      * invites them to do is punished with an empty form — which is how you teach
                      * people not to read it. `rel="noopener noreferrer"` because `target="_blank"`
                      * otherwise hands the opened page a live `window.opener`.
                      *
                      * <p>The label wraps the input, so the text is part of the 44px tap target
                      * rather than a 16px square next to it; `items-start` keeps the box aligned to
                      * the first line when the sentence wraps on a narrow phone.
                      */}
                    <label className="flex items-start gap-2.5 cursor-pointer text-sm text-text-secondary leading-relaxed">
                        <input
                            type="checkbox"
                            checked={form.acceptedTerms}
                            onChange={(e) => setForm({ ...form, acceptedTerms: e.target.checked })}
                            required
                            className="mt-0.5 h-4 w-4 shrink-0 accent-primary cursor-pointer"
                        />
                        <span>
                            {t('auth.register.acceptPrefix')}{' '}
                            <Link
                                to="/terms"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary font-semibold hover:underline"
                            >
                                {t('auth.register.acceptTerms')}
                            </Link>{' '}
                            {t('auth.register.acceptConjunction')}
                            <Link
                                to="/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary font-semibold hover:underline"
                            >
                                {t('auth.register.acceptPrivacy')}
                            </Link>
                        </span>
                    </label>

                    {error && (
                        <p className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-950/40 p-2.5 rounded-md">{error}</p>
                    )}

                    {/* Disabled until the box is ticked, rather than submitting and refusing. The
                        agreement is the one field where a refusal after the fact reads as a bug —
                        everything else the form asks for is visibly empty or wrong, while an
                        unticked box looks like a step you chose to skip. The check in handleSubmit
                        stays: it is what catches a submit by Enter from a text field. */}
                    <Button type="submit" disabled={loading || !form.acceptedTerms} fullWidth>
                        {loading ? t('auth.register.submitting') : t('auth.register.submit')}
                    </Button>
                </form>

                <div className="text-center mt-5">
                    <p className="text-sm text-text-secondary">
                        {t('auth.register.haveAccount')}{' '}
                        <Link to="/login" className="text-primary font-semibold">{t('auth.register.loginLink')}</Link>
                    </p>
                </div>
            </div>
        </PageShell>
    );
}

export default Register;
