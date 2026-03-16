// NCTIRS Dashboard Service Worker
// Provides offline capability and caching for static assets

const CACHE_NAME = 'nctirs-cache-v1'
const OFFLINE_URL = '/offline.html'

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/manifest.json',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...')
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets')
                return cache.addAll(STATIC_ASSETS)
            })
            .then(() => {
                console.log('[ServiceWorker] Install complete')
                return self.skipWaiting()
            })
    )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...')
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[ServiceWorker] Deleting old cache:', name)
                            return caches.delete(name)
                        })
                )
            })
            .then(() => {
                console.log('[ServiceWorker] Claiming clients')
                return self.clients.claim()
            })
    )
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return

    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) return

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response for caching
                const responseClone = response.clone()

                // Cache successful responses for static assets
                if (response.status === 200) {
                    const url = new URL(event.request.url)
                    const isStaticAsset =
                        url.pathname.startsWith('/_next/static/') ||
                        url.pathname.endsWith('.js') ||
                        url.pathname.endsWith('.css') ||
                        url.pathname.endsWith('.png') ||
                        url.pathname.endsWith('.svg') ||
                        url.pathname.endsWith('.webp')

                    if (isStaticAsset) {
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(event.request, responseClone))
                    }
                }

                return response
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse
                        }

                        // For navigation requests, show offline page
                        if (event.request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL)
                        }

                        // Return a simple error response for other requests
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable',
                        })
                    })
            })
    )
})

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting()
    }
})
