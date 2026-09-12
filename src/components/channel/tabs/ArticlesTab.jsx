import { useState } from 'react';
import { Input } from '@/components/ui';
import ContentPublishForm from '../ContentPublishForm';
import ManagedContentList from './ManagedContentList';
import { useChannelContentTab } from '@/hooks/useChannelContentTab';
import { stripEmpty } from '@/lib/forms';
import { t } from '@/i18n';

const EMPTY_FORM = { title: '', content: '', category: '', originalPublishDate: '' };

export default function ArticlesTab({ slug, active }) {
    const content = useChannelContentTab(slug, 'articles', active);
    const [form, setForm] = useState(EMPTY_FORM);

    const field = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        content.publish(stripEmpty(form), {
            action: t('channelManage.forms.article.submit'),
            successMessage: t('channelManage.forms.article.published'),
            onSuccess: () => setForm(EMPTY_FORM),
        });
    };

    return (
        <div className="grid gap-6">
            <ContentPublishForm
                heading={t('channelManage.forms.article.heading')}
                onSubmit={handleSubmit}
                submitLabel={t('channelManage.forms.article.submit')}
            >
                <Input label={t('fields.title')} value={form.title} onChange={field('title')} required />
                <Input label={t('fields.content')} textarea rows={15} className="min-h-[300px]" value={form.content} onChange={field('content')} required />

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                    <Input label={t('fields.category')} value={form.category} onChange={field('category')} />
                    <Input label={t('fields.originalPublishDateOptional')} type="date" value={form.originalPublishDate} onChange={field('originalPublishDate')} />
                </div>
            </ContentPublishForm>

            <ManagedContentList
                type="articles"
                heading={t('channelManage.forms.article.listHeading', { count: content.items.length })}
                content={content}
            />
        </div>
    );
}
