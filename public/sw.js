const CACHE_NAME = 'gtd-flow-v1.0.0';
const STATIC_CACHE_NAME = 'gtd-flow-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'gtd-flow-dynamic-v1.0.0';

// Recursos estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/gtd',
  '/okrs',
  '/matrix',
  '/pareto',
  '/pomodoro',
  '/manifest.json',
  // Adicionar outros recursos estáticos conforme necessário
];

// Recursos dinâmicos que devem ser cacheados (para futuras expansões)
// const DYNAMIC_ASSETS = [
//   // APIs externas, imagens, etc.
// ];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache de recursos estáticos
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache dinâmico vazio inicialmente
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Dynamic cache initialized...');
        return cache;
      })
    ]).then(() => {
      console.log('[SW] Service Worker installed successfully');
      // Força a ativação imediata
      return self.skipWaiting();
    })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('gtd-flow-')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar controle de todas as abas
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service Worker activated successfully');
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Estratégia de cache baseada no tipo de recurso
  if (request.method === 'GET') {
    event.respondWith(handleGetRequest(request, url));
  }
});

// Gerenciar requisições GET
async function handleGetRequest(request, url) {
  try {
    // 1. Recursos estáticos (páginas, scripts, estilos)
    if (isStaticAsset(url)) {
      return await cacheFirst(request, STATIC_CACHE_NAME);
    }
    
    // 2. APIs externas (Google Calendar, etc.)
    if (isExternalAPI(url)) {
      return await networkFirst(request, DYNAMIC_CACHE_NAME);
    }
    
    // 3. Recursos dinâmicos (imagens, dados)
    if (isDynamicAsset(url)) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE_NAME);
    }
    
    // 4. Fallback para network-first
    return await networkFirst(request, DYNAMIC_CACHE_NAME);
    
  } catch (error) {
    console.error('[SW] Error handling request:', error);
    
    // Fallback para páginas offline
    if (request.destination === 'document') {
      return await caches.match('/') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Network Error', { status: 503 });
  }
}

// Estratégia Cache First (para recursos estáticos)
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Cache hit:', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] Cache miss, fetching:', request.url);
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Estratégia Network First (para APIs)
async function networkFirst(request, cacheName) {
  try {
    console.log('[SW] Network first:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Estratégia Stale While Revalidate (para recursos dinâmicos)
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  // Buscar nova versão em background
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Ignorar erros de rede em background
  });
  
  // Retornar cache imediatamente se disponível
  if (cachedResponse) {
    console.log('[SW] Stale while revalidate (cached):', request.url);
    return cachedResponse;
  }
  
  // Se não há cache, aguardar network
  console.log('[SW] Stale while revalidate (network):', request.url);
  return await fetchPromise;
}

// Verificar se é recurso estático
function isStaticAsset(url) {
  return url.origin === self.location.origin && (
    url.pathname.startsWith('/_next/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    STATIC_ASSETS.includes(url.pathname)
  );
}

// Verificar se é API externa
function isExternalAPI(url) {
  return url.origin !== self.location.origin && (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('notion.com') ||
    url.hostname.includes('trello.com')
  );
}

// Verificar se é recurso dinâmico
function isDynamicAsset(url) {
  return url.pathname.startsWith('/api/') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.webp');
}

// Gerenciar mensagens do cliente
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'SYNC_DATA':
      // Implementar sincronização de dados offline
      handleDataSync(payload);
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Limpar todos os caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Gerenciar sincronização de dados
function handleDataSync(payload) {
  // Implementar lógica de sincronização quando voltar online
  console.log('[SW] Data sync requested:', payload);
  
  // Aqui poderia implementar:
  // - Sincronização de dados do localStorage com servidor
  // - Upload de dados criados offline
  // - Resolução de conflitos
}

// Background Sync para dados offline
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'gtd-data-sync') {
    event.waitUntil(syncGTDData());
  }
});

// Sincronizar dados GTD
async function syncGTDData() {
  try {
    console.log('[SW] Syncing GTD data...');
    
    // Implementar sincronização real aqui
    // Por enquanto, apenas log
    
    console.log('[SW] GTD data sync completed');
  } catch (error) {
    console.error('[SW] GTD data sync failed:', error);
    throw error;
  }
}

// Notificações Push (para futuras integrações)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Você tem novas tarefas para processar!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Tarefas',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('GTD Flow', options)
  );
});

// Cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/gtd')
    );
  }
});

console.log('[SW] Service Worker script loaded'); 