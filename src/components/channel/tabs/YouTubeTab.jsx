import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import YouTubeImportPanel, { importReasonText } from '../YouTubeImportPanel';
import MetadataAdoptionView from '../MetadataAdoptionView';
import { t } from '@/i18n';

/**
 * Link a YouTube channel, prove you own it, import it.
 *
 * <p><b>Two screens, one tab.</b> The panel is the steady state; confirming the imported metadata
 * takes the tab over (`?confirm=1`) rather than sitting inside it, because that step needs the
 * affirmation sentence next to its button, a page the owner actually reads, and an end — none of
 * which survives being a third block under a multi-day import. See `MetadataAdoptionView`.
 *
 * <p>A tab of its own rather than a panel under the channel settings form. It used to live there,
 * on the argument that a YouTube link is a property of the channel like its name, but on screen it
 * read as a confusing stack: a name and a colour picker on top, then a three-step verification and
 * a multi-day import below, as though they were more of the same (2026-09-16). What the owner does
 * here is a migration with its own steps and its own progress, which is what a tab is for.
 */
export default function YouTubeTab({ slug, youtubeState, isOwner, active }) {
    useImportCompletionToast(slug, youtubeState);

    // WHICH OF THE TWO SCREENS IS SHOWING LIVES IN THE URL, for the reason the open tab does
    // (see ChannelManage): in component state a refresh drops the owner back on the panel, and
    // there is no way to link anyone to the confirmation step. It matters more here than for a
    // tab, because confirming a catalogue of thousands is work done over several sittings and
    // «تابع من حيث وقفت» has to survive closing the laptop.
    //
    // `replace` so that the back button leaves the dashboard rather than stepping through every
    // time the owner opened and closed this — the same call `setActiveTab` makes.
    const [searchParams, setSearchParams] = useSearchParams();
    // Only the owner can confirm, so a `?confirm=1` link opened by anyone else lands on the panel.
    const confirming = isOwner && searchParams.get('confirm') === '1';

    const setConfirming = (next) => {
        const params = new URLSearchParams(searchParams);
        if (next) params.set('confirm', '1');
        else params.delete('confirm');
        setSearchParams(params, { replace: true });
    };

    // Mounted only while showing: the panel runs its own status query, and the page already keeps
    // one live on the tabs that need it.
    if (!active) return null;

    return confirming
        ? <MetadataAdoptionView slug={slug} onClose={() => setConfirming(false)} />
        : <YouTubeImportPanel slug={slug} isOwner={isOwner} onOpenAdoption={() => setConfirming(true)} />;
}

/**
 * Reacts to a YouTube import finishing.
 *
 * <p>The panel polls while a run is `RUNNING`, so its own status text updates in place — but that
 * is the only thing that noticed. The channel's lists were invalidated when the import *started*,
 * the one moment they are guaranteed to be correct, and never again: an import that added 1,926
 * videos left the videos tab showing none of them until something else happened to refetch.
 *
 * <p>Watching the RUNNING → terminal transition rather than the status alone, so this fires once on
 * completion instead of on every poll after it.
 *
 * <p>Lives in this tab, which stays mounted while hidden, so it keeps firing after the owner moves
 * to the videos tab — the page keeps the status query live there too, because that is where an
 * owner goes to watch the imported videos arrive.
 *
 * <p>Nothing here reaches a viewer who has navigated away. The platform has no notification channel
 * — deliberately, the same call the transcode pipeline makes — so this is an in-session update, and
 * the state is still correct whenever the owner comes back.
 */
function useImportCompletionToast(slug, youtubeState) {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const previousStatus = useRef(null);

    useEffect(() => {
        const status = youtubeState?.importStatus;
        const previous = previousStatus.current;
        previousStatus.current = status;

        if (previous !== 'RUNNING' || status === 'RUNNING') return;

        if (status === 'SUCCESS') {
            showToast(t('youtube.succeeded', { count: youtubeState?.importedVideos ?? 0 }), 'success');
            // The import wrote videos and series straight into this channel; every list is stale.
            queryClient.invalidateQueries({ queryKey: ['channel-manage', slug] });
            queryClient.invalidateQueries({ queryKey: ['channel-series-manage', slug] });
        } else if (status === 'PARTIAL') {
            // Not an error — the place is saved and the same button continues — but not silent
            // either: an owner who started a long import and moved on down the tab would otherwise
            // not learn that it stopped. Held longer than a success, because it asks for an action.
            showToast(importReasonText(youtubeState) || t('youtube.pausedToast'), 'info', 8000);
            // The videos committed before the pause are real rows; the lists should show them.
            queryClient.invalidateQueries({ queryKey: ['channel-manage', slug] });
            queryClient.invalidateQueries({ queryKey: ['channel-series-manage', slug] });
        } else if (status === 'FAILED') {
            showToast(t('youtube.failed', {
                reason: importReasonText(youtubeState) || youtubeState?.importMessage || '',
            }), 'error');
        }
        // Keyed on the status TRANSITION alone, per the note above. `importedVideos` climbs on
        // every poll while the import runs, so listing it would re-fire this effect — and its toast
        // and two invalidations — on each one.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [youtubeState?.importStatus]);
}
