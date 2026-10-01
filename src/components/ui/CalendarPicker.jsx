import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronBack, ChevronForward } from './DirectionalIcon';
import { addDays, monthDays, partsOf, shiftMonth } from '@/lib/calendarMonth';
import { daysBetween, formatDay, localDay } from '@/lib/dayFormat';
import { distanceOf } from '@/lib/ringTurn';
import { countOf } from '@/lib/plural';
import { hasHijriCalendar } from '@/lib/hijriSeasons';
import { safeStorage } from '@/lib/safeStorage';
import { currentLocale, t } from '@/i18n';
import ZelligeMonth from './calendar/ZelligeMonth';
import MoonMonth from './calendar/MoonMonth';
import AstrolabeMonth from './calendar/AstrolabeMonth';

const HIJRI = 'islamic-umalqura';
const GREGORY = 'gregory';
const STORAGE_KEY = 'absarna.calendar';
const STYLE_KEY = 'absarna.calendarStyle';
const STYLES = ['astrolabe', 'moons', 'zellige'];

/** The reader's calendar: what they last chose here, else Hijri for an Arabic reader. */
function initialCalendar() {
    if (!hasHijriCalendar()) return GREGORY;
    const stored = safeStorage.getItem(STORAGE_KEY);
    if (stored === HIJRI || stored === GREGORY) return stored;
    return currentLocale() === 'ar' ? HIJRI : GREGORY;
}

/** The reader's style, remembered; the zellige grid by default — it reads like any calendar. */
function initialStyle() {
    const stored = safeStorage.getItem(STYLE_KEY);
    if (STYLES.includes(stored) && (stored !== 'moons' || hasHijriCalendar())) return stored;
    return 'zellige';
}

const ICONS = {
    astrolabe: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="13" r="8" /><circle cx="12" cy="13" r="4" /><path d="M12 5V2M10 2h4M12 13l5-4" />
        </svg>
    ),
    moons: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        </svg>
    ),
    zellige: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 2l2.6 4.4L19 5l-1.4 4.4L22 12l-4.4 2.6L19 19l-4.4-1.4L12 22l-2.6-4.4L5 19l1.4-4.4L2 12l4.4-2.6L5 5l4.4 1.4z" />
        </svg>
    ),
};

/**
 * Our own date picker, in three styles the reader chooses between — «الإسطرلاب | منازل القمر |
 * الزليج», remembered on this browser (the mockups the product owner chose; the time picker is the
 * astrolabe's dial alone). Underneath they are one picker: a month at a time in either calendar
 * («هجري | ميلادي», also remembered), the app's language and digits, each day with the other
 * calendar's day beside it, today marked, the chosen day turquoise with gold, a day outside
 * `min`–`max` muted, `marks` (the Hijri seasons) in gold, the White Days (13–15) gold-edged.
 * The moon style is Hijri by nature, so it pins the calendar while it is shown.
 *
 * <p>The value is always a Gregorian 'YYYY-MM-DD' — what the backend stores. Every day, in every
 * style, is a real button: arrows move a day or a week (mirrored under RTL), Enter or Space
 * chooses, and each is named in full to a screen reader.
 */
