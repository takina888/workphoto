const CACHE_PREFIX = 'work-photo-';
const CACHE = `${CACHE_PREFIX}v1.6-web-finish`;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './work-series.css',
  './market-base-integration.css',
  './db.js',
  './xlsx.js',
  './app.js',
  './manifest.webmanifest',
  './assets/app-icon.svg',
  './assets/app-icon-192.png',
  './assets/app-icon-512.png',
  './editor/index.html',
  './editor/style.css',
  './editor/integration.css',
  './editor/db.js',
  './editor/app.js',
  './editor/manifest.json',
  './editor/icons/icon-192.png',
  './editor/icons/icon-512.png',
  './editor/demo/sample-photo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        const direct = await caches.match(request, { ignoreSearch: true });
        if (direct) return direct;
        const editorRoute = url.pathname.includes('/editor/');
        return caches.match(editorRoute ? './editor/index.html' : './index.html');
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
