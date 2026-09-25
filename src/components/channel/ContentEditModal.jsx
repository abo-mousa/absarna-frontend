import { useEffect, useState } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import VideoThumbnailPicker from './VideoThumbnailPicker';
import { FieldLabel } from './ContentPublishForm';
import { formatSelectOptions } from '@/lib/formats';
import { t } from '@/i18n';

/**
 * Edits one item's metadata in place.
 *
 * <p>A channel owner could previously only hide an item or destroy it — there was no way to fix a
 * typo in a title, which for an imported catalogue of thousands is most of the editorial work.
 *
 * <p><b>Sends only what changed.</b> Every Update DTO on the backend merges rather than replaces,
 * so an omitted field is left alone; sending the whole object would silently overwrite anything
 * this form does not render (a video's `seriesId`, say). Diffing against the item it opened with
 * is what makes a partial form safe.
 */

/** Which fields each type actually has. `content` and `pages` are the only real divergences. */
const FIELDS = {
    videos: ['title', 'description', 'category', 'originalPublishDate'],
    books: ['title', 'description', 'category', 'pages', 'originalPublishDate'],
    articles: ['title', 'content', 'category', 'originalPublishDate'],
    series: ['title', 'description'],
};

const LABELS = {
    title: 'fields.title',
    description: 'fields.description',
    content: 'fields.content',
    category: 'fields.category',
    pages: 'channelManage.forms.book.pagesLabel',
    originalPublishDate: 'fields.originalPublishDateOptional',
};

function ContentEditModal({ open, type, item, onClose, onSave, saving, slug }) {
    const fields = FIELDS[type] || [];
    const [form, setForm] = useState({});
    // A video's format is a select, not a text field, and it is the owner's EXPLICIT choice that is
    // edited — `item.format` may be the channel's default filling in (`formatInherited`), which
    // this form must not write back as though the owner had picked it. See formatSelectOptions.
    const formatSelect = type === 'videos' && item ? formatSelectOptions(item) : null;
    const [format, setFormat] = useState('');

    // Re-seeded whenever a different item is opened. Without this the dialog would show the
    // previous item's values for a moment, and a quick save would write them onto the new one.
    useEffect(() => {
        if (!item) return;
        setForm(Object.fromEntries(fields.map((f) => [f, item[f] ?? ''])));
        setFormat(type === 'videos' ? formatSelectOptions(item).value : '');
        // Keyed on the item's IDENTITY, not the item: `item` is a fresh object on every refetch
        // of the list behind this dialog, and re-seeding then would silently discard whatever the
        // owner has typed. `fields` is derived from `type` (a new array each render), so `type`
        // already covers it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?.id, type]);

    if (!item) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Only the fields that actually differ. '' is sent as null so a cleared optional field is
        // cleared rather than stored as an empty string.
        const changes = {};
        for (const field of fields) {
            const before = item[field] ?? '';
            const after = form[field] ?? '';
            if (String(before) !== String(after)) {
                changes[field] = after === '' ? null : after;
            }
        }
        // Only a real choice is sent: the empty option means "as the channel", which is the state
        // the video is already in whenever the option is offered at all.
        if (formatSelect && format && format !== formatSelect.value) {
            changes.format = format;
        }
        if (Object.keys(changes).length === 0) {
            onClose();
            return;
        }
        if (await onSave(item.id, changes)) onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title={t('channelManage.editTitle')} maxWidth="560px">
            <form onSubmit={handleSubmit} className="grid gap-4">
                {/* Says plainly that this is a local edit. An imported video still plays from
                    YouTube's player, and an owner retitling it here should not be left wondering
                    whether they have just renamed it on YouTube too. */}
                {item.sourceType === 'YOUTUBE' && (
                    <p className="text-xs text-text-muted">{t('channelManage.editYoutubeNote')}</p>
                )}

                {fields.map((field) => (
                    <Input
                        key={field}
                        label={t(LABELS[field])}
                        value={form[field] ?? ''}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        textarea={field === 'description' || field === 'content'}
                        rows={field === 'content' ? 12 : 3}
                        type={field === 'originalPublishDate' ? 'date' : field === 'pages' ? 'number' : 'text'}
                        required={field === 'title'}
                    />
                ))}

                {formatSelect && (
                    <div>
                        <FieldLabel>{t('formats.label')}</FieldLabel>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-md border border-border outline-none focus:border-primary transition-colors bg-surface"
                        >
                            {formatSelect.options.map((option) => (
                                <option key={option.value || 'inherit'} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Outside the diffing form above on purpose: the poster is saved the moment it
                    is chosen, through its own endpoints, because it is an object in storage
                    rather than a field on this row. Folding it into `changes` would mean either
                    holding the bytes until Save or sending a key the server has not seen land.
                    `slug` is what says the caller can manage this channel, so without one there
                    is nothing to call — the series browser passes it too. */}
                {type === 'videos' && slug && <VideoThumbnailPicker slug={slug} video={item} />}

                <div className="flex gap-2 justify-end">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-text-secondary font-semibold">
                        {t('common.cancel')}
                    </button>
                    <Button type="submit" disabled={saving}>
                        {saving ? t('common.saving') : t('common.save')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default ContentEditModal;
