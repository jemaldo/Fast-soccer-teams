
const CACHE_NAME = 'pro-manager-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Abriendo caché y guardando activos...');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retornar caché si existe
        if (response) {
          return response;
        }
        
        // Si no está en caché, intentar red
        return fetch(event.request).then(networkResponse => {
          // No cachear llamadas a API de Google o GenAI
          if (!event.request.url.includes('google') && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      }).catch(() => {
        // Si falla red y no hay caché (offline total), podrías servir una página de error
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});
