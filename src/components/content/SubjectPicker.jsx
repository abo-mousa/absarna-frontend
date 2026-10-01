import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, CircleDashed } from 'lucide-react';
import { Modal } from '../ui';
import { FIELDS, fieldOf, isField, searchSubjects, subjectLabel } from '@/lib/subjects';
import { isRtl, t } from '@/i18n';

/**
 * «المجال والموضوع» — what a lecture or a book is about, picked in a small window (the design the
 * product owner chose on 2026-09-28: two steps, plus search).
 *
 * <p>The window opens on the eight fields, all in view, each with an icon and a few of its
 * subjects; tapping one moves to that field's subjects, where «… كلّه» takes the field alone. A
 * search box above the fields finds any subject by a word. <b>Optional throughout</b>: «تخطَّ»
 * closes without a choice, «إزالة الاختيار» removes one, and nothing is ever refused for lacking
 * one. Nothing guesses a subject either — there is no detection yet.
 *
 * <p>`inherited` is what the item reads as with no choice of its own (its series' subject, else its
 * channel's default); the trigger says so, so an owner who set the channel once sees their uploads
 * already filed and has nothing to do.
 *
 * @param value      the item's own code, or null
 * @param onChange   called with a code, or null to clear
 * @param inherited  `{ code, from: 'series' | 'channel' }`, or null
 * @param label      the field's label; defaults to «المجال والموضوع (اختياري)»
 */
