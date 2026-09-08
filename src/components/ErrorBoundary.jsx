import { Component } from 'react';
import { t } from '@/i18n';

/**
 * The last resort when a render throws.
 *
 * <p>Two of these are mounted, and they are not the same thing. `main.jsx` wraps the whole app —
 * if that one catches, the router itself is gone and the only honest offer is a reload.
 * `AppRoutes` mounts a second one *inside* the router, keyed on the pathname, so a page component
 * that throws takes down only its own route: the shell survives, "back home" is a real
 * navigation rather than a full reload, and moving to another route clears the boundary.
 *
 * <p><b>The raw message is no longer rendered.</b> It used to be, and a thrown error's message is
 * whatever produced it — an axios message carrying a URL, a stack fragment, a backend string.
 * None of it is useful to a reader, all of it is English in an Arabic UI, and some of it leaks
 * internals. It goes to `console.error` instead, which is where a developer looks anyway.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    componentDidUpdate(prevProps) {
        // `resetKey` is the route path for the in-router boundary. Without this, one thrown
        // render latches the boundary for the life of the tab and every later navigation renders
        // the error page — the whole app looks permanently broken after a single bad page.
        if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
            this.setState({ hasError: false });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    fontFamily: 'Amiri, Inter, sans-serif',
                    direction: 'rtl'
                }}>
                    <h2>{t('errorBoundary.title')}</h2>
                    {/* The catalog's own wording, never `error.message` — see the class doc. */}
                    <p style={{ color: '#64748b' }}>{t('errorBoundary.fallback')}</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        {this.props.action}
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '12px 24px',
                                background: '#1a56db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontFamily: 'inherit'
                            }}
                        >
                            {t('errorBoundary.reload')}
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
