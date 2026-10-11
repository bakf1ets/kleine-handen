// Offline shell. Bump CACHE when files change so phones pick up the new version.
const CACHE = 'kleine-handen-v0.6.2';
const FILES = [
  './',
  './index.html',
  './css/app.css',
  './js/audio.js',
  './js/toy-utils.js',
  './js/vendor/matter.min.js',
  './js/games/busy.js',
  './js/games/blobs.js',
  './js/games/draw.js',
  './js/games/shapes.js',
  './js/games/blocks.js',
  './js/games/radio.js',
  './js/games/music.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache first for our own files; the network for anything else (fonts).
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }))
  );
});
