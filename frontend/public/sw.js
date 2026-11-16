// LingkodBrgyAi Progressive Web App Service Worker
const CACHE_NAME = 'lingkodbrgyai-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo.png'
];

// Install Event - Cache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[LingkodBrgyAi SW] Pre-caching offline app shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean Up Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[LingkodBrgyAi SW] Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate for Assets, Network-First for APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Do not intercept non-GET requests or WebSocket connections
  if (event.request.method !== 'GET' || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Network-First for API requests with safe fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true, message: 'Network offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Stale-while-revalidate for static assets & HTML navigation (guaranteed valid Response)
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      } catch {
        if (cachedResponse) return cachedResponse;
        if (event.request.mode === 'navigate') {
          const appShell = await caches.match('/index.html');
          if (appShell) return appShell;
        }
        return new Response('Network offline', { status: 503, statusText: 'Offline' });
      }
    })()
  );
});
