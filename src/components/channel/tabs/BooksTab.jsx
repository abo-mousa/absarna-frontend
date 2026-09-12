import { useState } from 'react';
import { Input } from '@/components/ui';
import ContentPublishForm from '../ContentPublishForm';
import ManagedContentList from './ManagedContentList';
import { useChannelContentTab } from '@/hooks/useChannelContentTab';
import { useChannelUpload } from '@/hooks/useChannelUpload';
import { acceptAttribute } from '@/hooks/usePresignedUpload';
import { stripEmpty } from '@/lib/forms';
import { t } from '@/i18n';

const EMPTY_FORM = {
    title: '', description: '', pdfUrl: '', uploadSessionId: '', previewImageUrl: '',
    category: '', originalPublishDate: '', pages: '',
};

/**
 * Books use the same presigned front door as video — the backend differs only by allowlist and size
 * cap. Unlike video there is no transcode afterwards: the PDF is readable the moment the create
 * call confirms it.
 */
export default function BooksTab({ slug, active }) {
    const content = useChannelContentTab(slug, 'books', active);
    const upload = useChannelUpload(slug, 'books');
    const [form, setForm] = useState(EMPTY_FORM);

    const field = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const handleFileSelect = (e) => upload.selectFile(e, {
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
            },
        });
    };

    return (
        <div className="grid gap-6">
            <ContentPublishForm
                heading={t('channelManage.forms.book.heading')}
                onSubmit={handleSubmit}
                submitLabel={t('channelManage.forms.book.submit')}
                file={{
                    label: t('channelManage.forms.book.fileLabel'),
                    hint: t('channelManage.forms.book.fileHint'),
                    accept: acceptAttribute('books'),
                    onChange: handleFileSelect,
                    uploading: upload.uploading,
                    progress: upload.progress,
                }}
            >
                <Input label={t('fields.title')} value={form.title} onChange={field('title')} required />
                <Input label={t('fields.description')} textarea rows={3} value={form.description} onChange={field('description')} />

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                    <Input label={t('fields.category')} value={form.category} onChange={field('category')} />
                    <Input label={t('channelManage.forms.book.pagesLabel')} type="number" value={form.pages} onChange={field('pages')} />
                </div>
                <Input label={t('fields.originalPublishDateOptional')} type="date" value={form.originalPublishDate} onChange={field('originalPublishDate')} />
            </ContentPublishForm>

            <ManagedContentList
                type="books"
                heading={t('channelManage.forms.book.listHeading', { count: content.items.length })}
                content={content}
            />
        </div>
    );
}
