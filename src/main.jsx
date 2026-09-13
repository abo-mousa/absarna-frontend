import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { initTelemetry } from './lib/telemetry'
import './index.css'

// BEFORE React mounts, so an error thrown during the very first render is captured. It is a no-op
// unless VITE_FARO_URL is set, so development and any unconfigured deploy are unaffected.
initTelemetry()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
