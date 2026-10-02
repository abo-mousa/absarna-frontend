import { describe, expect, it } from 'vitest';
import { suggestEmail } from '@/lib/emailTypo';

describe('suggestEmail', () => {
    it.each([
        ['sara@gmial.com', 'sara@gmail.com'],
        ['sara@gmail.con', 'sara@gmail.com'],
        ['sara@gmailcom', 'sara@gmail.com'],
        ['sara@gmail', 'sara@gmail.com'],
        ['Sara.Ali@Hotmial.com', 'Sara.Ali@hotmail.com'],
        ['sara@hotnail.cmo', 'sara@hotmail.com'],
        ['sara@yaho.com', 'sara@yahoo.com'],
        ['sara@outlok.com', 'sara@outlook.com'],
        ['sara@icloud.co', 'sara@icloud.com'],
    ])('suggests %s → %s', (typed, meant) => {
        expect(suggestEmail(typed)).toBe(meant);
    });

    // A real domain near a popular one is somebody's address, not a typo.
    it.each(['sara@mail.com', 'sara@ymail.com', 'sara@gmail.com', 'sara@me.com', 'sara@gmx.com'])(
        'leaves the real domain %s alone', (address) => {
            expect(suggestEmail(address)).toBeNull();
        },
    );

    it.each(['', 'sara', 'sara@', '@gmail.com', 'sara@absarna.com', 'sara@university.edu.sa'])(
        'has nothing to say about %s', (address) => {
            expect(suggestEmail(address)).toBeNull();
        },
    );
});
