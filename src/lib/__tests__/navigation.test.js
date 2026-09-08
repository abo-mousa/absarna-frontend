import { describe, it, expect } from 'vitest';
import { isProtectedPath, safeInternalPath } from '../navigation';

/**
 * Both halves of the post-login return-to, which is the one place this app turns a value it was
 * handed into a navigation.
 */
describe('safeInternalPath', () => {
    it('accepts a root-relative path, query and hash included', () => {
        expect(safeInternalPath('/history')).toBe('/history');
        // Query kept intact — a bounced /search must come back with what was searched for.
        expect(safeInternalPath('/search?q=%D8%B3%D9%88%D8%B1%D8%A9'))
            .toBe('/search?q=%D8%B3%D9%88%D8%B1%D8%A9');
        expect(safeInternalPath('/channel/abc/manage')).toBe('/channel/abc/manage');
    });

    it('rejects anything that could leave the origin', () => {
        // A protocol-relative URL: browsers read this as https://evil.example, so navigating to
        // it is an open redirect even though it starts with a slash.
        expect(safeInternalPath('//evil.example')).toBeNull();
        // Browsers normalise the backslash to a slash, so this is the same attack spelled around
        // a naive startsWith('//') check.
        expect(safeInternalPath('/\\evil.example')).toBeNull();
        expect(safeInternalPath('https://evil.example')).toBeNull();
        expect(safeInternalPath('javascript:alert(1)')).toBeNull();
        // A scheme smuggled into the first segment.
        expect(safeInternalPath('/javascript:alert(1)')).toBeNull();
    });

    it('rejects anything that is not a usable string, so the caller falls back to /', () => {
        expect(safeInternalPath(undefined)).toBeNull();
        expect(safeInternalPath(null)).toBeNull();
        expect(safeInternalPath('')).toBeNull();
        expect(safeInternalPath('history')).toBeNull();
        expect(safeInternalPath(42)).toBeNull();
    });
});

describe('isProtectedPath', () => {
    it('matches the routes App.jsx actually guards', () => {
        expect(isProtectedPath('/history')).toBe(true);
        expect(isProtectedPath('/bookmarks')).toBe(true);
        expect(isProtectedPath('/admin/channels')).toBe(true);
        expect(isProtectedPath('/channel/my-slug/manage')).toBe(true);
    });

    it('does not match public pages a visitor may keep reading when their session expires', () => {
        // This is the whole point of the list: an expired session on a public page clears state
        // and toasts, rather than throwing the reader off the article they were reading.
        expect(isProtectedPath('/')).toBe(false);
        expect(isProtectedPath('/video/12')).toBe(false);
        expect(isProtectedPath('/channel/my-slug')).toBe(false);
        expect(isProtectedPath('/search?q=x')).toBe(false);
    });

    it('does not match a public path that merely starts like a guarded one', () => {
        expect(isProtectedPath('/historical-notes')).toBe(false);
        expect(isProtectedPath('/profiles')).toBe(false);
    });

    it('is safe with a non-string', () => {
        expect(isProtectedPath(undefined)).toBe(false);
        expect(isProtectedPath(null)).toBe(false);
    });
});
