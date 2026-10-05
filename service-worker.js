const CACHE_NAME = 'zerox-store-v10';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './hero-main.png',
  './character.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Private API responses must never be stored or replayed offline.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || event.request.headers.has('Authorization')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          if(response.ok && !/no-store|private/i.test(response.headers.get('Cache-Control')||'')) cache.put(event.request, copy);
        });

        return response;
      })
      .catch(() =>
        caches.match(event.request).then(
          response => response || caches.match('./index.html')
        )
      )
  );
});
