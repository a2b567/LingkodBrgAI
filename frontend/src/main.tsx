import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './registerServiceWorker'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'
import { api } from './services/api'

// Initialize Progressive Web App capabilities
registerServiceWorker();

// Automatically handle Vite code-splitting chunk mismatches on new deployments
window.addEventListener('vite:preloadError', () => {
  const hasReloaded = sessionStorage.getItem('chunk_reload');
  if (!hasReloaded) {
    sessionStorage.setItem('chunk_reload', 'true');
    window.location.reload();
  }
});

// Global JS error reporter — catches errors that fall outside React's render tree
// (e.g. async callbacks, third-party scripts, unhandled Promise rejections)
window.onerror = (message, source, lineno, colno, error) => {
  api.dev.reportError({
    message: String(message),
    stack: error?.stack || `${source}:${lineno}:${colno}`,
    path: window.location.pathname,
    user_agent: navigator.userAgent,
  }).catch(() => {});
};

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  api.dev.reportError({
    message: reason?.message || String(reason) || 'Unhandled Promise rejection',
    stack: reason?.stack || '',
    path: window.location.pathname,
    user_agent: navigator.userAgent,
  }).catch(() => {});
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)


