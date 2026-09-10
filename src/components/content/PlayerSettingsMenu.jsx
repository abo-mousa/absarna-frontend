import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { t } from '@/i18n';

/**
 * The gear in the player's control bar, and the panel it opens.
 *
 * <p><b>It is part of the bar, and the bar is ours, and that is the whole reason it works.</b> A
 * browser renders only the fullscreen element's own subtree, so a control that is a sibling of the
 * `<video>` does not exist in fullscreen — which is what made quality unchangeable there. Nothing
 * about that can be fixed while the browser owns the control bar: its fullscreen button targets the
 * `<video>` itself, re-pointing the request at our wrapper needs a second request the browser may
 * refuse, and Safari's button does not even use that API — it puts the element into its own
 * presentation mode, where there is nothing to re-point. So `VideoPlayer` turns `controls` off and
 * `VideoControlBar` draws the bar, with this menu inside it.
 *
 * <p><b>One level deep, not one long list.</b> The root shows a line per setting with its current
 * value — «الجودة … تلقائي» — and opening one replaces the panel with that setting's options and
 * a way back. Laid out flat, the panel was every rung and every speed at once: a dozen rows where
 * eleven are noise, no way to see the current state at a glance, and a panel that grows taller
 * every time a setting is added. Toggles stay on the root, because a toggle has nowhere to drill
 * into.
 *
 * <p>Deliberately dumb about *content*: it renders the groups it is handed and owns nothing but
 * which view is showing. What is offered — which rungs exist, whether this browser has
 * picture-in-picture — is `VideoPlayer`'s knowledge, and a menu with nothing to change renders
 * nothing at all.
 *
 * <p><b>Not theme tokens.</b> Like the rest of the bar this sits on top of video rather than on a
 * page: in fullscreen there is no page behind it, and `bg-surface` in light mode would put a
 * near-white panel over a dark picture. So it is translucent black with white text in both themes,
 * like every player a viewer has already used. It also re-asserts `dir="rtl"`, because the bar
 * around it is deliberately laid out left-to-right (see VideoControlBar) while this is prose.
 *
 * @param groups   drill-down settings — `[{ id, title, options: [{ id, label }], activeId, onSelect }]`
 * @param toggles  on/off rows — `[{ id, label, active, onToggle }]`
 * @param onOpenChange  told whenever the panel opens or closes, so the bar can stay up while it is
 *                      open — a menu that disappears from under the pointer is unusable
 */
