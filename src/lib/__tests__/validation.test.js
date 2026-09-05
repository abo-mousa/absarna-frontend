import { describe, expect, it } from 'vitest';
import {
    PASSWORD_MAX_BYTES,
    PASSWORD_MIN_LENGTH,
    USERNAME_MIN_LENGTH,
    getPasswordRules,
    getPasswordStrengthLabel,
    isPasswordValid,
    validateUsername,
} from '@/lib/validation';

/**
 * These rules exist only to reject input before it reaches the API, so their whole value is being
 * identical to the backend's. Where a rule mirrors a specific backend rule, the assertion names the
 * Java counterpart — a divergence here doesn't break anything visibly, it just silently starts
 * showing users a 400 from the server instead of inline feedback (or, worse, accepts something the
 * server will reject).
 */
describe('validateUsername', () => {
    it('accepts Latin letters, digits and underscores', () => {
        expect(validateUsername('kareem')).toBe('');
        expect(validateUsername('kareem_92')).toBe('');
        expect(validateUsername('ABC')).toBe('');
    });

    it('requires a value', () => {
        expect(validateUsername('')).not.toBe('');
        expect(validateUsername('   ')).not.toBe('');
        expect(validateUsername(null)).not.toBe('');
        expect(validateUsername(undefined)).not.toBe('');
    });

    it('measures length after trimming, like the backend does', () => {
        // AuthService.register trims once and validates the trimmed value, so "  ab  " is a
        // 2-character username there — not a 6-character one.
        expect(validateUsername('  ab  ')).not.toBe('');
        expect(validateUsername('  abc  ')).toBe('');
    });

    it('enforces the same minimum length as the backend', () => {
        // USERNAME_MIN_LENGTH mirrors AuthService.register's own `< 3` check.
        expect(validateUsername('a'.repeat(USERNAME_MIN_LENGTH - 1))).not.toBe('');
        expect(validateUsername('a'.repeat(USERNAME_MIN_LENGTH))).toBe('');
    });

    it('rejects Arabic in a username even though free-text fields allow it', () => {
        // Deliberate asymmetry, mirroring AuthService.USERNAME_PATTERN: a username is an
        // identifier like an email or slug. Names, bios and comments stay Arabic-friendly.
        expect(validateUsername('كريم')).not.toBe('');
    });

    it('rejects spaces, hyphens and punctuation', () => {
        expect(validateUsername('kareem ismail')).not.toBe('');
        expect(validateUsername('kareem-ismail')).not.toBe('');
        expect(validateUsername('kareem.ismail')).not.toBe('');
        expect(validateUsername('kareem@x')).not.toBe('');
    });
});

describe('getPasswordRules', () => {
    const ruleFor = (password, key) =>
        getPasswordRules(password).find((rule) => rule.key === key);

    it('reports every rule independently', () => {
        expect(getPasswordRules('').map((rule) => rule.key)).toEqual(
            ['length', 'uppercase', 'lowercase', 'digit', 'special', 'maxBytes'],
        );
    });

    it('checks length against the shared minimum', () => {
        expect(ruleFor('Aa1!', 'length').valid).toBe(false);
        expect(ruleFor('A'.repeat(PASSWORD_MIN_LENGTH), 'length').valid).toBe(true);
    });

    it('checks each character class', () => {
        expect(ruleFor('passw0rd!', 'uppercase').valid).toBe(false);
        expect(ruleFor('PASSW0RD!', 'lowercase').valid).toBe(false);
        expect(ruleFor('Password!', 'digit').valid).toBe(false);
        expect(ruleFor('Password1', 'special').valid).toBe(false);
        expect(ruleFor('Passw0rd!', 'uppercase').valid).toBe(true);
    });

    it('measures the maximum in UTF-8 bytes, not characters', () => {
        // The rule that cannot be written as `password.length`: BCrypt truncates at 72 *bytes*,
        // and Arabic is ~2 bytes per character, so 40 Arabic characters already exceed the cap
        // while looking well short of it.
        const arabic = `Aa1!${'م'.repeat(40)}`;

        expect(arabic.length).toBeLessThan(PASSWORD_MAX_BYTES);
        expect(new TextEncoder().encode(arabic).length).toBeGreaterThan(PASSWORD_MAX_BYTES);
        expect(ruleFor(arabic, 'maxBytes').valid).toBe(false);
    });

    it('allows exactly the byte ceiling', () => {
        const atLimit = `Aa1!${'x'.repeat(68)}`;

        expect(new TextEncoder().encode(atLimit).length).toBe(PASSWORD_MAX_BYTES);
        expect(ruleFor(atLimit, 'maxBytes').valid).toBe(true);
    });

    it('rejects one byte past the ceiling', () => {
        const overLimit = `Aa1!${'x'.repeat(69)}`;

        expect(new TextEncoder().encode(overLimit).length).toBe(PASSWORD_MAX_BYTES + 1);
        expect(ruleFor(overLimit, 'maxBytes').valid).toBe(false);
    });
});

describe('isPasswordValid', () => {
    it('requires every rule to pass, not a majority', () => {
        // The backend validates all-of, so a weighted score here would let through a password the
        // server then rejects.
        expect(isPasswordValid('Passw0rd!')).toBe(true);
        expect(isPasswordValid('Password!')).toBe(false);   // no digit
        expect(isPasswordValid('Passw0rd')).toBe(false);    // no special
        expect(isPasswordValid('passw0rd!')).toBe(false);   // no uppercase
        expect(isPasswordValid('PASSW0RD!')).toBe(false);   // no lowercase
        expect(isPasswordValid('Pw0!')).toBe(false);        // too short
    });

    it('rejects an over-long password even when every other rule passes', () => {
        expect(isPasswordValid(`Passw0rd!${'م'.repeat(40)}`)).toBe(false);
    });

    it('accepts a password containing Arabic as long as the Latin classes are present', () => {
        // Only the class rules are ASCII-bound; extra scripts are allowed, unlike in a username.
        expect(isPasswordValid('Passw0rd!مرحبا')).toBe(true);
    });
});

describe('getPasswordStrengthLabel', () => {
    const labelFor = (password) => getPasswordStrengthLabel(getPasswordRules(password)).text;

    it('reports the top label only when every rule passes', () => {
        expect(labelFor('Passw0rd!')).toBe('قوية جداً');
    });

    it('degrades as rules fail', () => {
        // One missing rule is still "strong"; the label is a hint, while isPasswordValid is the gate.
        expect(labelFor('Password!')).toBe('قوية');
        expect(labelFor('password!')).toBe('متوسطة');
        expect(labelFor('pass')).toBe('ضعيفة');
    });

    it('always returns a colour to render with', () => {
        for (const password of ['', 'pass', 'Password!', 'Passw0rd!']) {
            expect(getPasswordStrengthLabel(getPasswordRules(password)).color)
                .toMatch(/^#[0-9A-Fa-f]{6}$/);
        }
    });

    it('handles an empty password without throwing', () => {
        expect(labelFor('')).toBe('ضعيفة');
    });
});
