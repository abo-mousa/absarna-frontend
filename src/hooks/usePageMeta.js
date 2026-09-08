import { useEffect } from 'react';
import { t } from '@/i18n';

const DEFAULT_TITLE = t('meta.defaultTitle');
const DEFAULT_DESCRIPTION = t('meta.defaultDescription');
const DEFAULT_IMAGE = '/favicon.svg';

function setMeta(attr, key, value) {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', value);
}

function applyMeta(title, description, image) {
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
}

// Sets document.title plus OG/Twitter meta for the current page, restoring the app-wide
// default on unmount — every page other than the fallback 404 renders the default title for
// every route/history entry/shared link otherwise (see CLAUDE.md's UX review).
export function usePageMeta({ title, description, image } = {}) {
    useEffect(() => {
        applyMeta(
            title ? t('meta.titleSuffix', { title }) : DEFAULT_TITLE,
            description || DEFAULT_DESCRIPTION,
            image || DEFAULT_IMAGE
        );
        return () => applyMeta(DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_IMAGE);
    }, [title, description, image]);
}