function CalendarPicker({ value = null, onChange, min = null, max = null, marks = {} }) {
    const [calendarChoice, setCalendarChoice] = useState(initialCalendar);
    const [style, setStyle] = useState(initialStyle);
    const calendar = style === 'moons' ? HIJRI : calendarChoice;
    const today = localDay();
    const [cursor, setCursor] = useState(value || (min && min > today ? min : today));
    const [focused, setFocused] = useState(null);
    // The day a turn of a ring is on, before the finger lifts — shown, not yet chosen.
    const [live, setLive] = useState(null);
    const area = useRef(null);
    const other = calendar === HIJRI ? GREGORY : HIJRI;
    const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

    const days = useMemo(() => monthDays(cursor, calendar), [cursor, calendar]);
    const allowed = (iso) => (!min || iso >= min) && (!max || iso <= max);
    const canBack = !min || days[0] > min;
    const canForward = !max || days[days.length - 1] < max;

    // The astrolabe's rim: the twelve months of the year being shown, each by its first day.
    const months = useMemo(() => {
        if (style !== 'astrolabe') return [];
        const current = partsOf(cursor, calendar).month;
        let first = monthDays(cursor, calendar)[0];
        for (let i = 1; i < current; i++) first = monthDays(shiftMonth(first, calendar, -1), calendar)[0];
        const out = [];
        let iso = first;
        for (let i = 0; i < 12; i++) {
            const span = monthDays(iso, calendar);
            out.push({
                iso: span[0],
                name: formatDay(span[0], { month: 'long' }, calendar),
                label: formatDay(span[0], { month: 'long', year: 'numeric' }, calendar),
                current: i === current - 1,
                reachable: (!min || span[span.length - 1] >= min) && (!max || span[0] <= max),
            });
            iso = addDays(span[span.length - 1], 1);
        }
        return out;
    }, [style, cursor, calendar, min, max]);

    useEffect(() => {
        if (focused) area.current?.querySelector(`[data-day="${focused}"]`)?.focus();
    }, [focused, days, style]);

    const chooseCalendar = (cal) => {
        setCalendarChoice(cal);
        safeStorage.setItem(STORAGE_KEY, cal);
    };
    const chooseStyle = (next) => {
        setStyle(next);
        safeStorage.setItem(STYLE_KEY, next);
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
    const tabbableDay = focused && days.includes(focused) ? focused : (value && days.includes(value) ? value : days.find(allowed));
    const dayProps = (iso) => {
        const mark = marks[iso];
        return {
            type: 'button',
            'data-day': iso,
            tabIndex: iso === tabbableDay ? 0 : -1,
            disabled: !allowed(iso),
            // Buttons in a labelled group — the days are not laid in rows in two of the styles,
            // and a grid without rows is worse for a screen reader than no grid at all.
            'aria-pressed': iso === (live ?? value),
            'aria-current': iso === today ? 'date' : undefined,
            'aria-label': `${formatDay(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, calendar)} — ${formatDay(iso, { day: 'numeric', month: 'long', year: 'numeric' }, other)}${mark ? ` — ${mark}` : ''}`,
            title: mark || undefined,
            onClick: () => { setFocused(iso); onChange(iso); },
            onKeyDown: (event) => onKeyDown(event, iso),
        };
    };
    // The White Days, 13–15 of a Hijri month, whichever calendar is on screen.
    const white = (iso) => hasHijriCalendar() && [13, 14, 15].includes(partsOf(iso, HIJRI).day);

    const title = formatDay(days[0], { month: 'long', year: 'numeric' }, calendar);
    const pill = (active, onClick, children, key) => (
        <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`h-7 px-3 rounded-full text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 ${
                active ? 'bg-surface text-primary-dark dark:text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
        >
            {children}
        </button>
    );
    const shown = live ?? value;
    const onLive = (iso) => {
        setLive(iso);
        if (!days.includes(iso)) setCursor(iso);
    };
    const onCommit = (iso) => {
        setLive(null);
        if (allowed(iso)) {
            setFocused(iso);
            onChange(iso);
        }
    };
    const shared = { days, dayProps, value: shown, today, allowed, marks, calendar, other, white, title, onLive, onCommit };
    // How far ahead the day is, as a person would say it — the feedback a turn gives as it goes.
    const ahead = shown ? daysBetween(today, shown) : null;
    const distance = ahead != null && ahead > 0 ? distanceOf(ahead) : null;

    return (
        <div className="flex flex-col gap-2.5 select-none">
            {hasHijriCalendar() && (
                <div role="tablist" aria-label={t('calendar.style')} className="grid grid-cols-3 gap-0.5 p-0.5 rounded-full bg-bg">
                    {STYLES.map((key) => pill(style === key, () => chooseStyle(key), <>{ICONS[key]}{t(`calendar.styles.${key}`)}</>, key))}
                </div>
            )}

            {/* The month and its arrows, and the calendar switch at the end of the line. */}
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
                {hasHijriCalendar() && (style === 'moons' ? (
                    <span className="ms-auto text-xs text-text-muted">{t('calendar.hijriByNature')}</span>
                ) : (
                    <div role="tablist" aria-label={t('calendar.which')} className="ms-auto flex gap-0.5 p-0.5 rounded-full bg-bg">
                        {pill(calendar === HIJRI, () => chooseCalendar(HIJRI), t('calendar.hijri'), 'h')}
                        {pill(calendar === GREGORY, () => chooseCalendar(GREGORY), t('calendar.gregorian'), 'g')}
                    </div>
                ))}
            </div>

            <div ref={area} role="group" aria-label={title}>
                {style === 'astrolabe' && <AstrolabeMonth {...shared} months={months} onMonth={setCursor} />}
                {style === 'moons' && <MoonMonth {...shared} />}
                {style === 'zellige' && <ZelligeMonth {...shared} />}
            </div>

            <p className="text-center text-sm min-h-[1.25rem]" aria-live="polite">
                {distance ? (
                    <>
                        <span className="font-semibold text-primary-dark dark:text-primary">
                            {t('calendar.ahead', { duration: countOf(`journey.units.${distance.unit}`, distance.count, { oblique: true }) })}
                        </span>
                        {distance.unit !== 'DAYS' && (
                            <span className="text-text-secondary">{' · '}{countOf('journey.units.DAYS', ahead)}</span>
                        )}
                    </>
                ) : style !== 'zellige' ? (
                    <span className="text-text-muted">{t('calendar.turnHint')}</span>
                ) : null}
            </p>
            {distance && style !== 'zellige' && <p className="-mt-2 text-center text-xs text-text-muted">{t('calendar.turnHint')}</p>}
        </div>
    );
}

export default CalendarPicker;
