/**
 * assets/js/app.js — AcadFlow
 * Bootstrap: inicializa tema, registra Service Worker (PWA) e rotas.
 */
const App = {
  init() {
    // 1. Aplica tema salvo ANTES de renderizar qualquer coisa
    Theme.init();

    // 2. Registra Service Worker (PWA)
    this._registerSW();

    // 3. Inicializa sessão
    const session = Storage.getSession();
    if (session) {
      this.initShell(session);
    } else {
      document.getElementById('auth-container').classList.remove('hidden');
      LoginPage.render();
    }
    Loader.hidePageLoader();
  },

  initShell(session) {
    document.getElementById('auth-container').innerHTML = '';
    document.getElementById('shell').classList.remove('hidden');
    Sidebar.render(session);
    Navbar.render(session);
    this._registerRoutes();
    const hash  = window.location.hash.replace(/^#\//, '');
    const start = (hash && hash !== 'login') ? hash : Router._defaultRoute(session.role);
    Router.navigate(start);
  },

  _registerRoutes() {
    Router
      .on('login', () => {
        document.getElementById('shell').classList.add('hidden');
        document.getElementById('auth-container').classList.remove('hidden');
        LoginPage.render();
      })
      // SuperAdmin
      .on('superadmin/dashboard',              ()  => SuperAdminDashboard.render())
      .on('superadmin/cursos',                 ()  => SuperAdminCursos.render())
      .on('superadmin/curso-detalhe/:cursoId', p   => CursoDetalhePage.render(Number(p.cursoId)))
      .on('superadmin/coordenadores',          ()  => SuperAdminCoordenadores.render())
      .on('superadmin/alunos',                 ()  => SuperAdminAlunos.render())
      // Coordenador
      .on('coordenador/dashboard',             ()  => CoordenadorDashboard.render())
      .on('coordenador/curso-detalhe',         ()  => CoordenadorCursoDetalhe.render())
      .on('coordenador/categorias',            ()  => CoordenadorCategorias.render())
      .on('coordenador/submissoes',            ()  => CoordenadorSubmissoes.render())
      .on('coordenador/alunos',                ()  => CoordenadorAlunos.render())
      // Aluno
      .on('aluno/dashboard',                   ()  => AlunoDashboard.render())
      .on('aluno/submeter',                    ()  => AlunoSubmeter.render())
      .on('aluno/historico',                   ()  => AlunoHistorico.render())
      // Perfil
      .on('perfil',                            ()  => PerfilPage.render());

    Router.init();
  },

  _registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('[PWA] Service Worker registrado:', reg.scope))
          .catch(err => console.warn('[PWA] SW falhou:', err));
      });
    }
    // Mostra banner de instalação quando disponível
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      window._pwaInstallEvent = e;
      this._showInstallBanner(e);
    });
  },

  _showInstallBanner(e) {
    // Remove banner anterior se existir
    document.getElementById('pwa-banner')?.remove();

    const banner = document.createElement('div');
    banner.id = 'pwa-banner';
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <span class="pwa-icon">📲</span>
      <div class="pwa-text">
        <p>Instalar AcadFlow</p>
        <span>Acesso rápido, funciona offline</span>
      </div>
      <button class="btn btn-primary btn-sm" id="pwa-install-btn">Instalar</button>
      <button class="btn btn-ghost btn-sm" id="pwa-dismiss-btn" title="Fechar">
        <i class="fas fa-xmark"></i>
      </button>`;

    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
      e.prompt();
      const result = await e.userChoice;
      if (result.outcome === 'accepted') Toast.success('AcadFlow instalado!', 'Acesse pelo ícone na tela inicial.');
      banner.remove();
    });
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => banner.remove());
  },
};

window.addEventListener('DOMContentLoaded', () => App.init());
