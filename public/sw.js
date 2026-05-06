const CACHE_NAME = 'pixel-fill-v2'

// 需要预缓存的静态资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
]

// 安装时预缓存核心资源
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    }).then(() => self.skipWaiting())
  )
})

// Stale-while-revalidate 策略：先返回缓存，同时后台更新
self.addEventListener('fetch', (e) => {
  // 只缓存同源 GET 请求
  if (e.request.method !== 'GET') return

  // 不缓存 Supabase API 请求
  const url = new URL(e.request.url)
  if (url.hostname.endsWith('.supabase.co')) return

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone))
        }
        return response
      }).catch(() => cached)

      return cached || fetchPromise
    })
  )
})

// 清理旧缓存
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})
