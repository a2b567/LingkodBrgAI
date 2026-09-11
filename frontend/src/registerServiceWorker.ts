// Auto-register service worker for PWA support
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[LingkodBrgyAi PWA] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[LingkodBrgyAi PWA] Service Worker registration failed:', error);
        });
    });
  }
}
