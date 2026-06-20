const CACHE_NAME = 'panel-verificador-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(PRECACHE_URLS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;

  /* Solo GET; deja pasar todo lo demás (POST al backend, etc.) sin intervenir */
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  /* No cachear llamadas al backend (Google Apps Script) ni a fuentes externas:
     siempre red, sin pasar por el cache */
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(req).catch(function () { return caches.match(req); }));
    return;
  }

  /* Recursos propios de la app: network-first con respaldo en cache (offline) */
  event.respondWith(
    fetch(req)
      .then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        return response;
      })
      .catch(function () { return caches.match(req).then(function (cached) { return cached || caches.match('./index.html'); }); })
  );
});
