import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAdoptionProgress } from '@/hooks/useChannelAdoption';
import { adoptionState } from './MetadataAdoptionView';
import { formatCount } from '@/lib/numbers';
import { t } from '@/i18n';

/**
 * The one loud statement that a channel's imported text is not yet its owner's.
 *
 * <h4>Why it is at the top of the whole dashboard and not inside the YouTube tab</h4>
 *
 * <p>It was only inside that tab, as a line beside the import progress — which meant an owner who
 * never opened it never learned there was anything to do, and the YouTube tab is exactly the tab
 * somebody stops opening once their import has finished. The tab an owner actually lives in is
 * Videos. So this sits above all of them, on every tab, for as long as the work is outstanding.
 *
 * <h4>Worded as a consequence, not a task</h4>
 *
 * <p>"Confirm your metadata" is a compliance chore with nothing in it for the person being asked,
 * and it would be ignored for exactly that reason. The true and far more persuasive version is
 * that <b>until a row is confirmed, the 30-day sweep re-reads its title, description and speaker
 * from YouTube and overwrites whatever is on the page</b> — so this is about whether the text on
 * their own channel is theirs or a monthly copy of somebody else's. Both statements are true; only
 * the second gets acted on.
 *
 * <h4>Not dismissible, and that is deliberate</h4>
 *
 * <p>A dismiss button on a notice like this is pressed once and the notice is never seen again,
 * which converts "obvious" into "shown once, months ago". It disappears on its own when the number
 * reaches zero, which is the only ending it should have. The per-row badge in
 * `VideoManageStatus` is the quiet counterpart — this is the loud one, and there is exactly one of
 * it however many thousand rows are waiting.
 */
function AdoptionNotice({ slug, onOpen }) {
    const { data: progress } = useAdoptionProgress(slug);
    const state = adoptionState(progress);

    // 'done' and 'none' say nothing here. The finished state is worth a sentence inside the
    // YouTube tab, where somebody went looking; at the top of every page it would be furniture.
    if (state !== 'working' && state !== 'blocked') return null;

    return (
        <div className="mb-5 rounded-md border border-gold/30 bg-gold/10 p-4 grid gap-2 sm:flex sm:items-center sm:gap-4">
            <div className="grid gap-1 flex-1">
                <strong className="text-sm flex items-center gap-1.5 text-gold-dark dark:text-gold">
                    <ShieldAlert size={15} className="flex-shrink-0" />
                    {state === 'blocked'
                        ? t('youtube.adoption.heading')
                        : t('youtube.adoption.noticeTitle', {
                            count: formatCount(progress?.awaiting ?? 0),
                        })}
                </strong>
                <p className="text-sm text-text-secondary leading-loose" dir="auto">
                    {state === 'blocked'
                        ? t('youtube.adoption.needsOwnerVerification')
                        : t('youtube.adoption.noticeBody')}
                </p>
            </div>

            {/* No button on a blocked channel: the remedy is proving ownership on the YouTube tab,
                and a control that can only be refused is worse than no control. */}
            {state === 'working' && (
                <Button onClick={onOpen} className="w-fit sm:flex-shrink-0">
                    {t('youtube.adoption.open')}
                </Button>
            )}
        </div>
    );
}

export default AdoptionNotice;
