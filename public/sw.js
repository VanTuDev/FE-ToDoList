const CACHE_NAME = 'fpt-unitracker-v2'
const urlsToCache = [
  '/',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Không cache API / request có side-effects
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req))
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response
      return fetch(event.request).then((fetchResponse) => {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse
        }
        const responseToCache = fetchResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })
        return fetchResponse
      })
    })
  )
})
