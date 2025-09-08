const CACHE_NAME = 'etiquetadora-v1.0.0';
const GHPATH = '/Gerador-de-etiqueta-pwa';

const urlsToCache = [
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/manifest.json`,
  'https://cdn.tailwindcss.com',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Todos os recursos cacheados com sucesso');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Falha ao cachear recursos:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker pronto para controlar clients');
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  // Ignora requisições não GET e requisições de terceiros
  if (event.request.method !== 'GET' || !event.request.url.includes(window.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se encontrado
        if (response) {
          return response;
        }

        // Se não encontrado no cache, busca na rede
        return fetch(event.request)
          .then((response) => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cachea a resposta para uso futuro (apenas recursos locais)
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.log('Fetch falhou; retornando página offline:', error);
            // Para requisições de página, retorna a página offline
            if (event.request.destination === 'document') {
              return caches.match(`${GHPATH}/index.html`);
            }
          });
      })
  );
});

// Mensagens do Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
