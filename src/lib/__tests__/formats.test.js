import { describe, expect, it } from 'vitest';
import { FORMATS, formatSelectOptions } from '@/lib/formats';

/**
 * The format select. The rule worth pinning is the backend's: a PATCH merges and skips nulls, so
 * a format once chosen cannot be cleared — and the form must not offer an option that saves and
 * changes nothing.
 */
describe('formatSelectOptions', () => {
    it('starts an unset video on the channel default, named', () => {
        const { value, options } = formatSelectOptions({ format: 'DOCUMENTARY', formatInherited: true });
        expect(value).toBe('');
        expect(options[0]).toEqual({ value: '', label: 'حسب القناة (وثائقي)' });
        expect(options).toHaveLength(FORMATS.length + 1);
    });

    it('says "not set" when there is no channel default either', () => {
        const { options } = formatSelectOptions({ format: null });
        expect(options[0].label).toBe('بدون تحديد');
    });

    it('offers no empty option once the owner has chosen one', () => {
        const { value, options } = formatSelectOptions({ format: 'REPORT', formatInherited: null });
        expect(value).toBe('REPORT');
        expect(options.map((o) => o.value)).not.toContain('');
    });
});
