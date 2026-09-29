import { useEffect, useRef, useState } from 'react';
import { Mail, Link2, PenLine } from 'lucide-react';
import { Modal, Input, Button, RejectedFields } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { describeError } from '@/lib/describeError';
import LetterEditor from './LetterEditor';
import {
    useInviteChannelOwner,
    useChannelClaimLink,
    useInvitationDraft,
    useInvitationPreview,
} from '@/hooks/useChannels';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { LOCALES, DEFAULT_LOCALE } from '@/i18n/locales';
import { t } from '@/i18n';

/**
 * Inviting the scholar a seeded channel is about — by email, or by copying the link.
 *
 * <h2>Why both routes are in one dialog</h2>
 * They are one decision, not two features. An admin who has just found out how to reach somebody
 * either has an address, in which case the platform should write the letter, or has only a
 * WhatsApp number and a student who will pass it on, in which case they need the link. Splitting
 * them across two buttons on a crowded row made the copy button the default by being first, which
 * is how the platform ended up with no record of anything it had sent.
 *
 * <h2>Why the language is a choice and not a guess</h2>
 * The mail's language is read off `users.locale` for every other message this platform sends. The
 * recipient here has no account, so there is nothing to read — the admin is the only one who knows
 * which language the person they wrote to reads, and `channels.claim_invited_locale` records the
 * answer they gave. Defaulting to the platform's own default rather than to the admin's current
 * interface language on purpose: an English-reading admin inviting an Arabic-speaking scholar is
 * the ordinary case here, and an interface preference is not evidence about a third party.
 *
 * <h2>Why it says what the mail contains</h2>
 * The admin is the sender and the letter is not one they wrote. It states that we built the page
 * without asking, and offers to delete it on a reply — so the dialog says so before the press,
 * rather than leaving an admin to discover the wording from a scholar's reply.
 *
 * <h2>Editing the letter</h2>
 * "Edit the letter" loads the default subject and letter from the backend, placeholders left in,
 * and shows a preview the backend renders — never a second renderer here, so the preview is the
 * mail. The admin edits WORDS: the markup is a handful of line marks the backend turns into the
 * invitation's own frame, and everything typed is escaped. Only a letter that differs from the
 * default is sent as an edit; one opened and left alone goes out as the hand-built mail it always
 * was. Switching the language reloads the default only while nothing has been changed, so an edit
 * is never silently thrown away.
 */
