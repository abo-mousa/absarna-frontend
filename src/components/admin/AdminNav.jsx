import { Link } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Flag, Tv } from 'lucide-react';
import { useAdminAttention, badgeText } from '@/hooks/useAdminAttention';
import { t } from '@/i18n';

/**
 * The four admin screens, on every one of them.
 *
 * <p><b>This row used to exist only on `/admin`.</b> The links to the review queue, the reports
 * queue and channel management were rendered beside that page's heading, and the three pages they
 * led to rendered nothing of the kind — so pressing any of them took the admin somewhere with no
 * way on and no way back except the browser's Back button. Two of the four screens don't even
 * carry the sidebar, so there was nothing else on the page to navigate with. "The buttons
 * disappear" is exactly what happened, and it is the same bug three times rather than a quirk of
 * one page, which is why the fix is one component the pages share instead of a back-link pasted
 * into each.
 *
 * <p>The nav is the same four items in the same order everywhere, including on the page you are
 * already on: a menu whose contents change as you move through it is one nobody builds a model
 * of. The current entry stays a link rather than becoming a disabled span — pressing it is a
 * harmless way to reload a queue, and removing the only element that says where you are is how
 * this went wrong in the first place.
 *
 * <p>`aria-current="page"` and not colour alone. The active item is also the only one that is
 * filled rather than outlined, so the state survives a monochrome rendering.
 *
 * <p><b>Each queue carries its own count</b> (`countKey`, a field of `/api/admin/attention`), so
 * the navbar badge's total can be traced to where the work is: findings for a reviewer, open
 * reports, channels waiting for review. The overview has none — its number is the navbar's.
 */
export const SECTIONS = [
    { id: 'overview', to: '/admin', icon: LayoutDashboard, labelKey: 'admin.title' },
    { id: 'review', to: '/admin/review', icon: ShieldCheck, labelKey: 'admin.review.title', countKey: 'reviewBacklog' },
    { id: 'reports', to: '/admin/reports', icon: Flag, labelKey: 'adminReports.title', countKey: 'openReports' },
    { id: 'channels', to: '/admin/channels', icon: Tv, labelKey: 'admin.manageChannels', countKey: 'pendingChannels' },
];

function AdminNav({ current }) {
    const { data: attention } = useAdminAttention();
    return (
        <nav aria-label={t('admin.nav.label')} className="mb-6">
            <ul className="flex flex-wrap items-center gap-2">
                {SECTIONS.map(({ id, to, icon: Icon, labelKey, countKey }) => {
                    const active = id === current;
                    const count = countKey ? attention?.[countKey] : 0;
                    const badge = badgeText(count);
                    return (
                        <li key={id}>
                            <Link
                                to={to}
                                aria-current={active ? 'page' : undefined}
                                aria-label={badge ? t('admin.nav.waiting', { label: t(labelKey), count }) : undefined}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold border transition-colors ${
                                    active
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-surface-hover text-text border-border hover:bg-surface'
                                }`}
                            >
                                <Icon size={16} className="flex-shrink-0" />
                                {t(labelKey)}
                                {badge && (
                                    <span
                                        aria-hidden="true"
                                        className={`min-w-[1.375rem] h-[1.375rem] px-1.5 rounded-full text-xs font-bold leading-[1.375rem] text-center ${
                                            active ? 'bg-white text-primary' : 'bg-gold text-gray-900'
                                        }`}
                                    >
                                        {badge}
                                    </span>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export default AdminNav;
