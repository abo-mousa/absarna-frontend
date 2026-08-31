import api from './client';

export const fetchContents = async ({ pageParam = 0, queryKey }) => {
    const [, { search, category, size }] = queryKey;

    let url = `/contents?page=${pageParam}&size=${size || 12}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;

    const res = await api.get(url);
    return res.data;
};

export const getCategories = () => api.get('/categories');

export const searchContents = (query, page = 0, size = 12) =>
    api.get(`/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);

export const getContentById = (id) => api.get(`/contents/${id}`);

export const getFeatured = () => api.get('/contents/featured');

export const getRelatedContent = (id, limit = 6) => api.get(`/contents/${id}/related?limit=${limit}`);

// Bounded, non-infinite home feed: channels you follow + more in your topics + a few
// featured picks. Not paginated on purpose — a fixed snapshot, not an endless stream.
export const getFeed = () => api.get('/feed');