export default function PlayerSettingsMenu({ groups = [], toggles = [], onOpenChange }) {
    const [open, setOpen] = useState(false);
    // Which setting is drilled into, or null for the root list.
    const [openGroupId, setOpenGroupId] = useState(null);
    const wrapperRef = useRef(null);
    const panelRef = useRef(null);
    const gearRef = useRef(null);
    // The setting last drilled into, so stepping back out lands on its row rather than at the top
    // of the list. A ref, not state: it only matters to the focus effect below, and changing it
    // must not itself re-render.
    const lastOpenedRef = useRef(null);

    useEffect(() => {
        onOpenChange?.(open);
    }, [open, onOpenChange]);

    // Reopening always starts at the root — a panel that reopens wherever it was last left is
    // disorienting. No focus restoring here, unlike `dismissPanel`: an outside click has already
    // put focus somewhere, and pulling it back to the gear would fight whatever was clicked.
    const closePanel = useCallback(() => {
        setOpen(false);
        setOpenGroupId(null);
    }, []);
    useOutsideClick(wrapperRef, closePanel);

    // Closing by keyboard or by making a choice: focus goes back to the gear, because the row it
    // was on is about to stop existing — otherwise a keyboard viewer's next Tab starts from the
    // top of the document.
    const dismissPanel = useCallback(() => {
        closePanel();
        gearRef.current?.focus();
    }, [closePanel]);

    const openGroup = groups.find((group) => group.id === openGroupId) ?? null;

    const drillInto = useCallback((id) => {
        lastOpenedRef.current = id;
        setOpenGroupId(id);
    }, []);

    // A menu is expected to take focus when it opens, and to land on the current value rather than
    // at the top — that is the difference between "here are your options, this is the one you
    // have" and a list a viewer has to count through. Re-runs on every drill in and out (hence
    // `openGroupId`), where the rows have just been replaced wholesale; coming back out, focus
    // returns to the row that was drilled into.
    useEffect(() => {
        if (!open) return;
        const panel = panelRef.current;
        const target = panel?.querySelector('[data-menu-focus="true"]')
            ?? panel?.querySelector('[role^="menuitem"]');
        target?.focus();
    }, [open, openGroupId]);

    /**
     * Arrow-key navigation, which is what `role="menu"` promises.
     *
     * Tab alone would work — every row is a real `<button>` — but a screen reader announces this
     * as a menu, and a viewer who is told they are in a menu presses Down. Left/Right drill in and
     * out, mirrored for the RTL panel: "forward" is towards the left edge here.
     */
    const handlePanelKeyDown = (e) => {
        if (e.key === 'Escape') {
            // One thing per keypress: step out of a setting first, and only close from the root.
            // It must not reach the document either, where Escape also leaves fullscreen.
            e.stopPropagation();
            if (openGroup) setOpenGroupId(null);
            else dismissPanel();
            return;
        }
        if (e.key === 'ArrowLeft' && !openGroup) {
            const id = document.activeElement?.dataset?.groupId;
            if (id) {
                e.preventDefault();
                drillInto(id);
            }
            return;
        }
        if (e.key === 'ArrowRight' && openGroup) {
            e.preventDefault();
            setOpenGroupId(null);
            return;
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
        const items = Array.from(panelRef.current?.querySelectorAll('[role^="menuitem"]') ?? []);
        if (items.length === 0) return;
        e.preventDefault();
        const current = items.indexOf(document.activeElement);
        let next = 0;
        if (e.key === 'End') next = items.length - 1;
        else if (e.key === 'ArrowDown') next = (current + 1) % items.length;
        else if (e.key === 'ArrowUp') next = current <= 0 ? items.length - 1 : current - 1;
        items[next].focus();
    };

    const settings = groups.filter((group) => group.options.length > 1);
    if (settings.length === 0 && toggles.length === 0) return null;

    const rowClass = `w-full flex items-center gap-2 rounded px-2 py-1.5 text-right transition-colors
        hover:bg-white/15 focus:outline-none focus-visible:bg-white/20`;

    return (
        <div ref={wrapperRef} className="relative flex items-center">
            <button
                ref={gearRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={t('video.settings.label')}
                onClick={() => (open ? dismissPanel() : setOpen(true))}
                className="flex items-center justify-center w-8 h-8 rounded-full text-white
                    transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2
                    focus-visible:ring-white"
            >
                <Settings size={18} />
            </button>

            {open && (
                <div
                    ref={panelRef}
                    role="menu"
                    dir="rtl"
                    onKeyDown={handlePanelKeyDown}
                    // Opens upward from the gear, and anchored to its right edge so a wide panel
                    // grows into the player rather than off it. Capped shorter on a phone, where
                    // the whole player may be barely taller than this panel wants to be.
                    className="absolute bottom-full right-0 mb-2 min-w-[210px] max-h-36 sm:max-h-60
                        overflow-y-auto rounded-lg bg-black/90 p-1.5 text-sm text-white shadow-lg
                        backdrop-blur-sm"
                >
                    {openGroup ? (
                        <>
                            {/* The way back, and the title of where you are — one row, because a
                                heading a viewer cannot press is a dead end in a menu they reached
                                by pressing something. ChevronRight is "back" in an RTL panel. */}
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => setOpenGroupId(null)}
                                className={`${rowClass} mb-1 rounded-b-none border-b border-white/15 pb-2`}
                            >
                                <ChevronRight size={16} />
                                <span className="font-semibold">{openGroup.title}</span>
                            </button>

                            <div role="group" aria-label={openGroup.title}>
                                {openGroup.options.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={option.id === openGroup.activeId}
                                        data-menu-focus={option.id === openGroup.activeId}
                                        onClick={() => {
                                            openGroup.onSelect(option.id);
                                            // A choice made is the end of the errand: back to the
                                            // video, not back to the root list.
                                            dismissPanel();
                                        }}
                                        className={rowClass}
                                    >
                                        <Check
                                            size={14}
                                            className={option.id === openGroup.activeId ? '' : 'invisible'}
                                        />
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {settings.map((group) => (
                                <button
                                    key={group.id}
                                    type="button"
                                    role="menuitem"
                                    aria-haspopup="menu"
                                    data-group-id={group.id}
                                    // Focused when coming back out of this setting, so returning
                                    // lands where the viewer left rather than at the top.
                                    data-menu-focus={group.id === lastOpenedRef.current}
                                    onClick={() => drillInto(group.id)}
                                    className={`${rowClass} justify-between`}
                                >
                                    <span>{group.title}</span>
                                    <span className="flex items-center gap-1 text-white/60">
                                        {group.options.find((option) => option.id === group.activeId)?.label}
                                        <ChevronLeft size={16} />
                                    </span>
                                </button>
                            ))}

                            {toggles.length > 0 && (
                                <div
                                    role="group"
                                    // A rule only where it separates something: with no setting
                                    // above them, a line across the top divides nothing.
                                    className={settings.length > 0
                                        ? 'mt-1 border-t border-white/15 pt-1'
                                        : ''}
                                >
                                    {toggles.map((toggle) => (
                                        <button
                                            key={toggle.id}
                                            type="button"
                                            role="menuitemcheckbox"
                                            aria-checked={toggle.active}
                                            // Left open on purpose: a toggle is a thing a viewer
                                            // flips and then sees the result of, often flipping it
                                            // straight back.
                                            onClick={toggle.onToggle}
                                            className={rowClass}
                                        >
                                            <Check size={14} className={toggle.active ? '' : 'invisible'} />
                                            <span>{toggle.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
