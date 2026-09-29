import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Ban, Mail, UserCheck } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import AdminNav from '../components/admin/AdminNav';
import LetterEditor from '../components/admin/LetterEditor';
import { Button, ConfirmDialog, Input, Pager } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
    useAddDoNotContact,
    useDoNotContact,
    useOutreachLog,
    useOutreachLookup,
    useOutreachPreview,
    useOutreachStarters,
    useRemoveDoNotContact,
    useSendOutreach,
} from '../hooks/useOutreach';
import { describeError } from '@/lib/describeError';
import { dateLocale, parseTimestamp } from '@/lib/datetime';
import { LOCALES, DEFAULT_LOCALE } from '@/i18n/locales';
import { t } from '@/i18n';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatMoment = (value) => {
    if (!value) return '';
    const moment = parseTimestamp(value).locale(dateLocale());
    return moment.isValid() ? moment.format(t('adminReports.dateFormat')) : '';
};

/** The fields a starter fills, in the shape the editor holds them. */
const fromStarter = (starter) => ({
    starter: starter.starter,
    subject: starter.subject,
    buttonLabel: starter.buttonLabel,
    path: starter.path,
    letter: starter.letter,
});

const sameLetter = (a, b) =>
    !!a && !!b && a.subject === b.subject && a.buttonLabel === b.buttonLabel
    && a.path === b.path && a.letter === b.letter;

/**
 * A letter from the platform to one person who has not asked for anything — an influencer asked to
 * speak about the platform, a scholar with no YouTube channel asked to open one, a reader asked to
 * sign up.
 *
 * <h2>One address at a time, on purpose</h2>
 * Every other mail this platform sends answers something the reader did. This one does not, and it
 * leaves from the domain password resets are delivered on — so it is a personal letter, never a
 * list. The backend enforces the two guards the page explains before the press: an address already
 * written to needs "write again", and an address on the do-not-contact list is refused outright.
 * The letter's last line — that a reply is enough to stop us writing — is the backend's, added to
 * every letter and shown in the preview, and is the reason that list exists.
 *
 * <h2>The starters are only where the editor begins</h2>
 * Picking one fills the subject, the button and the letter; every word stays editable. Switching
 * the language refills them only while nothing has been changed, the invite dialog's rule, so an
 * edit is never silently thrown away; picking another starter over an edit asks first.
 */
