const CACHE_NAME = 'one-piece-v1';

// O Service Worker precisa existir para o PWA ser instalável
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Aqui você poderia configurar o acesso offline, 
    // mas por enquanto apenas deixamos o navegador seguir o fluxo normal
    event.respondWith(fetch(event.request));
});