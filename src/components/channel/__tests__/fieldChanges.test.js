import { describe, it, expect } from 'vitest';
import { fieldChanges } from '../ContentEditModal';

const FIELDS = ['title', 'description', 'category', 'pages', 'originalPublishDate'];

describe('fieldChanges', () => {
    const item = {
        title: 'Lecture', description: 'About it', category: 'تفسير', pages: 120,
        originalPublishDate: '2020-01-02',
    };
    const untouched = { ...item, pages: '120' };

    it('sends nothing for a form that was not changed', () => {
        expect(fieldChanges(FIELDS, item, untouched)).toEqual({});
    });

    it('sends a changed field by its name', () => {
        expect(fieldChanges(FIELDS, item, { ...untouched, title: 'New' })).toEqual({ title: 'New' });
    });

    // The backend's PATCH skips nulls: `description: null` answered 200 and changed nothing.
    it('sends an emptied optional field as its clear flag, never as null', () => {
        const changes = fieldChanges(FIELDS, item,
            { ...untouched, description: '', category: '  ', pages: '', originalPublishDate: '' });
        expect(changes).toEqual({
            clearDescription: true, clearCategory: true, clearPages: true, clearOriginalPublishDate: true,
        });
    });

    it('sends no flag for a field that was already empty', () => {
        expect(fieldChanges(FIELDS, { ...item, description: null }, { ...untouched, description: '' }))
            .toEqual({});
    });

    // No flag exists for these: the backend refuses a blank one, and the dialog says so.
    it('sends a blanked required field as typed, for the backend to refuse', () => {
        expect(fieldChanges(['title', 'content'], { title: 'A', content: 'Body' }, { title: ' ', content: '' }))
            .toEqual({ title: ' ', content: '' });
    });
});
