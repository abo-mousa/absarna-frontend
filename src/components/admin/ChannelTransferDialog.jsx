import { useEffect, useState } from 'react';
import { Modal, Input, Button, RejectedFields } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { describeError } from '@/lib/describeError';
import { useTransferChannel } from '@/hooks/useChannels';
import { useAdminUsers } from '@/hooks/useAdminData';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { t } from '@/i18n';

/**
 * Hands a channel to an account by hand.
 *
 * <p>The backend has had this for as long as seeding has existed (`POST /admin/{id}/transfer`)
 * and it is documented as the repair for a claim that went to the wrong person — and it had no
 * screen, so the repair was a curl command. The account is found by name or address rather than
 * typed as a number: a wrong id here gives somebody a scholar's channel.
 */
export default function ChannelTransferDialog({ channel, open, onClose }) {
    const { showToast } = useToast();
    const transfer = useTransferChannel();
    const [query, setQuery] = useState('');
    const [chosen, setChosen] = useState(null);
    const debounced = useDebouncedValue(query.trim(), 300);
    // Asked only once something is typed: the dialog must not list every account on opening.
    const candidates = useAdminUsers(debounced, 0, !!debounced);

    useEffect(() => {
        if (open) {
            setQuery('');
            setChosen(null);
        }
    }, [open, channel?.id]);

    const submit = () => {
        transfer.mutate({ channelId: channel.id, ownerUserId: chosen.id }, {
            onSuccess: () => {
                showToast(t('admin.transfer.done', { name: chosen.username }), 'success');
                onClose();
            },
            onError: (error) => showToast(describeError(error, t('admin.transfer.failed')), 'error'),
        });
    };

    const rows = (candidates.data?.content ?? []).slice(0, 8);

    return (
        <Modal open={open} onClose={onClose} title={t('admin.transfer.title', { name: channel?.name ?? '' })} maxWidth="520px">
            <p className="text-sm text-text-secondary leading-relaxed mb-4">{t('admin.transfer.body')}</p>
            {channel?.ownerUserId != null && (
                <p className="text-xs text-text-muted mb-3">{t('admin.transfer.currentOwner', { id: channel.ownerUserId })}</p>
            )}
            <RejectedFields error={transfer.error}>
                <Input
                    label={t('admin.transfer.findLabel')}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setChosen(null); }}
                    dir="ltr"
                    autoFocus
                    field="ownerUserId"
                />
            </RejectedFields>
            {debounced && (
                <ul className="mt-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                    {rows.length === 0 && !candidates.isLoading && (
                        <li className="text-xs text-text-muted p-2">{t('adminUsers.empty')}</li>
                    )}
                    {rows.map((user) => (
                        <li key={user.id}>
                            <button
                                type="button"
                                aria-pressed={chosen?.id === user.id}
                                onClick={() => setChosen(user)}
                                className={`w-full text-start px-3 py-2 rounded-md border text-sm transition-colors ${
                                    chosen?.id === user.id
                                        ? 'border-primary bg-primary-light'
                                        : 'border-border-light bg-surface hover:bg-surface-hover'
                                }`}
                            >
                                <span className="font-semibold">{user.username}</span>
                                <span dir="ltr" className="text-text-muted text-xs ms-2">{user.email}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <div className="flex gap-2 justify-end mt-5">
                <Button variant="outline" onClick={onClose} disabled={transfer.isPending}>{t('common.cancel')}</Button>
                <Button onClick={submit} disabled={!chosen || transfer.isPending}>
                    {chosen ? t('admin.transfer.confirm', { name: chosen.username }) : t('admin.transfer.pick')}
                </Button>
            </div>
        </Modal>
    );
}
