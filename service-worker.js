// service-worker.js

const CACHE_NAME = 'mapa-saude-valenca-v1'; // Change 'v1' if you update files later
const FILES_TO_CACHE = [
  './', // Caches the root URL (often index.html)
  './index.html', // Make sure this matches your HTML file name
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // URLs for Leaflet library files (important!)
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', // Default marker icon
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', // Marker shadow
  // URLs for Leaflet.draw library files
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js',
  // Add any other essential local files (like specific CSS or JS files if you split them)
];

// 1. Install Event: Cache files when the service worker is installed
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch((error) => {
        console.error('[ServiceWorker] Failed to cache app shell:', error);
      })
  );
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim(); // Take control immediately
});

// 3. Fetch Event: Serve cached files when offline, or fetch from network
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests for http/https
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
      return;
  }

  // Strategy: Cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          // console.log('[ServiceWorker] Returning from cache:', event.request.url);
          return response;
        }

        // Otherwise, fetch from network
        // console.log('[ServiceWorker] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Optional: Cache the newly fetched resource dynamically
            // Be careful caching map tiles or external resources this way
            // caches.open(CACHE_NAME).then((cache) => {
            //   cache.put(event.request, networkResponse.clone());
            // });
            return networkResponse;
          })
          .catch((error) => {
            console.error('[ServiceWorker] Fetch failed:', error);
            // Optional: Return a fallback offline page/resource here
          });
      })
  );
});