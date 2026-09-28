import { afterEach, describe, expect, it } from 'vitest';
import { setActiveLocale, t } from '@/i18n';
import { FIELDS, SUBJECT_CODES, fieldOf, isField, searchSubjects, subjectLabel } from '@/lib/subjects';

afterEach(() => setActiveLocale('ar'));

describe('the subject list', () => {
    it('is exactly the backend’s, code for code and in its order (SubjectTest pins the same list)', () => {
        expect(SUBJECT_CODES).toEqual([
            'ISLAMIC', 'QURAN', 'HADITH', 'AQEEDAH', 'FIQH', 'SEERAH', 'TAZKIYAH', 'DAWAH',
            'HISTORY', 'ISLAMIC_HISTORY', 'WORLD_HISTORY', 'BIOGRAPHIES', 'CIVILISATION',
            'LANGUAGE', 'ARABIC', 'LITERATURE', 'LANGUAGES',
            'THOUGHT', 'PHILOSOPHY', 'CONTEMPORARY', 'POLITICS', 'MEDIA',
            'FAMILY', 'MARRIAGE', 'PARENTING', 'WOMEN', 'YOUTH', 'SELF',
            'SCIENCE', 'NATURAL_SCIENCES', 'MEDICINE', 'MATHEMATICS', 'ASTRONOMY', 'ENGINEERING', 'TECHNOLOGY',
            'WORK', 'ECONOMICS', 'ENTREPRENEURSHIP', 'CAREER', 'CRAFTS',
            'LEISURE', 'STORIES', 'CHILDREN', 'TRAVEL', 'COOKING', 'SPORTS',
        ]);
        expect(FIELDS).toHaveLength(8);
    });

    it('names every code in both languages', () => {
        for (const locale of ['ar', 'en']) {
            setActiveLocale(locale);
            for (const code of SUBJECT_CODES) expect(t(`subjects.names.${code}`)).not.toBe(`subjects.names.${code}`);
        }
    });

    it('knows each code’s field, and that a field is its own', () => {
        expect(fieldOf('FIQH').code).toBe('ISLAMIC');
        expect(fieldOf('SCIENCE').code).toBe('SCIENCE');
        expect(isField('SCIENCE')).toBe(true);
        expect(isField('FIQH')).toBe(false);
        expect(fieldOf('NOPE')).toBeNull();
        expect(subjectLabel('NOPE')).toBe('');
    });

    it('finds a subject by a word of its name or a keyword, folding Arabic the way search does', () => {
        setActiveLocale('ar');
        expect(searchSubjects('فقه')).toContain('FIQH');
        expect(searchSubjects('السيره')).toContain('SEERAH');
        expect(searchSubjects('برمجة')).toContain('TECHNOLOGY');
        expect(searchSubjects('   ')).toEqual([]);
        setActiveLocale('en');
        expect(searchSubjects('cook')).toContain('COOKING');
    });
});