export default function AdminOutreach() {
    usePageMeta({ title: t('adminOutreach.title') });
    const { showToast } = useToast();

    const [locale, setLocale] = useState(DEFAULT_LOCALE);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [sendAgain, setSendAgain] = useState(false);
    const [fields, setFields] = useState(null);
    // The starter the boxes were last filled from; while they equal it, nothing has been edited.
    const seededFrom = useRef(null);

    const starters = useOutreachStarters(locale);
    const preview = useOutreachPreview();
    const send = useSendOutreach();

    const list = starters.data?.starters ?? [];
    const edited = fields && !sameLetter(fields, seededFrom.current);

    // First load, and a language switch while untouched: the same starter in the new language.
    useEffect(() => {
        if (!list.length || edited) return;
        const wanted = list.find((s) => s.starter === seededFrom.current?.starter) ?? list[0];
        const next = fromStarter(wanted);
        if (sameLetter(next, seededFrom.current)) return;
        seededFrom.current = next;
        setFields(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [starters.data]);

    // A starter picked over an edit asks first — in the platform's own dialog, not the
    // browser's, which ignores the page's direction and language.
    const [replacing, setReplacing] = useState(null);
    const applyStarter = (starter) => {
        const next = fromStarter(starter);
        seededFrom.current = next;
        setFields(next);
        setReplacing(null);
    };
    const pickStarter = (starter) => {
        if (edited) {
            setReplacing(starter);
            return;
        }
        applyStarter(starter);
    };

    const setField = (key) => (value) => setFields((current) => ({ ...current, [key]: value }));

    const trimmedEmail = email.trim();
    const validEmail = EMAIL.test(trimmedEmail);
    const lookupEmail = useDebouncedValue(validEmail ? trimmedEmail.toLowerCase() : '', 400);
    const lookup = useOutreachLookup(lookupEmail);
    const known = lookup.data && lookupEmail === trimmedEmail.toLowerCase() ? lookup.data : null;
    const previous = known?.previous ?? [];

    // A new address is a new question: "write again" answered for one address is not an answer
    // for the next.
    useEffect(() => setSendAgain(false), [lookupEmail]);

    const request = fields && { ...fields, name, locale };
    const debounced = useDebouncedValue(JSON.stringify(request), 500);
    const { mutate: renderPreview } = preview;
    useEffect(() => {
        const body = JSON.parse(debounced);
        if (!body?.letter) return;
        renderPreview(body);
    }, [debounced, renderPreview]);

    const blocked = !!known?.doNotContact;
    const needsConfirm = previous.length > 0 && !sendAgain;
    const canSend = validEmail && !!fields?.letter?.trim() && !!fields?.subject?.trim()
        && !blocked && !needsConfirm && !send.isPending;

    const submit = () => {
        send.mutate(
            { ...request, email: trimmedEmail, sendAgain },
            {
                onSuccess: () => {
                    showToast(t('adminOutreach.sent'), 'success');
                    // The letter stays — the next person is often written to in the same words.
                    setEmail('');
                    setName('');
                    setSendAgain(false);
                },
                onError: (error) => showToast(describeError(error, t('adminOutreach.sendFailed')), 'error'),
            },
        );
    };

    return (
        <PageShell>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <AdminNav current="outreach" />
                <h1 className="text-xl sm:text-2xl font-bold mb-2">{t('adminOutreach.title')}</h1>
                <p className="text-text-secondary mb-6 max-w-[760px]">{t('adminOutreach.intro')}</p>

                <section className="bg-surface border border-border-light rounded-lg p-4 sm:p-6 mb-8">
                    <div className="grid gap-3 sm:grid-cols-2 mb-3">
                        <Input
                            label={t('adminOutreach.emailLabel')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            dir="ltr"
                            required
                            field="email"
                        />
                        <Input
                            label={t('adminOutreach.nameLabel')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={200}
                            field="name"
                        />
                    </div>

                    {/* What is known about the address, before the press rather than after it. */}
                    {known && (
                        <div className="flex flex-col gap-2 mb-4 text-sm">
                            {known.doNotContact && (
                                <p className="flex gap-2 items-start text-red-600">
                                    <Ban size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>
                                        {t('adminOutreach.onDoNotContact')}
                                        {known.doNotContactNote ? ` — ${known.doNotContactNote}` : ''}
                                    </span>
                                </p>
                            )}
                            {known.registered && (
                                <p className="flex gap-2 items-start text-text-secondary">
                                    <UserCheck size={16} className="flex-shrink-0 mt-0.5" />
                                    {t('adminOutreach.registered')}
                                </p>
                            )}
                            {previous.length > 0 && !known.doNotContact && (
                                <div className="flex gap-2 items-start p-3 rounded-lg border border-border bg-surface-hover">
                                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-gold" />
                                    <div className="flex flex-col gap-1">
                                        <span>{t('adminOutreach.alreadyWritten')}</span>
                                        <ul className="text-text-muted text-xs">
                                            {previous.map((row) => (
                                                <li key={row.id}>
                                                    {t('adminOutreach.previousRow', {
                                                        when: formatMoment(row.sentAt),
                                                        by: row.sentByUsername ?? `#${row.sentByUserId}`,
                                                        subject: row.subject,
                                                    })}
                                                </li>
                                            ))}
                                        </ul>
                                        <label className="flex gap-2 items-center mt-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={sendAgain}
                                                onChange={(e) => setSendAgain(e.target.checked)}
                                            />
                                            {t('adminOutreach.sendAgain')}
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <fieldset className="mb-4 border-0 p-0 m-0">
                        <legend className="text-sm font-semibold mb-2 p-0">{t('admin.invite.localeLabel')}</legend>
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
                                        name="outreach-locale"
                                        className="sr-only"
                                        checked={locale === option.code}
                                        onChange={() => setLocale(option.code)}
                                    />
                                    {option.nativeName}
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className="mb-5 border-0 p-0 m-0">
                        <legend className="text-sm font-semibold mb-2 p-0">{t('adminOutreach.starterLabel')}</legend>
                        <div className="flex gap-2 flex-wrap">
                            {list.map((starter) => (
                                <button
                                    key={starter.starter}
                                    type="button"
                                    onClick={() => pickStarter(starter)}
                                    aria-pressed={fields?.starter === starter.starter}
                                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                                        fields?.starter === starter.starter
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border-light hover:bg-surface-hover'}`}
                                >
                                    {t(`adminOutreach.starters.${starter.starter}`)}
                                </button>
                            ))}
                        </div>
                        {edited && <p className="text-text-muted text-xs mt-2">{t('adminOutreach.edited')}</p>}
                    </fieldset>

                    {fields && (
                        <LetterEditor
                            subject={fields.subject}
                            onSubjectChange={setField('subject')}
                            letter={fields.letter}
                            onLetterChange={setField('letter')}
                            locale={locale}
                            placeholders={starters.data?.placeholders}
                            preview={preview}
                            onReset={() => { setFields(seededFrom.current); }}
                            canReset={!!edited}
                            error={send.error}
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Input
                                    label={t('adminOutreach.buttonLabel')}
                                    value={fields.buttonLabel ?? ''}
                                    onChange={(e) => setField('buttonLabel')(e.target.value)}
                                    dir={LOCALES[locale]?.dir ?? 'rtl'}
                                    maxLength={80}
                                    field="buttonLabel"
                                />
                                <Input
                                    label={t('adminOutreach.pathLabel')}
                                    value={fields.path ?? ''}
                                    onChange={(e) => setField('path')(e.target.value)}
                                    dir="ltr"
                                    maxLength={300}
                                    field="path"
                                />
                            </div>
                            <p className="text-text-muted text-xs -mt-1">{t('adminOutreach.pathHint')}</p>
                        </LetterEditor>
                    )}
                    {starters.isError && (
                        <p className="text-red-600 text-sm">
                            {describeError(starters.error, t('admin.invite.draftFailed'))}
                        </p>
                    )}

                    <div className="flex justify-end mt-5">
                        <Button onClick={submit} disabled={!canSend} icon={<Mail size={14} />}>
                            {t('adminOutreach.send')}
                        </Button>
                    </div>
                </section>

                <SentLog />
                <DoNotContactSection />

                <ConfirmDialog
                    open={!!replacing}
                    title={t('adminOutreach.replaceTitle')}
                    body={t('adminOutreach.replaceConfirm')}
                    confirmLabel={t('adminOutreach.replaceAction')}
                    onConfirm={() => applyStarter(replacing)}
                    onClose={() => setReplacing(null)}
                />
            </div>
        </PageShell>
    );
}

function SentLog() {
    const [page, setPage] = useState(0);
    const { data, isLoading } = useOutreachLog(page);
    const rows = data?.content ?? [];
    return (
        <section className="mb-8">
            <h2 className="text-lg font-bold mb-3">{t('adminOutreach.logTitle')}</h2>
            {isLoading ? (
                <p className="text-text-muted text-sm">{t('common.loading')}</p>
            ) : rows.length === 0 ? (
                <p className="text-text-muted text-sm">{t('adminOutreach.logEmpty')}</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {rows.map((row) => (
                        <li key={row.id} className="bg-surface border border-border-light rounded-lg p-3 text-sm">
                            <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                                <span dir="ltr" className="font-semibold">{row.recipientEmail}</span>
                                {row.recipientName && <span>{row.recipientName}</span>}
                                <span className="text-text-muted text-xs">
                                    {t('adminOutreach.logMeta', {
                                        when: formatMoment(row.sentAt),
                                        by: row.sentByUsername ?? `#${row.sentByUserId}`,
                                        locale: LOCALES[row.locale]?.nativeName ?? row.locale,
                                    })}
                                    {row.starter ? ` · ${t(`adminOutreach.starters.${row.starter}`)}` : ''}
                                </span>
                            </div>
                            <p className="text-text-secondary mt-1">{row.subject}</p>
                        </li>
                    ))}
                </ul>
            )}
            <Pager
                page={data?.currentPage ?? page}
                totalPages={data?.totalPages ?? 0}
                hasPrevious={data?.hasPrevious ?? page > 0}
                hasNext={data?.hasNext ?? false}
                onChange={setPage}
                className="mt-3"
            />
        </section>
    );
}

function DoNotContactSection() {
    const { showToast } = useToast();
    const [page, setPage] = useState(0);
    const [email, setEmail] = useState('');
    const [note, setNote] = useState('');
    const { data } = useDoNotContact(page);
    const add = useAddDoNotContact();
    const remove = useRemoveDoNotContact();
    const rows = data?.content ?? [];

    const submit = () =>
        add.mutate(
            { email: email.trim(), note: note.trim() },
            {
                onSuccess: () => {
                    showToast(t('adminOutreach.dncAdded'), 'success');
                    setEmail('');
                    setNote('');
                },
                onError: (error) => showToast(describeError(error, t('adminOutreach.dncFailed')), 'error'),
            },
        );

    const [unlisting, setUnlisting] = useState(null);
    const confirmUnlist = () => {
        remove.mutate(unlisting, {
            onSuccess: () => setUnlisting(null),
            onError: (error) => showToast(describeError(error, t('adminOutreach.dncFailed')), 'error'),
        });
    };

    return (
        <section>
            <h2 className="text-lg font-bold mb-1">{t('adminOutreach.dncTitle')}</h2>
            <p className="text-text-secondary text-sm mb-3 max-w-[760px]">{t('adminOutreach.dncIntro')}</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end mb-4">
                <Input
                    label={t('adminOutreach.emailLabel')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    dir="ltr"
                />
                <Input
                    label={t('adminOutreach.dncNote')}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                />
                <Button onClick={submit} disabled={!EMAIL.test(email.trim()) || add.isPending} icon={<Ban size={14} />}>
                    {t('adminOutreach.dncAdd')}
                </Button>
            </div>
            {rows.length === 0 ? (
                <p className="text-text-muted text-sm">{t('adminOutreach.dncEmpty')}</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {rows.map((row) => (
                        <li
                            key={row.email}
                            className="bg-surface border border-border-light rounded-lg p-3 text-sm flex flex-wrap gap-3 items-center justify-between"
                        >
                            <div className="flex flex-col">
                                <span dir="ltr" className="font-semibold">{row.email}</span>
                                <span className="text-text-muted text-xs">
                                    {t('adminOutreach.dncMeta', {
                                        when: formatMoment(row.addedAt),
                                        by: row.addedByUsername ?? `#${row.addedByUserId}`,
                                    })}
                                    {row.note ? ` — ${row.note}` : ''}
                                </span>
                            </div>
                            <Button variant="ghost" onClick={() => setUnlisting(row.email)} disabled={remove.isPending}>
                                {t('adminOutreach.dncRemove')}
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
            <Pager
                page={data?.currentPage ?? page}
                totalPages={data?.totalPages ?? 0}
                hasPrevious={data?.hasPrevious ?? page > 0}
                hasNext={data?.hasNext ?? false}
                onChange={setPage}
                className="mt-3"
            />
            <ConfirmDialog
                open={!!unlisting}
                title={t('adminOutreach.dncRemove')}
                body={t('adminOutreach.dncRemoveConfirm')}
                confirmLabel={t('adminOutreach.dncRemove')}
                danger
                pending={remove.isPending}
                onConfirm={confirmUnlist}
                onClose={() => setUnlisting(null)}
            />
        </section>
    );
}
