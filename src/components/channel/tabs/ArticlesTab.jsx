import { useState } from 'react';
import { PenLine } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import ContentPublishForm from '../ContentPublishForm';
import ManagedContentList from './ManagedContentList';
import { useChannelContentTab } from '@/hooks/useChannelContentTab';
import { stripEmpty } from '@/lib/forms';
import { t } from '@/i18n';

const EMPTY_FORM = { title: '', content: '', category: '', originalPublishDate: '' };

export default function ArticlesTab({ slug, active }) {
    const content = useChannelContentTab(slug, 'articles', active);
    const [form, setForm] = useState(EMPTY_FORM);
    // The tab opens onto the list; the form is a dialog, like the videos section.
    const [adding, setAdding] = useState(false);

    const field = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        content.publish(stripEmpty(form), {
            action: t('channelManage.forms.article.submit'),
            successMessage: t('channelManage.forms.article.published'),
            onSuccess: () => {
                setForm(EMPTY_FORM);
                setAdding(false);
            },
        });
    };

    return (
        <div className="grid gap-6">
            <Modal open={adding} onClose={() => setAdding(false)} title={t('channelManage.forms.article.heading')} maxWidth="800px">
                <ContentPublishForm
                    bare
                    heading={t('channelManage.forms.article.heading')}
                    onSubmit={handleSubmit}
                    submitLabel={t('channelManage.forms.article.submit')}
                    submitting={content.isPublishing}
                    error={content.publishError}
                >
                    <Input label={t('fields.title')} value={form.title} onChange={field('title')} field="title" required />
                    <Input label={t('fields.content')} textarea rows={15} className="min-h-[300px]" value={form.content} onChange={field('content')} field="content" required />

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                        <Input label={t('fields.category')} value={form.category} onChange={field('category')} field="category" />
                        <Input label={t('fields.originalPublishDateOptional')} type="date" value={form.originalPublishDate} onChange={field('originalPublishDate')} field="originalPublishDate" />
                    </div>
                </ContentPublishForm>
            </Modal>

            <ManagedContentList
                searchable
                searchPlaceholder={t('channelManage.searchArticles')}
                type="articles"
                heading={t('channelManage.forms.article.listHeading', { count: content.totalItems })}
                content={content}
                action={(
                    <Button size="sm" icon={<PenLine size={16} />} onClick={() => setAdding(true)}>
                        {t('channelManage.forms.article.heading')}
                    </Button>
                )}
                getHref={(article) => `/articles/${article.id}`}
            />
        </div>
    );
}
