import { API_BASE_URL } from '../env';

// Last-chance, fire-and-forget POST for progress flushes on page unload (hard refresh, tab/
// browser close, hard navigation) — cases where a component never gets a React unmount and a
// normal axios/XHR call gets cancelled mid-flight by the browser before it can complete.
// `keepalive` tells the browser to still attempt the request after the page starts tearing
// down. It's still just one best-effort network attempt (no retry, and it won't fire at all if
// the tab is killed outright) — the periodic in-app checkpoint this backs up is what bounds
// worst-case data loss, not this.
export function flushOnUnload(path, body) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        fetch(`${API_BASE_URL}/api${path}`, {
            method: 'POST',
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        }).catch(() => {});
    } catch {
        // keepalive fetch can throw synchronously if the body exceeds the browser's keepalive
        // payload cap — not a concern for these few-byte bodies, but never let it disrupt unload.
    }
}
