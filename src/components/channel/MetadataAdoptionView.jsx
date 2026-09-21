import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Pencil } from 'lucide-react';
import { Button, Modal, Input, Pager, QueryState, Spinner, ExpandableText } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { useUpdateChannelContent } from '@/hooks/useChannels';
import { useAdoptionProgress, useAdoptionPending, useAdoptMetadata } from '@/hooks/useChannelAdoption';
import { describeError } from '@/lib/describeError';
import { formatCount } from '@/lib/numbers';
import { t } from '@/i18n';

/**
 * Which of the three things this screen can be showing.
 *
 * <p>Exported and pure because the ordering is the rule and not an implementation detail.
 * <b>`blocked` is tested before `done`</b>: a channel a platform admin linked has `canAdopt: false`
 * and may well have nothing awaiting confirmation yet, and telling its owner «تم» would say the
 * work is finished when in fact they cannot start it. `done` before `working` for the ordinary
 * reason — zero remaining is a finished state, not an empty list.
 */
export function adoptionState(progress) {
    if (!progress) return 'loading';
    if (!progress.canAdopt) return 'blocked';
    if (!progress.imported) return 'none';
    return progress.awaiting > 0 ? 'working' : 'done';
}

/**
 * «بقي ١٨٤٧ من ٢٠٠٠» — or `null` when there is nothing to count.
 *
 * <p>Says what REMAINS rather than what is finished, which is the opposite of the import panel's
 * progress line one section above it. The two are answering different questions: an import is
 * something the platform is doing for the owner and the interesting number is how far it has got,
 * and this is work the owner has to do themselves, where the interesting number is how much is
 * left. A "confirmed 153" line on a catalogue of two thousand reads as progress on a task that is
 * in fact barely begun.
 */
export function adoptionRemainingLine(progress) {
    const awaiting = Number(progress?.awaiting);
    const imported = Number(progress?.imported);
    if (!Number.isFinite(awaiting) || !Number.isFinite(imported) || imported <= 0) return null;
    if (awaiting <= 0) return t('youtube.adoption.allConfirmed', { count: formatCount(imported) });
    return t('youtube.adoption.remaining', {
        count: formatCount(awaiting),
        total: formatCount(imported),
    });
}

/**
 * The videos on one page, as ids — what the confirm button sends.
 *
 * <p>Read off the rendered page rather than accumulated in state, so what is confirmed is exactly
 * what was on screen. A selection carried across pages is the shape that turns into "confirm all",
 * which is the one thing this screen must not become: a page affirmed without being read records
 * an agreement to words nobody looked at, and the record would say otherwise.
 */
export function idsOnPage(page) {
    return Array.isArray(page?.content) ? page.content.map((row) => row.id) : [];
}

/**
 * Title and description only — the two fields the record snapshots as prose.
 *
 * <p><b>Not `ContentEditModal`</b>, which is the obvious reuse and is wrong here. That dialog edits
 * four fields for a video, and this screen's rows carry three: `category` and `originalPublishDate`
 * would render empty for a video that has them, which invites an owner to fill in a field that is
 * already set and overwrite it. Correcting a title before confirming is the best outcome this
 * screen has — an owner who edits is making a plainer authorship claim than one who agrees — so
 * the editor has to be exactly as wide as what is being affirmed.
 */
