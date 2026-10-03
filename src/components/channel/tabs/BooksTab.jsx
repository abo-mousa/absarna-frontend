import { useRef, useState } from 'react';
import { BookPlus } from 'lucide-react';
import { Button, ConfirmDialog, Input, Modal } from '@/components/ui';
import ContentPublishForm from '../ContentPublishForm';
import ManagedContentList from './ManagedContentList';
import { useChannelContentTab } from '@/hooks/useChannelContentTab';
import { useChannelUpload } from '@/hooks/useChannelUpload';
import { acceptAttribute } from '@/hooks/usePresignedUpload';
import { stripEmpty } from '@/lib/forms';
import { useChannel } from '@/hooks/useChannels';
import SubjectPicker from '@/components/content/SubjectPicker';
import CategoryField from '../CategoryField';
import { countPdfPages } from '@/lib/pdfPages';
import { t } from '@/i18n';

const EMPTY_FORM = {
    title: '', description: '', pdfUrl: '', uploadSessionId: '', previewImageUrl: '',
    category: '', subject: '', originalPublishDate: '', pages: '',
};

/**
 * Books use the same presigned front door as video — the backend differs only by allowlist and size
 * cap. Unlike video there is no transcode afterwards: the PDF is readable the moment the create
 * call confirms it.
 *
 * <p>The tab opens onto the list; the form is a dialog behind «إضافة كتاب», like the videos
 * section. The upload runs in this component's state, so closing the dialog mid-upload loses
 * nothing — the button shows the progress and reopening shows the form as it was left.
 */
export default function BooksTab({ slug, active }) {
    // Cached by the dashboard already: only for the subject the channel gives its books by default.
    const { data: channel } = useChannel(slug, active);
    const content = useChannelContentTab(slug, 'books', active);
    const upload = useChannelUpload(slug, 'books');
    const [form, setForm] = useState(EMPTY_FORM);
    const [adding, setAdding] = useState(false);
    // 'idle' | 'counting' | 'counted' | 'failed' — the page count read from the picked file.
    const [pageCount, setPageCount] = useState('idle');
    // Which pick a count belongs to: a second file chosen while the first is still being counted
    // must not have the first file's number land on it.
    const pickRef = useRef(0);

    const field = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const pick = ++pickRef.current;
            setPageCount('counting');
            setForm((current) => ({ ...current, pages: '' }));
            countPdfPages(file).then((pages) => {
                if (pick !== pickRef.current) return;
                setPageCount(pages ? 'counted' : 'failed');
                if (pages) setForm((current) => ({ ...current, pages: String(pages) }));
            });
        }
        return uploadFile(e);
    };

    const uploadFile = (e) => upload.selectFile(e, {
        failureMessage: (reason) => t('channelManage.forms.book.uploadFailed', { reason }),
        onUploaded: (uploadSessionId, fallbackTitle) => setForm((current) => ({
            ...current,
            // pdfUrl stays empty — the create request rejects a payload carrying both a pdfUrl and
            // an uploadSessionId. Preview image and page count came from the old server-side PDF
            // processing, which went away with the upload module; a book reads fine without either.
            pdfUrl: '',
            uploadSessionId,
            title: current.title || fallbackTitle,
        })),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        content.publish(stripEmpty(form), {
            action: t('channelManage.forms.book.action'),
            successMessage: t('channelManage.forms.book.published'),
            onSuccess: () => {
                upload.forget();
                setForm(EMPTY_FORM);
                pickRef.current += 1;
                setPageCount('idle');
                setAdding(false);
            },
        });
    };

    return (
        <div className="grid grid-cols-1 gap-6">
            <ConfirmDialog {...content.confirmDialog} />
            <ConfirmDialog {...upload.confirmDialog} />
            <Modal open={adding} onClose={() => setAdding(false)} title={t('channelManage.forms.book.heading')} maxWidth="640px">
                <ContentPublishForm
                    bare
                    heading={t('channelManage.forms.book.heading')}
                    onSubmit={handleSubmit}
                    submitLabel={t('channelManage.forms.book.submit')}
                    submitting={content.isPublishing}
                    error={content.publishError}
                    file={{
                        label: t('channelManage.forms.book.fileLabel'),
                        hint: t('channelManage.forms.book.fileHint'),
                        accept: acceptAttribute('books'),
                        onChange: handleFileSelect,
                        uploading: upload.uploading,
                        progress: upload.progress,
                        fileName: upload.fileName,
                    }}
                >
                    <Input label={t('fields.title')} value={form.title} onChange={field('title')} field="title" required />
                    <Input label={t('fields.description')} textarea rows={3} value={form.description} onChange={field('description')} field="description" />

                    {/* Read from the file; asked for only when the file would not say. */}
                    {pageCount === 'counting' && <p className="text-sm text-text-muted">{t('channelManage.forms.book.pagesCounting')}</p>}
                    {pageCount === 'counted' && (
                        <p className="text-sm text-text-secondary">{t('channelManage.forms.book.pagesCounted', { pages: form.pages })}</p>
                    )}
                    {pageCount === 'failed' && (
                        <Input label={t('channelManage.forms.book.pagesLabel')} type="number" min="1" value={form.pages} onChange={field('pages')} field="pages" />
                    )}
                    <CategoryField id="book-category" kind="books" value={form.category} onChange={field('category')} />
                    <SubjectPicker
                        id="book-subject"
                        value={form.subject || null}
                        onChange={(subject) => setForm((current) => ({ ...current, subject: subject || '' }))}
                        inherited={channel?.defaultSubject ? { code: channel.defaultSubject, from: 'channel' } : null}
                    />
                    <Input label={t('fields.originalPublishDateOptional')} type="date" value={form.originalPublishDate} onChange={field('originalPublishDate')} field="originalPublishDate" />
                </ContentPublishForm>
            </Modal>

            <ManagedContentList
                searchable
                searchPlaceholder={t('channelManage.searchBooks')}
                type="books"
                heading={t('channelManage.forms.book.listHeading', { count: content.totalItems })}
                content={content}
                action={(
                    <Button size="sm" icon={<BookPlus size={16} />} onClick={() => setAdding(true)}>
                        {upload.uploading
                            ? t('channelManage.forms.uploadingProgress', { progress: upload.progress })
                            : t('channelManage.forms.book.heading')}
                    </Button>
                )}
                // Readable the moment it is created: a book has no pipeline step after confirm.
                getHref={(book) => `/books/${book.id}`}
            />
        </div>
    );
}
