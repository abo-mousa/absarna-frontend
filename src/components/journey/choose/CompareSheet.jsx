import { X } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { bookPortion } from '@/lib/journey';
import { chosenByText, daysToFinish, finishText, itemKey, prefillFor } from '@/lib/goalChoice';
import { amountText } from '@/lib/goalText';
import { Poster } from './parts';
import { t } from '@/i18n';

/**
 * «قائمتي»: the two or three things a reader marked while browsing, side by side, so a vague
 * "maybe" becomes a choice instead of a closed tab. It lives in the choosing page only and is not
 * saved to the account — it is a scratch pad for one decision.
 */
function CompareSheet({ shortlist, onToggle, onCommit, onClose }) {
    return (
        <Modal open onClose={onClose} title={t('journey.choose.compareTitle')} maxWidth="760px">
            <div className="flex flex-col gap-4">
                <p className="text-sm text-text-secondary">{t('journey.choose.compareText')}</p>
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(1, shortlist.length)}, minmax(0, 1fr))` }}>
                    {shortlist.map((item) => {
                        const series = item.kind === 'FINISH_SERIES';
                        const units = series ? item.episodes : (item.pages ?? item.book?.pages);
                        // The pace set on the card or in the preview it was saved from, else the default.
                        const amount = item.pace?.amount || (series ? 1 : bookPortion(units, 0));
                        const deadline = item.pace?.deadline || null;
                        const facts = [
                            [series ? t('journey.choose.facts.episodes') : t('journey.choose.facts.pages'),
                                units ? amountText(series ? 'EPISODES' : 'PAGES', units) : '—'],
                            [t('journey.choose.facts.perDay'), amountText(series ? 'EPISODES' : 'PAGES', amount)],
                            [t('journey.choose.facts.finish'), units ? finishText(daysToFinish(units, amount)) : '—'],
                            [t('journey.choose.facts.channel'), item.channelName || '—'],
                        ];
                        return (
                            <div key={itemKey(item)} className="flex flex-col rounded-md border border-border-light overflow-hidden">
                                <div className="relative">
                                    <Poster item={item} className="aspect-video w-full rounded-none" />
                                    <button
                                        type="button"
                                        onClick={() => onToggle(item)}
                                        aria-label={t('journey.choose.remove')}
                                        className="absolute top-1.5 start-1.5 w-8 h-8 rounded-full bg-surface/95 flex items-center justify-center"
                                    >
                                        <X size={14} aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="p-3 flex flex-col gap-2 flex-1">
                                    <span dir="auto" className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">{item.title}</span>
                                    <dl className="flex flex-col text-sm">
                                        {facts.map(([label, value]) => (
                                            <div key={label} className="py-1.5 border-b border-border-light">
                                                <dt className="text-xs text-text-muted">{label}</dt>
                                                <dd className="font-semibold">{value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                    {item.chosenBy ? <span className="text-xs text-gold-ink">{chosenByText(item.chosenBy)}</span> : null}
                                    <Button className="mt-auto" onClick={() => onCommit(prefillFor(item, amount, deadline))}>{t('journey.choose.pick')}</Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
}

export default CompareSheet;
