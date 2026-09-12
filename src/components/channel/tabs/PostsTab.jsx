import { useState } from 'react';
import { Input } from '@/components/ui';
import ContentPublishForm from '../ContentPublishForm';
import ManagedContentList from './ManagedContentList';
import { useChannelContentTab } from '@/hooks/useChannelContentTab';
import { stripEmpty } from '@/lib/forms';
import { t } from '@/i18n';

const EMPTY_FORM = { content: '' };

/** A post is its own content — there is nothing an editor would open, so the list has no edit. */
export default function PostsTab({ slug, active }) {
    const content = useChannelContentTab(slug, 'posts', active);
    const [form, setForm] = useState(EMPTY_FORM);

    const handleSubmit = (e) => {
        e.preventDefault();
        content.publish(stripEmpty(form), {
            action: t('channelManage.forms.post.submit'),
            successMessage: t('channelManage.forms.post.published'),
            onSuccess: () => setForm(EMPTY_FORM),
        });
    };

    return (
        <div className="grid gap-6">
            <ContentPublishForm
                heading={t('channelManage.forms.post.heading')}
                onSubmit={handleSubmit}
                submitLabel={t('channelManage.forms.post.submit')}
            >
                <Input
                    label={t('fields.content')}
                    textarea
                    rows={4}
                    value={form.content}
                    onChange={(e) => setForm({ content: e.target.value })}
                    required
                />
            </ContentPublishForm>

            <ManagedContentList
                type="posts"
                heading={t('channelManage.forms.post.listHeading', { count: content.items.length })}
                content={content}
                editable={false}
                getLabel={(item) => item.content?.length > 60 ? `${item.content.substring(0, 60)}...` : item.content}
            />
        </div>
    );
}
