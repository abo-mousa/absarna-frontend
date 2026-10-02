import { Input } from '@/components/ui';
import { useCategories } from '@/hooks/useVideos';
import { useBookCategories } from '@/hooks/useBooks';
import { t } from '@/i18n';

/** The suggestions for one kind, each its own component so only that kind's list is fetched. */
function Options({ id, categories = [] }) {
    return (
        <datalist id={id}>
            {categories.map((c) => <option key={c} value={c} />)}
        </datalist>
    );
}
const VideoOptions = ({ id }) => <Options id={id} categories={useCategories().data} />;
const BookOptions = ({ id }) => <Options id={id} categories={useBookCategories().data} />;

/**
 * A video's or a book's category, offering the ones already in use for that kind.
 *
 * <p>Free text, because it is a topic chip readers browse by and the list is the catalogue's own.
 * Typed without suggestions, every upload spelled it a little differently («تفسير», «التفسير»,
 * «تفسير القرآن») and each spelling became a chip of its own; the suggestions are what keep one.
 */
function CategoryField({ id, value, onChange, kind = 'videos' }) {
    const listId = `${id}-options`;
    return (
        <div>
            <Input label={t('fields.category')} value={value} onChange={onChange} field="category" list={listId} autoComplete="off" />
            {kind === 'books' ? <BookOptions id={listId} /> : <VideoOptions id={listId} />}
            <p className="text-xs text-text-muted mt-1">{t('channelManage.categoryHint')}</p>
        </div>
    );
}

export default CategoryField;
