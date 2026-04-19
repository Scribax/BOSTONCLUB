// Boston Club Service Worker v2
// Passes ALL API calls directly - never caches them

const CACHE_NAME = 'boston-club-v2';
const OLD_CACHES = ['boston-club-v1'];

self.addEventListener('install', (event) => {
  // Take control immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => OLD_CACHES.includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // ✅ ALWAYS bypass SW for ANY API port or path - let browser handle directly  
  if (
    url.includes(':8080') ||
    url.includes('/api/') ||
    url.includes('localhost:8080')
  ) {
    // Don't call event.respondWith - let the browser handle it natively
    return;
  }

  // For all other requests, network first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
