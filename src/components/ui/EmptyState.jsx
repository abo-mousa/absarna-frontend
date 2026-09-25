import { Inbox } from 'lucide-react';
import { KhatamEmblem } from './Khatam';
import { t } from '@/i18n';

/**
 * A place with nothing in it, or a load that failed: the star emblem, a serif line saying so, and
 * whatever the caller offers next. `icon` is a lucide component naming what is missing (FileText
 * for articles, BookOpen for books); anything else falls back to Inbox, so a stray string can
 * never put an emoji back.
 */
function EmptyState({
                        icon,
                        tone = 'default',
                        title = t('common.noContent'),
                        description = '',
                        action,
                    }) {
    const Icon = typeof icon === 'function' || (icon && typeof icon === 'object') ? icon : Inbox;
    return (
        <div className="flex flex-col items-center text-center py-16 px-5 text-text-secondary">
            <KhatamEmblem icon={Icon} tone={tone} className="mb-5" />
            <h3 className="font-serif text-[1.6rem] font-semibold leading-tight mb-2 text-text-primary">{title}</h3>
            {description && <p className="mb-4 max-w-[46ch]">{description}</p>}
            {action}
        </div>
    );
}

export default EmptyState;
