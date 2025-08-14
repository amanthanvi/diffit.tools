// Service Worker for Diffit.tools PWA
const CACHE_NAME = 'diffit-v2.0.0';
const urlsToCache = [
  '/',
  '/diff',
  '/folder-diff',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Specific caches for different resource types
const STATIC_CACHE = 'diffit-static-v2';
const DYNAMIC_CACHE = 'diffit-dynamic-v2';
const WASM_CACHE = 'diffit-wasm-v2';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('diffit-') && 
                   cacheName !== STATIC_CACHE && 
                   cacheName !== DYNAMIC_CACHE &&
                   cacheName !== WASM_CACHE;
          })
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle WASM files specially
  if (request.url.includes('.wasm')) {
    event.respondWith(
      caches.open(WASM_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((response) => {
            // Clone the response before caching
            cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Handle API calls - network first
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return a custom offline response for API calls
          return new Response(
            JSON.stringify({ 
              error: 'You are offline. Some features may be limited.' 
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            }
          );
        })
    );
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request).then((fetchResponse) => {
            return caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
        .catch(() => {
          // Return offline page if available
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // Default strategy: cache first, then network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          // Return cached version
          return response;
        }

        // Clone the request
        const fetchRequest = request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_DIFF') {
    // Cache a diff for offline viewing
    const { id, data } = event.data;
    caches.open('diffit-diffs').then((cache) => {
      const response = new Response(JSON.stringify(data));
      cache.put(`/diff-cache/${id}`, response);
    });
  }
});

// Background sync for sharing when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-diffs') {
    event.waitUntil(syncDiffs());
  }
});

async function syncDiffs() {
  // Sync any pending diffs when coming back online
  const cache = await caches.open('diffit-pending');
  const requests = await cache.keys();
  
  return Promise.all(
    requests.map(async (request) => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Sync failed for', request.url);
      }
    })
  );
}

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-diffs') {
    event.waitUntil(updateCachedDiffs());
  }
});

async function updateCachedDiffs() {
  // Update cached diffs periodically
  console.log('Updating cached diffs...');
}