import { describe, expect, it } from 'vitest';
import { resumeFrom } from '@/lib/watch';

describe('resumeFrom', () => {
    it('resumes at the saved position', () => {
        expect(resumeFrom({ seconds: 312.8, progress: 0.4, finished: false })).toBe(312);
    });

    it('starts a finished video again from the beginning', () => {
        expect(resumeFrom({ seconds: 2700, progress: 0.95, finished: true })).toBe(0);
    });

    it('starts at 0 with nothing saved, or something that is not a position', () => {
        expect(resumeFrom(undefined)).toBe(0);
        expect(resumeFrom({ seconds: null })).toBe(0);
        expect(resumeFrom({ seconds: 'soon' })).toBe(0);
    });
});