function SubjectPicker({ value, onChange, inherited = null, label = null, id = 'subject' }) {
    const [open, setOpen] = useState(false);
    const shown = value || inherited?.code || null;
    const field = fieldOf(shown);
    const Icon = field?.icon || CircleDashed;
    const choose = (code) => {
        onChange(code);
        setOpen(false);
    };

    let main = t('subjects.picker.placeholder');
    let sub = t('subjects.picker.placeholderHint');
    if (value && field) {
        main = subjectLabel(value);
        sub = isField(value) ? t('subjects.picker.wholeField') : subjectLabel(field.code);
    } else if (inherited?.code && field) {
        main = subjectLabel(inherited.code);
        sub = t(`subjects.picker.inheritedFrom.${inherited.from}`);
    }
    const Chevron = isRtl() ? ChevronLeft : ChevronRight;

    return (
        <div>
            <p id={`${id}-label`} className="text-sm font-semibold text-text-primary mb-1.5">
                {label || t('subjects.picker.label')} <span className="font-normal text-text-muted">{t('subjects.picker.optional')}</span>
            </p>
            <button
                type="button"
                aria-labelledby={`${id}-label`}
                aria-haspopup="dialog"
                onClick={() => setOpen(true)}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md border border-border bg-surface text-start hover:border-primary transition-colors"
            >
                <span className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${
                    field ? (value ? 'bg-primary-light text-primary' : 'bg-surface-hover text-text-secondary') : 'bg-surface-hover text-text-muted'
                }`}>
                    <Icon size={18} aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                    <span className={`block font-semibold truncate ${value ? 'text-text-primary' : 'text-text-secondary'}`}>{main}</span>
                    <span className="block text-xs text-text-muted truncate">{sub}</span>
                </span>
                <Chevron size={16} aria-hidden="true" className="text-text-muted flex-shrink-0" />
            </button>
            {open && (
                <PickerDialog
                    value={value}
                    onChoose={choose}
                    onClear={value ? () => choose(null) : null}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
}

export function PickerDialog({ value, onChoose, onClear, onClose }) {
    // Opens on the fields, or straight on the current field's subjects when there is a choice to see.
    const [step, setStep] = useState(() => (value ? fieldOf(value)?.code || null : null));
    const [query, setQuery] = useState('');
    const results = searchSubjects(query);
    const field = step ? FIELDS.find((f) => f.code === step) : null;
    const Back = isRtl() ? ChevronRight : ChevronLeft;

    return (
        <Modal open onClose={onClose} title={field ? subjectLabel(field.code) : t('subjects.picker.title')} maxWidth={field ? '560px' : '840px'}>
            <div className="flex flex-col gap-4">
                {!field && (
                    <>
                        <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-bg focus-within:border-primary">
                            <Search size={16} aria-hidden="true" className="text-text-muted flex-shrink-0" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t('subjects.picker.search')}
                                aria-label={t('subjects.picker.search')}
                                className="flex-1 bg-transparent outline-none text-text-primary"
                            />
                        </label>
                        {query.trim() ? (
                            <SearchResults results={results} value={value} onChoose={onChoose} />
                        ) : (
                            <>
                                <p className="text-sm text-text-muted">{t('subjects.picker.hint')}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                    {FIELDS.map((f) => {
                                        const current = fieldOf(value)?.code === f.code;
                                        return (
                                            <button
                                                key={f.code}
                                                type="button"
                                                onClick={() => setStep(f.code)}
                                                aria-pressed={current}
                                                className={`flex flex-col items-start gap-1.5 p-3 rounded-lg border text-start transition-colors ${
                                                    current ? 'border-primary bg-primary-light' : 'border-border-light bg-surface hover:border-primary hover:bg-primary-light'
                                                }`}
                                            >
                                                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-light text-primary">
                                                    <f.icon size={19} aria-hidden="true" />
                                                </span>
                                                <span className="font-bold text-sm leading-snug text-text-primary">{subjectLabel(f.code)}</span>
                                                <span className="text-xs text-text-muted leading-relaxed line-clamp-2">
                                                    {f.subjects.slice(0, 3).map(subjectLabel).join(t('subjects.picker.listJoiner'))}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </>
                )}

                {field && (
                    <>
                        <button type="button" onClick={() => setStep(null)} className="self-start inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                            <Back size={16} aria-hidden="true" />
                            {t('subjects.picker.allFields')}
                        </button>
                        <p className="text-sm text-text-muted">{t('subjects.picker.subjectHint')}</p>
                        <div className="flex flex-wrap gap-2">
                            <Chip selected={value === field.code} dashed onClick={() => onChoose(field.code)}>
                                {t('subjects.picker.wholeFieldOf', { field: subjectLabel(field.code) })}
                            </Chip>
                            {field.subjects.map((code) => (
                                <Chip key={code} selected={value === code} onClick={() => onChoose(code)}>{subjectLabel(code)}</Chip>
                            ))}
                        </div>
                    </>
                )}

                <div className="flex items-center justify-end gap-4 pt-3 border-t border-border-light">
                    {onClear && (
                        <button type="button" onClick={onClear} className="text-sm text-text-muted hover:text-text-primary hover:underline">
                            {t('subjects.picker.clear')}
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="text-sm font-semibold text-text-secondary hover:text-text-primary hover:underline">
                        {t('subjects.picker.skip')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function SearchResults({ results, value, onChoose }) {
    if (!results.length) {
        return <p className="text-sm text-text-muted py-4">{t('subjects.picker.noResults')}</p>;
    }
    return (
        <ul className="flex flex-col gap-1.5">
            {results.map((code) => {
                const f = fieldOf(code);
                return (
                    <li key={code}>
                        <button
                            type="button"
                            onClick={() => onChoose(code)}
                            aria-pressed={value === code}
                            className={`flex w-full items-center gap-3 px-3 py-2 rounded-md border text-start transition-colors ${
                                value === code ? 'border-primary bg-primary-light' : 'border-border-light bg-surface hover:border-primary'
                            }`}
                        >
                            <f.icon size={16} aria-hidden="true" className="text-primary flex-shrink-0" />
                            <span className="flex-1 font-semibold text-sm">{subjectLabel(code)}</span>
                            <span className="text-xs text-text-muted">
                                {isField(code) ? t('subjects.picker.wholeField') : subjectLabel(f.code)}
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

function Chip({ selected, dashed = false, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`px-3.5 py-2 rounded-md border text-sm font-semibold transition-colors ${
                selected
                    ? 'bg-primary border-primary text-white'
                    : `bg-surface ${dashed ? 'border-dashed border-border text-text-secondary' : 'border-border text-text-primary'} hover:border-primary hover:text-primary`
            }`}
        >
            {children}
        </button>
    );
}

export default SubjectPicker;
