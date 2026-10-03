const CACHE_NAME = 'zerox-store-v9';

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
  // Never cache private APIs, authorized requests, external resources or payment returns.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') ||
      event.request.headers.has('Authorization') || url.search ||
      !/\.(?:css|js|png|jpe?g|webp|gif|svg|ico|woff2?)$/i.test(url.pathname)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response.ok || /no-store|private/i.test(response.headers.get("Cache-Control") || "")) return response;
        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, copy);
        });

        return response;
      })
      .catch(() =>
        caches.match(event.request).then(
          response => response || Response.error()
        )
      )
  );
});
