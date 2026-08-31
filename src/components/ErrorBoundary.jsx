import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
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
                    <h2>عذراً، حدث خطأ غير متوقع</h2>
                    <p style={{ color: '#64748b' }}>{this.state.error?.message || 'يرجى المحاولة مرة أخرى'}</p>
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
                        إعادة التحميل
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;