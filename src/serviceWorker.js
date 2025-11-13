// src/serviceworker.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Precache manifest (CRA injects)
precacheAndRoute(self.__WB_MANIFEST);

// Firebase API caching (stale-while-revalidate for heavy traffic)
registerRoute(
  ({ url }) => url.origin === 'https://firestore.googleapis.com' || url.origin === 'https://identitytoolkit.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'firebase-api',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 min
      }),
    ],
  })
);

// Static assets (cache-first for performance)
registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'style' || request.destination === 'script',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Offline fallback for landing page
registerRoute(
  ({ url }) => url.pathname === '/' || url.pathname === '/index.html',
  async ({ event }) => {
    const response = await caches.match(event.request);
    if (response) return response;

    return fetch(event.request).catch(() => {
      // Offline fallback HTML
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>ESTA Tracker Offline</title></head>
          <body style="font-family: system-ui; text-align: center; padding: 2rem;">
            <h1>Offline Mode</h1>
            <p>You're offline. Check your connection and reload.</p>
            <p>ESTA Tracker will sync when back online.</p>
            <button onclick="window.location.reload()">Retry</button>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });
    });
  }
);

// Background sync for Firebase queues (PWA offline auth/data)
const bgSyncPlugin = new BackgroundSyncPlugin('firebase-queue', {
  maxRetentionTime: 24 * 60, // 24 hours
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') || url.href.includes('firebase'),
  new StaleWhileRevalidate({
    cacheName: 'firebase-background',
    plugins: [bgSyncPlugin],
  })
);

// Push notifications (elite – optional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'ESTA status updated!',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now(), primaryKey: 1 },
  };
  event.waitUntil(
    self.registration.showNotification('ESTA Tracker', options)
  );
});

// Sync on online (PWA elite)
self.addEventListener('online', () => {
  // Retry queued requests
  if ('serviceWorker' in navigator && 'sync' in self.registration) {
    self.registration.sync.register('background-sync');
  }
});

// Error handling (elite logging)
self.addEventListener('error', (event) => {
  console.error('Service Worker Error:', event.error);
  // Report to Sentry or analytics
  if (self.analytics) self.analytics.logEvent('sw_error', { error: event.error.message });
});

// Activate and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('firebase-') || cacheName.startsWith('static-')) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});