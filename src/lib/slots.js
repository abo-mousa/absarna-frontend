/**
 * The three times of day a daily portion is kept in, named from «واستعينوا بالغَدوة والرَّوحة وشيءٍ من
 * الدُّلجة» (Bukhari 39) — the mirror of the backend's `LearningSlot`, and it must stay one: the
 * server decides which slot a goal is in, and this decides which slot it is NOW, so the two tests
 * (`LearningSlotTest`, `slots.test.js`) pin the same boundaries.
 *
 * <p>By the local clock, not prayer times (the platform does not ask for a location). The day, and
 * its first slot, begin at 03:00 — the night belongs to the day before it.
 */
export const SLOTS = ['GHADWA', 'RAWHA', 'DULJA'];

/** The slot a local time falls in. */
export function slotOf(date) {
    const hour = date.getHours();
    if (hour >= 3 && hour < 12) return 'GHADWA';
    if (hour >= 12 && hour < 18) return 'RAWHA';
    return 'DULJA';
}

/** A slot's place in the day: 0, 1, 2. */
export const slotIndex = (slot) => SLOTS.indexOf(slot);

/** Before noon local: the window in which yesterday's missed portion can be made up. */
export const beforeNoon = (date) => date.getHours() >= 3 && date.getHours() < 12;
