// Enhanced Service Worker for Diffit.tools PWA
// Version 2.1.0 with advanced offline support

const VERSION = '2.1.0';
const CACHE_PREFIX = 'diffit';

// Cache names
const CACHES = {
  STATIC: `${CACHE_PREFIX}-static-v${VERSION}`,
  DYNAMIC: `${CACHE_PREFIX}-dynamic-v${VERSION}`,
  WASM: `${CACHE_PREFIX}-wasm-v${VERSION}`,
  DIFFS: `${CACHE_PREFIX}-diffs-v${VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-v${VERSION}`,
  API: `${CACHE_PREFIX}-api-v${VERSION}`,
};

// Essential URLs to cache on install
const STATIC_ASSETS = [
  '/',
  '/diff',
  '/folder-diff',
  '/shared',
  '/manifest.json',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
];

// Resource patterns for different caching strategies
const CACHE_STRATEGIES = {
  networkFirst: [
    /^\/api\//,
    /^\/trpc\//,
  ],
  cacheFirst: [
    /\.(?:css|js|woff2?|ttf|otf)$/,
    /^\/fonts\//,
    /^\/static\//,
  ],
  staleWhileRevalidate: [
    /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    /^\/images\//,
  ],
  networkOnly: [
    /^\/auth\//,
    /^\/admin\//,
  ],
  wasmSpecial: [
    /\.wasm$/,
  ],
};

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log(`[SW v${VERSION}] Installing...`);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHES.STATIC);
        await cache.addAll(STATIC_ASSETS);
        console.log(`[SW v${VERSION}] Static assets cached`);
        
        // Force activation of new service worker
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] Installation failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[SW v${VERSION}] Activating...`);
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => {
        return name.startsWith(CACHE_PREFIX) && 
               !Object.values(CACHES).includes(name);
      });
      
      await Promise.all(oldCaches.map(name => {
        console.log(`[SW] Deleting old cache: ${name}`);
        return caches.delete(name);
      }));
      
      // Take control of all clients
      await self.clients.claim();
      console.log(`[SW v${VERSION}] Activated and controlling clients`);
    })()
  );
});

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) return;
  
  // Skip cross-origin requests (except for CDNs we trust)
  if (url.origin !== location.origin) {
    if (!isTrustedCDN(url)) return;
  }
  
  // Determine caching strategy
  const strategy = getCachingStrategy(request);
  
  switch (strategy) {
    case 'networkFirst':
      event.respondWith(networkFirst(request));
      break;
    case 'cacheFirst':
      event.respondWith(cacheFirst(request));
      break;
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(request));
      break;
    case 'networkOnly':
      event.respondWith(networkOnly(request));
      break;
    case 'wasmSpecial':
      event.respondWith(handleWASM(request));
      break;
    default:
      event.respondWith(staleWhileRevalidate(request));
  }
});

// Caching Strategies

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHES.DYNAMIC);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try cache on network failure
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Return offline response for API calls
    if (request.url.includes('/api/') || request.url.includes('/trpc/')) {
      return createOfflineApiResponse();
    }
    
    // Return offline page for navigation
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHES.STATIC);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return a fallback for critical resources
    return createFallbackResponse(request);
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(CACHES.DYNAMIC);
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  return cached || fetchPromise || createFallbackResponse(request);
}

async function networkOnly(request) {
  return fetch(request);
}

async function handleWASM(request) {
  const cache = await caches.open(CACHES.WASM);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Serving WASM from cache:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      console.log('[SW] Caching WASM:', request.url);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Failed to fetch WASM:', error);
    throw error;
  }
}

// Helper functions

function getCachingStrategy(request) {
  const url = request.url;
  
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => pattern.test(url))) {
      return strategy;
    }
  }
  
  // Default strategy based on request type
  if (request.mode === 'navigate') {
    return 'networkFirst';
  }
  
  return 'staleWhileRevalidate';
}

function isTrustedCDN(url) {
  const trustedOrigins = [
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
    'https://cdnjs.cloudflare.com',
  ];
  
  return trustedOrigins.some(origin => url.origin === origin);
}

function createOfflineApiResponse() {
  return new Response(
    JSON.stringify({
      error: 'offline',
      message: 'You are currently offline. This feature requires an internet connection.',
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'X-SW-Offline': 'true',
      },
    }
  );
}

function createFallbackResponse(request) {
  const url = new URL(request.url);
  
  // Return appropriate fallback based on file type
  if (url.pathname.endsWith('.js')) {
    return new Response('// Offline fallback script', {
      headers: { 'Content-Type': 'application/javascript' },
    });
  }
  
  if (url.pathname.endsWith('.css')) {
    return new Response('/* Offline fallback styles */', {
      headers: { 'Content-Type': 'text/css' },
    });
  }
  
  if (/\.(png|jpg|jpeg|svg|gif|webp)$/i.test(url.pathname)) {
    // Return a placeholder image
    return new Response('', {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }
  
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

// Message handling
self.addEventListener('message', async (event) => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      await self.skipWaiting();
      break;
      
    case 'CACHE_DIFF':
      await cacheDiff(data);
      break;
      
    case 'DELETE_DIFF':
      await deleteCachedDiff(data.id);
      break;
      
    case 'GET_CACHED_DIFFS':
      const diffs = await getCachedDiffs();
      event.ports[0].postMessage({ type: 'CACHED_DIFFS', data: diffs });
      break;
      
    case 'CLEAR_ALL_CACHES':
      await clearAllCaches();
      event.ports[0].postMessage({ type: 'CACHES_CLEARED' });
      break;
      
    case 'GET_CACHE_SIZE':
      const size = await estimateCacheSize();
      event.ports[0].postMessage({ type: 'CACHE_SIZE', data: size });
      break;
  }
});

// Diff caching functions
async function cacheDiff({ id, title, content, metadata }) {
  const cache = await caches.open(CACHES.DIFFS);
  
  const diffData = {
    id,
    title,
    content,
    metadata,
    cachedAt: new Date().toISOString(),
  };
  
  const response = new Response(JSON.stringify(diffData), {
    headers: {
      'Content-Type': 'application/json',
      'X-Diff-Id': id,
      'X-Cached-At': diffData.cachedAt,
    },
  });
  
  await cache.put(`/cached-diff/${id}`, response);
  console.log(`[SW] Cached diff: ${id}`);
}

async function deleteCachedDiff(id) {
  const cache = await caches.open(CACHES.DIFFS);
  await cache.delete(`/cached-diff/${id}`);
  console.log(`[SW] Deleted cached diff: ${id}`);
}

async function getCachedDiffs() {
  const cache = await caches.open(CACHES.DIFFS);
  const requests = await cache.keys();
  
  const diffs = await Promise.all(
    requests
      .filter(req => req.url.includes('/cached-diff/'))
      .map(async (req) => {
        const response = await cache.match(req);
        return response.json();
      })
  );
  
  return diffs;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

async function estimateCacheSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100,
    };
  }
  
  return { usage: 0, quota: 0, percentage: 0 };
}

// Background sync
self.addEventListener('sync', async (event) => {
  console.log(`[SW] Background sync: ${event.tag}`);
  
  if (event.tag === 'sync-diffs') {
    event.waitUntil(syncPendingDiffs());
  }
});

async function syncPendingDiffs() {
  // Implement syncing logic for pending diffs
  console.log('[SW] Syncing pending diffs...');
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', async (event) => {
  console.log(`[SW] Periodic sync: ${event.tag}`);
  
  if (event.tag === 'update-content') {
    event.waitUntil(updateCachedContent());
  }
});

async function updateCachedContent() {
  // Update critical cached content
  console.log('[SW] Updating cached content...');
  
  try {
    const cache = await caches.open(CACHES.STATIC);
    await cache.addAll(STATIC_ASSETS);
  } catch (error) {
    console.error('[SW] Failed to update cached content:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New update available',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };
  
  event.waitUntil(
    self.registration.showNotification('Diffit.tools', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log(`[SW v${VERSION}] Service Worker loaded`);