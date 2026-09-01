// Mirrors backend AuthService/PasswordValidator's actual rules (authentication/src/main/java/
// com/manara/authentication/{service/AuthService,validation/PasswordValidator}.java) so the
// client rejects an invalid username/password before hitting the API instead of after.
export const PASSWORD_MIN_LENGTH = 8;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const SPECIAL_CHAR_PATTERN = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export const validateUsername = (username) => {
    const trimmed = (username || '').trim();
    if (!trimmed) return 'اسم المستخدم مطلوب';
    if (trimmed.length < USERNAME_MIN_LENGTH) return `اسم المستخدم يجب أن يكون ${USERNAME_MIN_LENGTH} أحرف على الأقل`;
    if (!USERNAME_PATTERN.test(trimmed)) return 'اسم المستخدم يمكن أن يحتوي فقط على حروف إنجليزية وأرقام و_';
    return '';
};

// Every rule must pass (not a weighted score) — matches the backend's all-of validation.
export const getPasswordRules = (password) => ([
    { key: 'length', label: `${PASSWORD_MIN_LENGTH} أحرف على الأقل`, valid: password.length >= PASSWORD_MIN_LENGTH },
    { key: 'uppercase', label: 'حرف كبير (A-Z)', valid: /[A-Z]/.test(password) },
    { key: 'lowercase', label: 'حرف صغير (a-z)', valid: /[a-z]/.test(password) },
    { key: 'digit', label: 'رقم واحد على الأقل', valid: /\d/.test(password) },
    { key: 'special', label: 'رمز خاص (!@#$...)', valid: SPECIAL_CHAR_PATTERN.test(password) },
]);

export const isPasswordValid = (password) => getPasswordRules(password).every((rule) => rule.valid);

export const getPasswordStrengthLabel = (rules) => {
    const passed = rules.filter((rule) => rule.valid).length;
    if (passed >= rules.length) return { text: 'قوية جداً', color: '#059669' };
    if (passed >= rules.length - 1) return { text: 'قوية', color: '#10B981' };
    if (passed >= rules.length - 2) return { text: 'متوسطة', color: '#D4AF37' };
    return { text: 'ضعيفة', color: '#DC2626' };
};
