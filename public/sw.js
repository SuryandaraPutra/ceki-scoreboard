/**
 * Service Worker untuk Ceki Scoreboard (PWA).
 *
 * Strategi Caching:
 * - /api/* : Network-First (Data skor & game TIDAK BOLEH di-cache sembarangan).
 * - Aset statis (_next, css, js, fonts) : Cache-First dengan network fallback.
 * - Halaman HTML saat offline : Fallback ke /offline jika jaringan putus.
 */

const CACHE_NAME = 'ceki-scoreboard-v3';

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
];

// Install: Simpan aset penting ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Bersihkan cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Tangani permintaan jaringan
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Permintaan API: SELALU Network-First (tidak boleh stale score)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: {
              code: 'OFFLINE',
              message: 'Tidak dapat menghubungi server dalam mode offline.',
            },
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // 2. Permintaan Navigasi HTML: Coba Network, jika gagal fallback ke /offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline').then((res) => {
          return res || caches.match('/');
        });
      })
    );
    return;
  }

  // 3. Aset Statis (CSS, JS, Font, Images): Cache-First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== 'basic'
        ) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
