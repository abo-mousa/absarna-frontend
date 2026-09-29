import { useEffect, useState } from 'react';
import { Modal, Input, Button, RejectedFields } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { describeError } from '@/lib/describeError';
import { useCreateChannelByAdmin } from '@/hooks/useChannels';
import { useAdminUsers } from '@/hooks/useAdminData';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { t } from '@/i18n';

const EMPTY = { name: '', slug: '', description: '', youtubeSource: '' };

/**
 * A channel created by an admin on an owner's behalf — the seeding path
 * (`POST /api/channels/admin/create`), which until now had no screen.
 *
 * <p>The owner is optional: left empty, the channel is the creating admin's, which is how a
 * channel for a scholar not yet on the platform is made — they take it over later by claiming it.
 * When one is named it is picked from the account list, not typed as a number, for the same reason
 * the transfer dialog does it: the number is the one field a slip on gives the wrong person a channel.
 * The rest is the public create form's fields, validated by the backend, whose refusals land on
 * the field they name.
 */
export default function AdminChannelCreateDialog({ open, onClose }) {
    const { showToast } = useToast();
    const create = useCreateChannelByAdmin();
    const [fields, setFields] = useState(EMPTY);
    const [query, setQuery] = useState('');
    const [owner, setOwner] = useState(null);
    const debounced = useDebouncedValue(query.trim(), 300);
    // Asked only once something is typed: the dialog must not list every account on opening.
    const candidates = useAdminUsers(debounced, 0, !!debounced);

    useEffect(() => {
        if (open) {
            setFields(EMPTY);
            setQuery('');
            setOwner(null);
        }
    }, [open]);

    const set = (key) => (e) => setFields((current) => ({ ...current, [key]: e.target.value }));

    const submit = () => {
        const body = { ...fields };
        if (owner) body.ownerUserId = owner.id;
        if (!body.description.trim()) delete body.description;
        if (!body.youtubeSource.trim()) delete body.youtubeSource;
        create.mutate(body, {
            onSuccess: (created) => {
                showToast(t('admin.create.done', { name: created?.name ?? fields.name }), 'success');
                onClose();
            },
            onError: (error) => showToast(describeError(error, t('admin.create.failed')), 'error'),
        });
    };

    const rows = (candidates.data?.content ?? []).slice(0, 8);
    // A half-typed owner nobody was picked for blocks the press: sending it would quietly make
    // the channel the admin's when they meant to name someone.
    const canSubmit = (owner || !query.trim()) && fields.name.trim() && fields.slug.trim() && !create.isPending;

    return (
        <Modal open={open} onClose={onClose} title={t('admin.create.title')} maxWidth="600px">
            <p className="text-sm text-text-secondary leading-relaxed mb-4">{t('admin.create.body')}</p>
            <RejectedFields error={create.error}>
                <div className="grid gap-3">
                    <Input label={t('admin.create.name')} value={fields.name} onChange={set('name')} required field="name" autoFocus />
                    <Input label={t('admin.create.slug')} value={fields.slug} onChange={set('slug')} dir="ltr" required field="slug" />
                    <Input label={t('admin.create.description')} value={fields.description} onChange={set('description')} textarea rows={3} field="description" />
                    <Input label={t('admin.create.youtubeSource')} value={fields.youtubeSource} onChange={set('youtubeSource')} dir="ltr" field="youtubeSource" />
                    <Input
                        label={t('admin.create.owner')}
                        value={owner ? `${owner.username} <${owner.email}>` : query}
                        onChange={(e) => { setQuery(e.target.value); setOwner(null); }}
                        dir="ltr"
                        field="ownerUserId"
                    />
                </div>
            </RejectedFields>
            {debounced && !owner && (
                <ul className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {rows.length === 0 && !candidates.isLoading && (
                        <li className="text-xs text-text-muted p-2">{t('adminUsers.empty')}</li>
                    )}
                    {rows.map((user) => (
                        <li key={user.id}>
                            <button
                                type="button"
                                onClick={() => setOwner(user)}
                                className="w-full text-start px-3 py-2 rounded-md border border-border-light bg-surface hover:bg-surface-hover text-sm"
                            >
                                <span className="font-semibold">{user.username}</span>
                                <span dir="ltr" className="text-text-muted text-xs ms-2">{user.email}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <div className="flex gap-2 justify-end mt-5">
                <Button variant="outline" onClick={onClose} disabled={create.isPending}>{t('common.cancel')}</Button>
                <Button onClick={submit} disabled={!canSubmit}>{t('admin.create.confirm')}</Button>
            </div>
        </Modal>
    );
}
