// Service Worker do Estoque ERP.
// Assets estáticos do build → cache-first. Navegação e /api/* → network-first,
// com fallback para /offline.html quando não há conexão nem cache.

const VERSAO_CACHE = 'estoque-erp-v1';
const CACHE_ESTATICO = `${VERSAO_CACHE}-estatico`;
const CACHE_PAGINAS = `${VERSAO_CACHE}-paginas`;

const ARQUIVOS_ESSENCIAIS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_ESTATICO).then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(
        chaves
          .filter((chave) => chave.startsWith('estoque-erp-') && chave !== CACHE_ESTATICO && chave !== CACHE_PAGINAS)
          .map((chave) => caches.delete(chave))
      )
    )
  );
  self.clients.claim();
});

function ehAssetEstatico(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/splash/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/apple-touch-icon.png'
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (ehAssetEstatico(url)) {
    event.respondWith(
      caches.match(request).then(
        (cacheado) =>
          cacheado ||
          fetch(request).then((resposta) => {
            const copia = resposta.clone();
            caches.open(CACHE_ESTATICO).then((cache) => cache.put(request, copia));
            return resposta;
          })
      )
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE_PAGINAS).then((cache) => cache.put(request, copia));
          return resposta;
        })
        .catch(async () => {
          const cacheado = await caches.match(request);
          return cacheado || caches.match('/offline.html');
        })
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => new Response(null, { status: 503, statusText: 'Offline' })));
    return;
  }
});
