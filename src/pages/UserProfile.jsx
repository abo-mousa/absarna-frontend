import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '@/lib/api/client';
import { changePassword } from '@/lib/api/auth';
import PageShell from '../components/layout/PageShell';
import { Input, Button } from '../components/ui';
import { getPasswordRules, getPasswordStrengthLabel, isPasswordValid } from '@/lib/validation';
import { describeError } from '@/lib/describeError';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';
import { EMAIL_MAX_LENGTH, FULL_NAME_MAX_LENGTH, BIO_MAX_LENGTH } from '@/lib/validation';

function ChangePasswordCard() {
    const { showToast } = useToast();
    const { applySession } = useAuth();
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [saving, setSaving] = useState(false);

    const passwordRules = getPasswordRules(form.newPassword);
    const passedCount = passwordRules.filter((rule) => rule.valid).length;
    const strengthInfo = getPasswordStrengthLabel(passwordRules);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.newPassword !== form.confirmPassword) {
            showToast(t('auth.passwordMismatch'), 'error');
            return;
        }
        if (!isPasswordValid(form.newPassword)) {
            showToast(t('auth.passwordTooWeak'), 'error');
            return;
        }

        setSaving(true);
        try {
            // The backend bumps User.tokenVersion, which invalidates every JWT issued before
            // the change — the pair this session is holding included. It hands back a
            // replacement pair for exactly that reason; without adopting it here, the next
            // request 401s, the refresh 401s, and client.js bounces the user to the login
            // screen moments after a successful password change.
            const res = await changePassword(form.currentPassword, form.newPassword);
            applySession(res.data);
            showToast(t('profile.passwordChanged'), 'success');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            showToast(describeError(err, t('profile.passwordChangeFailed')), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-surface p-6 sm:p-8 rounded-lg shadow-sm border border-border-light mt-6">
            <h2 className="text-lg font-bold mb-6">{t('profile.changePassword')}</h2>

            <form onSubmit={handleSubmit} className="grid gap-4">
                <Input
                    label={t('profile.currentPassword')}
                    type="password"
                    value={form.currentPassword}
                    onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                />

                <div>
                    <Input
                        label={t('profile.newPassword')}
                        type="password"
                        value={form.newPassword}
                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                        required
                        placeholder="••••••••"
                        dir="ltr"
                    />

                    {form.newPassword && (
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

                <Input
                    label={t('profile.confirmNewPassword')}
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className={form.confirmPassword && form.confirmPassword !== form.newPassword ? '!border-red-600 dark:!border-red-500' : ''}
                />

                <Button type="submit" disabled={saving} fullWidth>
                    {saving ? t('common.saving') : t('profile.changePassword')}
                </Button>
            </form>
        </div>
    );
}

function UserProfile() {
    usePageMeta({ title: t('profile.title') });
    const { user } = useAuth();
    const { showToast } = useToast();
    const [form, setForm] = useState({ fullName: '', bio: '', email: '', profilePictureUrl: '' });
    const [saving, setSaving] = useState(false);
    /**
     * The address currently stored on the account, and the only thing "did this edit change the
     * email" can be measured against.
     *
     * <p>Separate state rather than reading `user.email` directly, because `user` is not refetched
     * when this form saves: after a successful email change the context still holds the old
     * address, so a comparison against it would leave the password field revealed and demand the
     * password a second time for an edit that is no longer an edit. Moved forward on save instead.
     */
    const [savedEmail, setSavedEmail] = useState('');
    /**
     * Held out of `form` on purpose. `form` is the request body and is spread into the PUT;
     * keeping a password in it would make it a field that ships on every save, including the ones
     * that do not touch the email and must keep working without one.
     */
    const [currentPassword, setCurrentPassword] = useState('');

    useEffect(() => {
        if (user) {
            setForm({
                fullName: user.fullName || '',
                bio: user.bio || '',
                email: user.email || '',
                profilePictureUrl: user.profilePictureUrl || '',
            });
            setSavedEmail(user.email || '');
        }
    }, [user]);

    // Trimmed on both sides: the input keeps whatever was typed, and a stray space is not a change
    // of address — asking for a password over one would be unexplainable.
    const emailChanged = form.email.trim() !== savedEmail.trim();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Checked here as well as by the input's own `required`, because the input only exists
        // while `emailChanged` holds — and without it the refusal arrives as a round trip and a
        // CURRENT_PASSWORD_REQUIRED, which says the same thing far more slowly.
        if (emailChanged && !currentPassword) {
            showToast(t('profile.emailChangeNeedsPassword'), 'error');
            return;
        }

        setSaving(true);

        try {
            // `currentPassword` is added ONLY when the email actually changes. The backend asks for
            // it on exactly that condition, so sending it unconditionally would turn every profile
            // save — a bio edit, a name correction — into a password prompt, and would be a
            // password travelling for no reason on most of them.
            await api.put('/user/profile', emailChanged ? { ...form, currentPassword } : form);
            showToast(t('profile.saved'), 'success');
            // Both, in this order: the field disappears because the edit is no longer pending, and
            // the password is not left sitting in a state the next save could resend.
            setSavedEmail(form.email.trim());
            setCurrentPassword('');
        } catch (err) {
            // `describeError`, not `data.message`: CURRENT_PASSWORD_REQUIRED and
            // CURRENT_PASSWORD_INVALID arrive as `reason` codes and are worded in `errors.reasons`,
            // and the raw `message` on a Bean Validation 400 here is the constraint's English.
            showToast(describeError(err, t('profile.saveFailed')), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[500px] mx-auto my-8 sm:my-10 px-4">
                <div className="bg-surface p-6 sm:p-8 rounded-lg shadow-sm border border-border-light">
                    <h1 className="text-xl font-bold mb-6">{t('profile.title')}</h1>

                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <Input label={t('fields.username')} value={user?.username || ''} dir="ltr" disabled />
                        <Input
                            label={t('fields.fullName')}
                            value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                            maxLength={FULL_NAME_MAX_LENGTH}
                            placeholder={t('fields.fullNamePlaceholder')}
                        />
                        <Input
                            label={t('fields.email')}
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            maxLength={EMAIL_MAX_LENGTH}
                            dir="ltr"
                            placeholder="email@example.com"
                        />

                        {/*
                          * Revealed by the edit rather than always present: changing the address is
                          * a step in taking the account over — every verification and reset link
                          * follows it — so the backend requires a password for that one change and
                          * for nothing else on this form. A permanently visible password box would
                          * read as "this page needs your password", which is false for the bio and
                          * the name and is how people learn to type it without asking why.
                          *
                          * The sentence above it is the reason the field appeared, not an
                          * instruction: it materialises mid-form under someone who was editing a
                          * name a moment ago, and an unexplained password prompt is exactly what a
                          * phishing page looks like.
                          */}
                        {emailChanged && (
                            <div>
                                <p className="text-text-muted text-xs mb-1.5">{t('profile.emailChangeNeedsPassword')}</p>
                                <Input
                                    label={t('profile.currentPassword')}
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    dir="ltr"
                                />
                            </div>
                        )}
                        <Input
                            label={t('profile.bioLabel')}
                            textarea
                            rows={3}
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                            maxLength={BIO_MAX_LENGTH}
                            placeholder={t('profile.bioPlaceholder')}
                        />

                        <Button type="submit" disabled={saving} fullWidth>
                            {saving ? t('common.saving') : t('common.save')}
                        </Button>
                    </form>
                </div>

                <ChangePasswordCard />
            </div>
        </PageShell>
    );
}

export default UserProfile;
