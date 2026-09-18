import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
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
    // The tab opens onto the list; the form is a dialog, like the videos section.
    const [adding, setAdding] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        content.publish(stripEmpty(form), {
            action: t('channelManage.forms.post.submit'),
            successMessage: t('channelManage.forms.post.published'),
            onSuccess: () => {
                setForm(EMPTY_FORM);
                setAdding(false);
            },
        });
    };

    return (
        <div className="grid gap-6">
            <Modal open={adding} onClose={() => setAdding(false)} title={t('channelManage.forms.post.heading')} maxWidth="560px">
                <ContentPublishForm
                    bare
                    heading={t('channelManage.forms.post.heading')}
                    onSubmit={handleSubmit}
                    submitLabel={t('channelManage.forms.post.submit')}
                    submitting={content.isPublishing}
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
            </Modal>

            <ManagedContentList
                searchable
                searchPlaceholder={t('channelManage.searchPosts')}
                type="posts"
                heading={t('channelManage.forms.post.listHeading', { count: content.totalItems })}
                content={content}
                action={(
                    <Button size="sm" icon={<MessageSquarePlus size={16} />} onClick={() => setAdding(true)}>
                        {t('channelManage.forms.post.heading')}
                    </Button>
                )}
                editable={false}
                getLabel={(item) => item.content?.length > 60 ? `${item.content.substring(0, 60)}...` : item.content}
            />
        </div>
    );
}