function AdoptionEditDialog({ open, row, onClose, onSave, saving }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Re-seeded on identity, not on the object: the list behind this refetches after every
    // confirmation and hands down a fresh row each time, which would discard what is being typed.
    const [seeded, setSeeded] = useState(null);
    if (row && seeded !== row.id) {
        setSeeded(row.id);
        setTitle(row.title ?? '');
        setDescription(row.description ?? '');
    }

    if (!row) return null;

    const changed = title !== (row.title ?? '') || description !== (row.description ?? '');

    return (
        <Modal open={open} onClose={onClose} title={t('youtube.adoption.editTitle')}>
            <form
                className="grid gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!changed) return onClose();
                    // Only what moved, so an untouched field is never sent — every Update DTO on
                    // the backend merges rather than replaces.
                    const changes = {};
                    if (title !== (row.title ?? '')) changes.title = title;
                    if (description !== (row.description ?? '')) changes.description = description || null;
                    onSave(row.id, changes);
                }}
            >
                <Input
                    label={t('fields.title')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <Input
                    label={t('fields.description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    textarea
                    rows={8}
                />
                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={saving || !changed}>
                        {saving ? t('common.saving') : t('common.save')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

/** One row: what is being affirmed, and nothing else. */
function AdoptionRow({ row, onEdit }) {
    return (
        <li className="py-4 border-b border-border-light last:border-b-0">
            <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold leading-relaxed" dir="auto">{row.title}</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(row)}
                    className="shrink-0 gap-1"
                >
                    <Pencil size={14} /> {t('common.edit')}
                </Button>
            </div>

            {/* Shown because it is part of what is affirmed — the id is API Data too, and it is
                what keeps the embed playing after the platform leaves the API. `dir="ltr"` because
                a YouTube id is Latin and would otherwise have its punctuation reordered on an RTL
                line. */}
            {row.youtubeVideoId && (
                <p className="text-xs text-text-muted mt-1 font-mono" dir="ltr">
                    {row.youtubeVideoId}
                </p>
            )}

            {/* Collapsed by default. An imported description is a paragraph, a table of contents,
                four links and a block of hashtags — twenty of those expanded is a page nobody
                reads, which is exactly the failure this screen exists to avoid. */}
            {row.description && (
                <ExpandableText collapsedClassName="max-h-24">
                    <p className="text-sm text-text-secondary leading-loose mt-2 whitespace-pre-line" dir="auto">
                        {row.description}
                    </p>
                </ExpandableText>
            )}
        </li>
    );
}

/**
 * Where an owner confirms that an imported catalogue's titles are their own.
 *
 * <h4>Why this is a screen of its own and not a control on the videos list</h4>
 *
 * <p>Three reasons, and the first is the one that would be lost soonest. <b>The affirmation
 * sentence has to be on screen, once, next to the button.</b> The backend records which wording a
 * person agreed to; spread over the rows of a dashboard that column would name a paragraph nobody
 * ever read whole. <b>There has to be an end.</b> Confirmation scattered through a list the owner
 * uses for other things is a chore with no finish line, where this has a number that reaches zero.
 * And <b>the two lists are different sets in different orders</b> — the manage list is for finding
 * something to edit or delete, and this one shrinks as it is worked.
 *
 * <p><b>The affirmation text comes from the backend</b>, not from `ar.js`, and that is deliberate:
 * the string displayed here has to be the string the record names, or `affirmation_version` is a
 * claim about words nobody can produce. See `AffirmationText` in absarna-backend.
 *
 * <p><b>One button for the page, and no per-row checkbox.</b> A partially-ticked page invites a
 * "select all", and a page confirmed without being read is an agreement to words nobody looked at
 * while the record says otherwise. The page is the unit because the page is what a person reads.
 */
function MetadataAdoptionView({ slug, onClose }) {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [editing, setEditing] = useState(null);

    const progressQuery = useAdoptionProgress(slug);
    const progress = progressQuery.data;
    const state = adoptionState(progress);
    const working = state === 'working';

    // Only fetched when there is something to fetch: a blocked or finished channel has no queue,
    // and asking for one would be a request whose answer is discarded.
    const pendingQuery = useAdoptionPending(slug, page, working);
    const adopt = useAdoptMetadata(slug);
    const update = useUpdateChannelContent(slug, 'videos');

    const rows = pendingQuery.data;
    const ids = idsOnPage(rows);

    const confirmPage = async () => {
        try {
            const result = await adopt.mutateAsync(ids);
            // Back to the first page: the rows behind the ones just confirmed have moved up into
            // this page number, so staying put would show a page the owner has not seen while the
            // pager still claimed they were partway through.
            setPage(0);
            showToast(t('youtube.adoption.confirmed', {
                count: formatCount(result?.adoptedNow ?? ids.length),
            }), 'success');
        } catch (err) {
            showToast(describeError(err, t('youtube.adoption.confirmFailed')), 'error');
        }
    };

    const saveEdit = async (id, changes) => {
        try {
            await update.mutateAsync({ id, changes });
            // The manage lists are invalidated by the mutation itself; this queue is not, and an
            // owner who has just corrected a title must see the correction before they affirm it.
            queryClient.invalidateQueries({ queryKey: ['channel-adoption', slug] });
            setEditing(null);
        } catch (err) {
            showToast(describeError(err, t('channelManage.saveFailed')), 'error');
        }
    };

    return (
        <section className="grid gap-4">
            <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                    <strong className="text-base flex items-center gap-1.5">
                        <ShieldCheck size={16} /> {t('youtube.adoption.heading')}
                    </strong>
                    <p className="text-sm text-text-muted leading-loose" dir="auto">
                        {t('youtube.adoption.intro')}
                    </p>
                </div>
                {onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
                        {t('common.back')}
                    </Button>
                )}
            </div>

            {adoptionRemainingLine(progress) && (
                <p className="text-sm font-semibold" dir="auto">{adoptionRemainingLine(progress)}</p>
            )}

            {state === 'loading' && <Spinner />}

            {/* An admin linked this channel, so the owner's own proof is missing. Said as the one
                step that is left rather than as a refusal: they are not doing anything wrong, and
                the remedy is on the panel above this one. */}
            {state === 'blocked' && (
                <p className="text-sm text-gold leading-loose" dir="auto">
                    {t('youtube.adoption.needsOwnerVerification')}
                </p>
            )}

            {state === 'none' && (
                <p className="text-sm text-text-muted" dir="auto">{t('youtube.adoption.nothingImported')}</p>
            )}

            {state === 'done' && (
                <p className="text-sm text-primary leading-loose" dir="auto">
                    {t('youtube.adoption.done')}
                </p>
            )}

            {working && (
                <QueryState
                    isLoading={pendingQuery.isLoading}
                    isError={pendingQuery.isError}
                    error={pendingQuery.error}
                    onRetry={pendingQuery.refetch}
                >
                    {/* Above the list, not beside the edit button: an owner who assumes the text
                        is fixed will never try, and correcting a title is the plainer authorship
                        claim of the two. */}
                    <p className="text-sm text-text-muted leading-loose mb-3" dir="auto">
                        {t('youtube.adoption.editHint')}
                    </p>

                    <ul className="border border-border-light rounded-lg px-4 bg-surface">
                        {(rows?.content ?? []).map((row) => (
                            <AdoptionRow key={row.id} row={row} onEdit={setEditing} />
                        ))}
                    </ul>

                    {/* The sentence, once, immediately above the button that records agreement to
                        it — served by the backend so that what is shown is what is stored. */}
                    <div className="mt-5 grid gap-3 p-4 rounded-lg bg-primary-light/40 border border-border-light">
                        <p className="text-sm leading-loose" dir="auto">
                            {progress?.affirmationText}
                        </p>
                        <Button
                            onClick={confirmPage}
                            disabled={adopt.isPending || ids.length === 0}
                            className="w-fit"
                        >
                            {adopt.isPending
                                ? t('youtube.adoption.confirming')
                                : t('youtube.adoption.confirmPage', { count: formatCount(ids.length) })}
                        </Button>
                    </div>

                    <Pager
                        page={rows?.page ?? 0}
                        totalPages={rows?.totalPages ?? 0}
                        hasPrevious={(rows?.page ?? 0) > 0}
                        hasNext={(rows?.page ?? 0) + 1 < (rows?.totalPages ?? 0)}
                        onChange={setPage}
                    />
                </QueryState>
            )}

            <AdoptionEditDialog
                open={!!editing}
                row={editing}
                onClose={() => setEditing(null)}
                onSave={saveEdit}
                saving={update.isPending}
            />
        </section>
    );
}

export default MetadataAdoptionView;
