// Files to cache
const cacheName = 'aac7.04'
const appShellFiles = [
  '/open-aac/',
  '/open-aac/index.html',
  '/open-aac/index2.html',
  '/open-aac/icons/aac.png',
  'https://code.jquery.com/ui/1.13.0/themes/base/jquery-ui.css',
  'https://code.jquery.com/jquery-3.6.0.js',
  'https://code.jquery.com/ui/1.13.0/jquery-ui.js'
];

// Installing Service Worker
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    console.log('[Service Worker] Caching all: app shell and content');
    await cache.addAll(appShellFiles);
  })());
  self.skipWaiting();
});

// Fetching content using Service Worker
self.addEventListener('fetch', (e) => {
    // Cache http and https only, skip unsupported chrome-extension:// and file://...
    if (!(
       e.request.url.startsWith('http:') || e.request.url.startsWith('https:')
    )) {
        return; 
    }

  e.respondWith((async () => {
    const r = await caches.match(e.request);
    console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
    if (r) return r;
    const response = await fetch(e.request);
    const cache = await caches.open(cacheName);
    console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
    cache.put(e.request, response.clone());
    return response;
  })());
});

const deleteCache = async (key) => {
  await caches.delete(key);
};

const deleteOldCaches = async () => {
  const cacheKeepList = [cacheName];
  const keyList = await caches.keys();
  const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
  await Promise.all(cachesToDelete.map(deleteCache));
};

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 1. Clean up old caches first
      await deleteOldCaches();
      
      // 2. Take control of all open clients (tabs) immediately
      await self.clients.claim();
    })()
  );
});