export default function ChannelInviteDialog({ channel, open, onClose }) {
    const { showToast } = useToast();
    const invite = useInviteChannelOwner();
    const claimLink = useChannelClaimLink();
    const [email, setEmail] = useState('');
    const [locale, setLocale] = useState(DEFAULT_LOCALE);
    const [editing, setEditing] = useState(false);
    const [subject, setSubject] = useState('');
    const [letter, setLetter] = useState('');
    // The draft the boxes were last filled from. While they still equal it, nothing has been
    // edited: a language switch may refill them, and the send carries no edit.
    const seededFrom = useRef(null);
    const draft = useInvitationDraft(channel?.id, locale, open && editing);
    const preview = useInvitationPreview();

    // Re-seeded on OPENING and on nothing else, the same rule ReviewExemptionDialog follows: a
    // refetch while the dialog is open must not clear an address somebody is part way through
    // typing. The address deliberately does not carry over between channels either — an address
    // left in the field from the previous row is how the wrong scholar gets written to.
    useEffect(() => {
        if (!open) return;
        setEmail(channel?.claimInvitation?.email ?? '');
        setLocale(channel?.claimInvitation?.locale ?? DEFAULT_LOCALE);
        setEditing(false);
        seededFrom.current = null;
    }, [open, channel?.id, channel?.claimInvitation?.email, channel?.claimInvitation?.locale]);

    const untouched = !seededFrom.current
        || (subject === seededFrom.current.subject && letter === seededFrom.current.letter);
    const edited = editing && !untouched;

    // Fill the boxes from the draft — on first load, and on a language switch while untouched.
    useEffect(() => {
        if (!draft.data || !untouched) return;
        if (seededFrom.current === draft.data) return;
        seededFrom.current = draft.data;
        setSubject(draft.data.subject);
        setLetter(draft.data.letter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft.data]);

    const resetToDefault = () => {
        if (!draft.data) return;
        seededFrom.current = draft.data;
        setSubject(draft.data.subject);
        setLetter(draft.data.letter);
    };

    // The preview follows the boxes, a moment behind the typing. Debounced as a string: an object
    // built here is new on every render, so it would never settle and would re-render the preview
    // on a loop.
    const debounced = useDebouncedValue(JSON.stringify({ subject, letter, locale }), 500);
    const { mutate: renderPreview } = preview;
    useEffect(() => {
        const request = JSON.parse(debounced);
        if (!open || !editing || !channel?.id || !request.letter) return;
        renderPreview({ channelId: channel.id, ...request });
    }, [open, editing, channel?.id, debounced, renderPreview]);

    const send = () => {
        invite.mutate(
            {
                channelId: channel.id,
                email: email.trim(),
                locale,
                // Each only if changed: an edited subject alone keeps the hand-built mail.
                ...(edited && subject !== seededFrom.current.subject ? { subject } : {}),
                ...(edited && letter !== seededFrom.current.letter ? { letter } : {}),
            },
            {
                onSuccess: () => {
                    showToast(t('admin.invite.sent'), 'success');
                    onClose();
                },
                onError: (error) =>
                    showToast(describeError(error, t('admin.invite.sendFailed')), 'error'),
            },
        );
    };

    /**
     * The link, on the clipboard, for the scholar who is not reachable by email.
     *
     * <p>Built from `window.location.origin` rather than a configured base, so the copied link
     * points at whatever host the admin is actually looking at. The emailed one is built on the
     * backend from `app.frontend.base-url` for the opposite reason: a link mailed to a scholar
     * must never point at somebody's laptop.
     */
    const copy = async () => {
        try {
            const { slug, token } = await claimLink.mutateAsync(channel.id);
            const url = `${window.location.origin}/channel/${encodeURIComponent(slug)}`
                + `?claim=${encodeURIComponent(token)}`;
            await navigator.clipboard.writeText(url);
            showToast(t('admin.invite.copied'), 'success');
        } catch (error) {
            // Includes a refused clipboard, which is why the toast does not claim it was copied.
            showToast(describeError(error, t('admin.invite.copyFailed')), 'error');
        }
    };

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t('admin.invite.title', { name: channel?.name })}
            maxWidth={editing ? '1100px' : '520px'}
        >
            <p className="text-text-secondary mb-2">{t('admin.invite.intro')}</p>
            {/* What the letter actually says. The admin is the sender and did not write it. */}
            <p className="text-text-muted text-sm mb-4">{t('admin.invite.contents')}</p>

            <RejectedFields error={invite.error}>
                <Input
                    label={t('admin.invite.emailLabel')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    dir="ltr"
                    autoFocus
                    required
                    field="email"
                />
            </RejectedFields>
            {channel?.claimInvitation?.email && (
                <p className="text-text-muted text-xs mt-1">
                    {t('admin.invite.previousAddress')}
                </p>
            )}

            <fieldset className="mt-4 mb-1 border-0 p-0 m-0">
                <legend className="text-sm font-semibold mb-2 p-0">
                    {t('admin.invite.localeLabel')}
                </legend>
                <div className="flex gap-2 flex-wrap">
                    {Object.values(LOCALES).map((option) => (
                        <label
                            key={option.code}
                            className={`px-4 py-2 rounded-lg border cursor-pointer text-sm font-semibold
                                transition-colors ${locale === option.code
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border-light hover:bg-surface-hover'}`}
                        >
                            <input
                                type="radio"
                                name="invite-locale"
                                className="sr-only"
                                checked={locale === option.code}
                                onChange={() => setLocale(option.code)}
                            />
                            {/* The locale's own name, which is the only form useful here: an
                                admin picking a language for somebody else is picking the script
                                that person reads, and «العربية» shows it. */}
                            {option.nativeName}
                        </label>
                    ))}
                </div>
            </fieldset>
            <p className="text-text-muted text-xs mt-2">{t('admin.invite.localeHint')}</p>

            {!editing ? (
                <Button
                    variant="ghost"
                    className="mt-3"
                    onClick={() => setEditing(true)}
                    icon={<PenLine size={14} />}
                >
                    {t('admin.invite.edit')}
                </Button>
            ) : (
                <div className="mt-5">
                    <LetterEditor
                        subject={subject}
                        onSubjectChange={setSubject}
                        letter={letter}
                        onLetterChange={setLetter}
                        locale={locale}
                        placeholders={draft.data?.placeholders}
                        loading={draft.isLoading}
                        loadError={draft.isError ? draft.error : null}
                        preview={preview}
                        onReset={resetToDefault}
                        canReset={edited && !!draft.data}
                        error={invite.error}
                    />
                </div>
            )}

            <div className="flex gap-2 justify-between items-center mt-5 flex-wrap">
                {/* The other route, kept visible rather than hidden behind the send: an address is
                    not the only way to reach somebody, and this is the case the email cannot. */}
                <Button
                    variant="ghost"
                    onClick={copy}
                    disabled={claimLink.isPending}
                    icon={<Link2 size={14} />}
                >
                    {t('admin.invite.copyInstead')}
                </Button>
                <div className="flex gap-2 items-center">
                    <button onClick={onClose} className="px-4 py-2 text-text-secondary font-semibold">
                        {t('common.cancel')}
                    </button>
                    <Button onClick={send} disabled={!valid || invite.isPending} icon={<Mail size={14} />}>
                        {t('admin.invite.send')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
