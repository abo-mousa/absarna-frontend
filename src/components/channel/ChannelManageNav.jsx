import { Link } from 'react-router-dom';
import { Video, BookOpen, FileText, MessageSquare, MessagesSquare, Settings, Import, ExternalLink } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { t } from '@/i18n';

/**
 * The channel dashboard's sections, grouped by what the owner is doing in them.
 *
 * <p>The grouping is the point. As a row of eight pills, "videos" sat beside "YouTube import" and
 * "settings" as though all three were the same kind of thing; the groups say which ones are worked
 * in daily (content, community) and which are set up once (the channel itself), and put the latter
 * last.
 *
 * <p>An id is also the `?tab=` value, so renaming one breaks links people have saved. There is no
 * `series` section: series are browsed inside videos, where their videos are, and an old
 * `?tab=series` link opens videos through {@link resolveTab}'s default.
 */
export const MANAGE_SECTIONS = [
    {
        id: 'content',
        items: [
            { id: 'videos', icon: Video },
            { id: 'books', icon: BookOpen },
            { id: 'articles', icon: FileText },
            { id: 'posts', icon: MessageSquare },
        ],
    },
    {
        id: 'community',
        items: [{ id: 'comments', icon: MessagesSquare }],
    },
    {
        id: 'channel',
        items: [
            { id: 'youtube', icon: Import },
            { id: 'settings', icon: Settings },
        ],
    },
];

const TAB_IDS = MANAGE_SECTIONS.flatMap((section) => section.items.map((item) => item.id));

/** The first item in the menu, which is what the page opens on. */
export const DEFAULT_TAB = TAB_IDS[0];

/**
 * The tab a `?tab=` value names — or the default for a missing or unknown one.
 *
 * <p>Unknown is ordinary rather than an error: a link saved before a section was renamed, or a
 * hand-edited URL, should land on the dashboard rather than on a blank content area.
 */
export function resolveTab(param) {
    return TAB_IDS.includes(param) ? param : DEFAULT_TAB;
}

/**
 * `'running'`, `'paused'` or `null` — whether the YouTube item carries a dot.
 *
 * <p>An import runs for hours and the owner spends that time in the other sections, so the menu is
 * where it has to stay visible. Only the two states that ask something of the owner: RUNNING
 * (it is still going — don't start anything that assumes it has finished) and PARTIAL (it is
 * waiting for them to press continue). A finished or failed import says so inside its own tab.
 */
export function importIndicator(youtubeState) {
    const status = youtubeState?.importStatus;
    if (status === 'RUNNING') return 'running';
    if (status === 'PARTIAL') return 'paused';
    return null;
}

function ImportDot({ indicator }) {
    if (!indicator) return null;
    const label = t(`channelManage.importIndicator.${indicator}`);
    return (
        <span
            role="img"
            aria-label={label}
            title={label}
            className={`ms-auto w-2 h-2 rounded-full flex-shrink-0 ${
                indicator === 'running' ? 'bg-primary animate-pulse' : 'bg-gold'
            }`}
        />
    );
}

/**
 * The dashboard's side menu: the channel it manages, and its sections.
 *
 * <p><b>Attached to the screen's edge, not placed in the page's column.</b> The first version sat
 * inside a centred 1200px container, so on a wide monitor it floated with an empty margin on its
 * right and read as a card that had drifted, not as the page's menu. It now runs the full height
 * under the navbar against the right edge — the same frame as the app's own `SideBar`, whose
 * desktop column this page suppresses (`sidebar={false}`, and see `PageShell` for why that leaves
 * its phone drawer in place) — and only the content beside it is centred.
 *
 * <p><b>A sidebar from `lg` up, a scrolling strip below it.</b> The breakpoint is the app shell's
 * own (`SideBar` becomes a drawer below `lg`), and it is also where it has to be: below it, a
 * 240px column beside an upload form leaves the form too narrow to use. A drawer was the other
 * option for small screens and was rejected — it hides which section is open and makes every
 * switch two taps, on the page an owner switches sections on most.
 *
 * <p>Buttons, not links: the sections are panels of one page that stay mounted (see
 * `ChannelManage`), and the URL is kept in step by the page rather than by navigation.
 */
export default function ChannelManageNav({ channel, activeTab, onSelect, youtubeState }) {
    const indicator = importIndicator(youtubeState);

    // Sticks under the navbar, whose height Navbar measures into `--navbar-h` — the 60px this
    // used to hardcode was a pixel short of the bar plus its border.
    return (
        <aside className="bg-surface border-b border-border-light lg:border-b-0 lg:border-l lg:w-[240px] lg:flex-shrink-0 lg:sticky lg:top-[var(--navbar-h)] lg:h-[calc(100vh-var(--navbar-h))] lg:overflow-y-auto">
            <div className="flex items-center gap-3 px-4 py-3 lg:p-4 border-b border-border-light">
                <Avatar src={channel.logoUrl} name={channel.name} color={channel.primaryColor} size="md" />
                <div className="min-w-0">
                    <p className="text-xs text-text-muted">{t('channelManage.subtitle')}</p>
                    <h1 className="font-bold truncate">{channel.name}</h1>
                    <Link
                        to={`/channel/${channel.slug}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                        <ExternalLink size={12} />
                        {t('channelManage.viewChannel')}
                    </Link>
                </div>
            </div>

            <nav
                aria-label={t('channelManage.navLabel')}
                className="flex gap-1 overflow-x-auto px-2 py-2 lg:block lg:overflow-visible"
            >
                {MANAGE_SECTIONS.map((section) => (
                    // `contents` below lg: the groups dissolve and their items join one strip.
                    <div key={section.id} className="contents lg:block lg:mb-3 lg:last:mb-0">
                        <h2 className="hidden lg:block text-[0.7rem] text-text-muted uppercase tracking-wider mb-1.5 px-3">
                            {t(`channelManage.sections.${section.id}`)}
                        </h2>
                        {section.items.map((item) => {
                            const active = item.id === activeTab;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onSelect(item.id)}
                                    aria-current={active ? 'page' : undefined}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm whitespace-nowrap flex-shrink-0 transition-colors lg:w-full lg:mb-0.5 ${
                                        active
                                            ? 'text-primary bg-primary-light font-semibold'
                                            : 'text-text-secondary font-medium hover:bg-surface-hover'
                                    }`}
                                >
                                    <item.icon size={18} />
                                    {t(`channelManage.tabs.${item.id}`)}
                                    {item.id === 'youtube' && <ImportDot indicator={indicator} />}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>
        </aside>
    );
}
