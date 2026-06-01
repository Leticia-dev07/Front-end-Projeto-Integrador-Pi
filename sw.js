/**
 * sw.js — AcadFlow Service Worker (PWA)
 * Estratégia: Cache-first para assets estáticos, Network-first para API.
 */
const CACHE_NAME    = 'acadflow-v1';
const API_ORIGIN    = 'back-end-projeto-integrador.onrender.com';

// Assets estáticos para pré-cache (shell da SPA)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/variables.css',
  '/assets/css/reset.css',
  '/assets/css/layout.css',
  '/assets/css/components.css',
  '/assets/css/animations.css',
  '/assets/css/responsive.css',
  '/assets/js/app.js',
  '/utils/storage.js',
  '/utils/helpers.js',
  '/utils/validators.js',
  '/utils/theme.js',
  '/utils/router.js',
  '/services/api.js',
  '/services/authService.js',
  '/services/userService.js',
  '/services/activityService.js',
  '/services/dashboardService.js',
  '/components/toast/toast.js',
  '/components/loader/loader.js',
  '/components/modal/modal.js',
  '/components/sidebar/sidebar.js',
  '/components/navbar/navbar.js',
  '/components/table/table.js',
  '/components/card/card.js',
  '/pages/login/login.js',
  '/pages/superadmin/dashboard.js',
  '/pages/superadmin/cursos.js',
  '/pages/superadmin/curso-detalhe.js',
  '/pages/superadmin/coordenadores.js',
  '/pages/superadmin/alunos.js',
  '/pages/coordenador/dashboard.js',
  '/pages/coordenador/curso-detalhe.js',
  '/pages/coordenador/categorias.js',
  '/pages/coordenador/submissoes.js',
  '/pages/coordenador/alunos.js',
  '/pages/aluno/dashboard.js',
  '/pages/aluno/submeter.js',
  '/pages/aluno/historico.js',
  '/pages/perfil/perfil.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
];

// ── Install: pré-carrega shell ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pré-cacheando assets estáticos');
      // Usa addAll com tratamento individual para não bloquear por falhas
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: limpa caches antigos ─────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: estratégia por tipo de recurso ──────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Requisições à API: Network-first (sem cache para dados dinâmicos)
  if (url.hostname === API_ORIGIN) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'Sem conexão' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Assets estáticos: Cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Armazena no cache se for uma resposta válida
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback para index.html (SPA)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
