import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronBack, ChevronForward } from './DirectionalIcon';
import { aWeekFromSaturday, addDays, monthDays, shiftMonth, weekColumn } from '@/lib/calendarMonth';
import { formatDay, localDay } from '@/lib/dayFormat';
import { hasHijriCalendar } from '@/lib/hijriSeasons';
import { safeStorage } from '@/lib/safeStorage';
import { currentLocale, t } from '@/i18n';

const HIJRI = 'islamic-umalqura';
const GREGORY = 'gregory';
const STORAGE_KEY = 'absarna.calendar';

/** The reader's calendar: what they last chose here, else Hijri for an Arabic reader. */
function initialCalendar() {
    if (!hasHijriCalendar()) return GREGORY;
    const stored = safeStorage.getItem(STORAGE_KEY);
    if (stored === HIJRI || stored === GREGORY) return stored;
    return currentLocale() === 'ar' ? HIJRI : GREGORY;
}

/**
 * Our own date picker, because the platform's spoke Gregorian in the browser's language whatever
 * the page said. A month at a time in either calendar — «هجري | ميلادي», the choice remembered on
 * this browser — in the app's language and digits, the week Saturday to Friday as «أسبوعك» runs.
 * Each day carries its number in the other calendar beneath, small, so a date is never read in
 * one calendar only. Today is ringed, the chosen day filled, a day outside `min`–`max` muted, and
 * `marks` (a day → label, the Hijri seasons) get a gold dot.
 *
 * <p>The value is always a Gregorian 'YYYY-MM-DD' — what the backend stores; the Hijri calendar is
 * a way of reading it. Arrow keys move a day or a week (mirrored under `dir="rtl"`), Enter or
 * Space chooses, and each day is named in full to a screen reader.
 */
function CalendarPicker({ value = null, onChange, min = null, max = null, marks = {} }) {
    const [calendar, setCalendar] = useState(initialCalendar);
    const today = localDay();
    const [cursor, setCursor] = useState(value || (min && min > today ? min : today));
    const [focused, setFocused] = useState(null);
    const grid = useRef(null);
    const other = calendar === HIJRI ? GREGORY : HIJRI;
    const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

    const days = useMemo(() => monthDays(cursor, calendar), [cursor, calendar]);
    const allowed = (iso) => (!min || iso >= min) && (!max || iso <= max);
    const canBack = !min || days[0] > min;
    const canForward = !max || days[days.length - 1] < max;

    useEffect(() => {
        if (focused) grid.current?.querySelector(`[data-day="${focused}"]`)?.focus();
    }, [focused, days]);

    const choose = (cal) => {
        setCalendar(cal);
        safeStorage.setItem(STORAGE_KEY, cal);
    };
    const move = (iso) => {
        if (!allowed(iso)) return;
        if (!days.includes(iso)) setCursor(iso);
        setFocused(iso);
    };
    const onKeyDown = (event, iso) => {
        const step = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
        if (step) {
            event.preventDefault();
            move(addDays(iso, step));
        }
    };

    const title = formatDay(days[0], { month: 'long', year: 'numeric' }, calendar);
    const blanks = weekColumn(days[0]);
    const tab = (cal, label) => (
        <button
            type="button"
            role="tab"
            aria-selected={calendar === cal}
            onClick={() => choose(cal)}
            className={`px-3 h-7 rounded-full text-xs font-semibold transition-colors ${
                calendar === cal ? 'bg-surface text-primary-dark dark:text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col gap-2 select-none">
            {/* One line: the month and its arrows, and the calendar switch at the end of it. */}
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => setCursor(shiftMonth(cursor, calendar, -1))}
                    disabled={!canBack}
                    aria-label={t('calendar.previous')}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-text-primary hover:bg-bg disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    <ChevronBack size={18} aria-hidden="true" />
                </button>
                <span className="font-serif text-base font-bold text-center min-w-[7.5rem]" aria-live="polite">{title}</span>
                <button
                    type="button"
                    onClick={() => setCursor(shiftMonth(cursor, calendar, 1))}
                    disabled={!canForward}
                    aria-label={t('calendar.next')}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-text-primary hover:bg-bg disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    <ChevronForward size={18} aria-hidden="true" />
                </button>
                {hasHijriCalendar() && (
                    <div role="tablist" aria-label={t('calendar.which')} className="ms-auto flex gap-0.5 p-0.5 rounded-full bg-bg">
                        {tab(HIJRI, t('calendar.hijri'))}
                        {tab(GREGORY, t('calendar.gregorian'))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center" aria-hidden="true">
                {aWeekFromSaturday().map((day) => (
                    <span key={day} className="text-[0.7rem] font-semibold text-text-muted">{formatDay(day, { weekday: 'short' })}</span>
                ))}
            </div>

            <div ref={grid} role="grid" aria-label={title} className="grid grid-cols-7 gap-x-1 gap-y-0.5">
                {Array.from({ length: blanks }, (_, i) => <span key={`b${i}`} />)}
                {days.map((iso) => {
                    const ok = allowed(iso);
                    const selected = iso === value;
                    const mark = marks[iso];
                    const tabbable = iso === (focused && days.includes(focused) ? focused : (value && days.includes(value) ? value : days.find(allowed)));
                    return (
                        <button
                            key={iso}
                            type="button"
                            data-day={iso}
                            role="gridcell"
                            tabIndex={tabbable ? 0 : -1}
                            disabled={!ok}
                            aria-selected={selected}
                            aria-label={`${formatDay(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, calendar)} — ${formatDay(iso, { day: 'numeric', month: 'long', year: 'numeric' }, other)}${mark ? ` — ${mark}` : ''}`}
                            title={mark || undefined}
                            onClick={() => { setFocused(iso); onChange(iso); }}
                            onKeyDown={(event) => onKeyDown(event, iso)}
                            className={`relative h-10 w-10 mx-auto rounded-full flex flex-col items-center justify-center leading-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                                selected ? 'bg-primary text-white'
                                    : !ok ? 'text-text-muted/40 cursor-default'
                                        : iso === today ? 'ring-1 ring-primary text-text-primary hover:bg-bg'
                                            : 'text-text-primary hover:bg-bg'
                            }`}
                        >
                            <span className="text-sm font-semibold">{formatDay(iso, { day: 'numeric' }, calendar)}</span>
                            <span className={`text-[0.55rem] ${selected ? 'text-white/80' : 'text-text-muted'}`}>{formatDay(iso, { day: 'numeric' }, other)}</span>
                            {mark && <span className={`absolute top-0.5 w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : 'bg-gold'}`} aria-hidden="true" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default CalendarPicker;
