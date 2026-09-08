import { t } from '@/i18n';
// Mirrors backend AuthService/PasswordValidator's actual rules (authentication/src/main/java/
// com/absarna/authentication/{service/AuthService,validation/PasswordValidator}.java) so the
// client rejects an invalid username/password before hitting the API instead of after.
export const PASSWORD_MIN_LENGTH = 8;
// BCrypt (PasswordValidator) silently truncates past 72 UTF-8 bytes, not 72 characters — a
// mixed-script password can hit that cap at well under 72 characters, so this must be measured
// with TextEncoder, not `password.length`.
export const PASSWORD_MAX_BYTES = 72;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const SPECIAL_CHAR_PATTERN = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

const utf8ByteLength = (str) => new TextEncoder().encode(str).length;

export const validateUsername = (username) => {
    const trimmed = (username || '').trim();
    if (!trimmed) return t('validation.usernameRequired');
    if (trimmed.length < USERNAME_MIN_LENGTH) return t('validation.usernameTooShort', { min: USERNAME_MIN_LENGTH });
    if (!USERNAME_PATTERN.test(trimmed)) return t('validation.usernameCharacters');
    return '';
};

// Every rule must pass (not a weighted score) — matches the backend's all-of validation.
export const getPasswordRules = (password) => ([
    { key: 'length', label: t('validation.ruleLength', { min: PASSWORD_MIN_LENGTH }), valid: password.length >= PASSWORD_MIN_LENGTH },
    { key: 'uppercase', label: t('validation.ruleUppercase'), valid: /[A-Z]/.test(password) },
    { key: 'lowercase', label: t('validation.ruleLowercase'), valid: /[a-z]/.test(password) },
    { key: 'digit', label: t('validation.ruleDigit'), valid: /\d/.test(password) },
    { key: 'special', label: t('validation.ruleSpecial'), valid: SPECIAL_CHAR_PATTERN.test(password) },
    { key: 'maxBytes', label: t('validation.ruleMaxBytes', { max: PASSWORD_MAX_BYTES }), valid: utf8ByteLength(password) <= PASSWORD_MAX_BYTES },
]);

export const isPasswordValid = (password) => getPasswordRules(password).every((rule) => rule.valid);

export const getPasswordStrengthLabel = (rules) => {
    const passed = rules.filter((rule) => rule.valid).length;
    if (passed >= rules.length) return { text: t('validation.strengthVeryStrong'), color: '#059669' };
    if (passed >= rules.length - 1) return { text: t('validation.strengthStrong'), color: '#10B981' };
    if (passed >= rules.length - 2) return { text: t('validation.strengthMedium'), color: '#D4AF37' };
    return { text: t('validation.strengthWeak'), color: '#DC2626' };
};
