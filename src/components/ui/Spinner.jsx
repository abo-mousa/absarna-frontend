import IrisMark from './IrisMark';
import { t } from '@/i18n';

/**
 * Block-level loading indicator: the brand mark drawing itself, in a box sized to sit in
 * the slot a page or section's content will fill.
 *
 * All the artwork and motion live in `IrisMark` — reach for that directly anywhere the
 * padding here would be wrong (inline in a button, inside a badge, as decoration).
 *
 * <h2>What this is NOT for</h2>
 * Three places deliberately keep a plain `animate-spin` lucide icon instead:
 * `VideoCard`'s 12px processing badge and `YouTubeImportPanel`'s 14px button icon, both
 * far below the ~24px where the iris stops resolving; and `VideoControlBar`'s buffering
 * overlay, which appears and vanishes inside a second — the draw takes 1.45s, so it would
 * never finish, and a half-drawn logo flashing over playback reads as a fault.
 */
function Spinner({ size = '40px', label = t('common.loading') }) {
    return (
        // py-16 matches EmptyState, which is what QueryState swaps this for on the error
        // and empty branches. At py-10 the box was 24px shorter, so every list that failed
        // or came back empty jolted the page as it settled.
        <div className="flex justify-center py-16">
            <IrisMark size={size} label={label} />
        </div>
    );
}

export default Spinner;
