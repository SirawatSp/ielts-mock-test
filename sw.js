'use strict';

// Bump this version whenever a precached file changes. Updates wait for consent.
const VERSION = '2026-10-12-1';
const PREFIX = 'ielts-pocket:' + self.registration.scope + ':';
const CACHE = PREFIX + VERSION;
const FILES = [
  './', './index.html', './practice.html', './app.css', './app.js',
  './manifest.webmanifest', './assets/apple-touch-icon.png',
  './assets/icon-192.png', './assets/icon-512.png', './assets/ui-icons.svg'
];
const URLS = new Set(FILES.map(file => new URL(file, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache =>
    cache.addAll(FILES.map(file => new Request(new URL(file, self.registration.scope), { cache: 'reload' })))
  ));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  url.hash = '';
  if (!URLS.has(url.href)) return;
  // Serve one coherent app version; do not mix new HTML with old scripts.
  event.respondWith((async () => {
    const cached = await caches.open(CACHE).then(cache => cache.match(url.href));
    return cached || fetch(event.request);
  })());
});
