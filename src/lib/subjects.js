import { BookOpenText, Landmark, Languages, Lightbulb, Users, FlaskConical, BriefcaseBusiness, Compass } from 'lucide-react';
import { t, tOptional } from '@/i18n';
import { normalizeArabic } from './arabic';

/**
 * What a lecture or a book is about — the SPA's copy of the backend's `content/subject/Subject`,
 * which `SubjectTest` pins code by code. Eight fields, each a value of its own, and a few subjects
 * under each; a row stores one of them (a field when that is all the owner chose). Codes are
 * stored by name on the server, so they are never renamed; the words are the catalogs'.
 */
export const FIELDS = [
    { code: 'ISLAMIC', icon: BookOpenText, subjects: ['QURAN', 'HADITH', 'AQEEDAH', 'FIQH', 'SEERAH', 'TAZKIYAH', 'DAWAH'] },
    { code: 'HISTORY', icon: Landmark, subjects: ['ISLAMIC_HISTORY', 'WORLD_HISTORY', 'BIOGRAPHIES', 'CIVILISATION'] },
    { code: 'LANGUAGE', icon: Languages, subjects: ['ARABIC', 'LITERATURE', 'LANGUAGES'] },
    { code: 'THOUGHT', icon: Lightbulb, subjects: ['PHILOSOPHY', 'CONTEMPORARY', 'POLITICS', 'MEDIA'] },
    { code: 'FAMILY', icon: Users, subjects: ['MARRIAGE', 'PARENTING', 'WOMEN', 'YOUTH', 'SELF'] },
    { code: 'SCIENCE', icon: FlaskConical, subjects: ['NATURAL_SCIENCES', 'MEDICINE', 'MATHEMATICS', 'ASTRONOMY', 'ENGINEERING', 'TECHNOLOGY'] },
    { code: 'WORK', icon: BriefcaseBusiness, subjects: ['ECONOMICS', 'ENTREPRENEURSHIP', 'CAREER', 'CRAFTS'] },
    { code: 'LEISURE', icon: Compass, subjects: ['STORIES', 'CHILDREN', 'TRAVEL', 'COOKING', 'SPORTS'] },
];

const FIELD_OF = new Map(FIELDS.flatMap((field) => [[field.code, field], ...field.subjects.map((s) => [s, field])]));

/** Every code, fields and subjects, in the backend's order. */
export const SUBJECT_CODES = FIELDS.flatMap((field) => [field.code, ...field.subjects]);

/** The field a code belongs to (itself, for a field); null for an unknown code. */
export const fieldOf = (code) => FIELD_OF.get(code) || null;

export const isField = (code) => FIELDS.some((field) => field.code === code);

/** The words for a code: a field's name or a subject's. An unknown code reads as nothing. */
export const subjectLabel = (code) => (fieldOf(code) ? t(`subjects.names.${code}`) : '');

/**
 * Codes whose words (or whose field's) contain the query, folded the way search folds Arabic —
 * «فقه» finds «الفقه وأصوله», and «سيره» finds «السيرة». A field matches as itself.
 */
export function searchSubjects(query) {
    const q = normalizeArabic(query || '').trim();
    if (!q) return [];
    return SUBJECT_CODES.filter((code) => normalizeArabic(t(`subjects.names.${code}`)).includes(q)
        // A few extra words a person might search by («برمجة» for technology), where the catalog has them.
        || normalizeArabic(tOptional(`subjects.keywords.${code}`) || '').includes(q));
}
