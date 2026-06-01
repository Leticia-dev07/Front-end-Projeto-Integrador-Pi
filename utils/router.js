/**
 * utils/router.js — AcadFlow
 *
 * [FIX-HAMBURGER] Fecha o menu mobile a cada navegação.
 * [FIX] Rota parametrizada: superadmin/curso-detalhe/:cursoId
 */
const Router = {
  routes:       {},
  currentRoute: null,

  on(path, handler) { this.routes[path] = handler; return this; },

  navigate(path) {
    // [FIX] Fecha sidebar mobile em qualquer navegação
    if (typeof MobileMenu !== 'undefined') MobileMenu.close();

    window.location.hash = '#/' + path;
    this._handle(path);
  },

  init() {
    window.addEventListener('hashchange', () => {
      // [FIX] Também fecha ao navegar com botão Voltar/Avançar
      if (typeof MobileMenu !== 'undefined') MobileMenu.close();
      this._resolve();
    });
    this._resolve();
  },

  _resolve() {
    const hash = window.location.hash.replace(/^#\//, '') || 'login';
    this._handle(hash);
  },

  _handle(path) {
    const session      = Storage.getSession();
    const publicRoutes = ['login'];

    if (!session && !publicRoutes.includes(path)) { this.navigate('login'); return; }
    if (session  &&  publicRoutes.includes(path)) { this.navigate(this._defaultRoute(session.role)); return; }
    if (session  && !this._hasPermission(session.role, path)) { this.navigate(this._defaultRoute(session.role)); return; }

    let handler = this.routes[path];
    let params  = {};

    if (!handler) {
      for (const [pattern, fn] of Object.entries(this.routes)) {
        if (!pattern.includes(':')) continue;
        const re = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
        const m  = path.match(re);
        if (m) {
          handler = fn;
          const keys = [...pattern.matchAll(/:([^/]+)/g)].map(x => x[1]);
          keys.forEach((k, i) => { params[k] = m[i + 1]; });
          break;
        }
      }
    }

    if (!handler) { console.warn('[Router] Sem handler para:', path); return; }

    this.currentRoute = path;
    this._updateSidebarActive(path);
    this._updateBreadcrumb(path);

    const content = document.getElementById('page-content');
    if (content) {
      content.innerHTML = '';
      content.scrollTop = 0;
      handler(params);
    }
  },

  _defaultRoute(role) {
    return { ADMIN: 'superadmin/dashboard', COORDENADOR: 'coordenador/dashboard', ALUNO: 'aluno/dashboard' }[role] || 'login';
  },

  _hasPermission(role, path) {
    if (path.startsWith('superadmin')  && role !== 'ADMIN')       return false;
    if (path.startsWith('coordenador') && role !== 'COORDENADOR') return false;
    if (path.startsWith('aluno')       && role !== 'ALUNO')       return false;
    return true;
  },

  _updateSidebarActive(path) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', path === el.dataset.route || path.startsWith(el.dataset.route + '/'));
    });
  },

  _updateBreadcrumb(path) {
    const labels = {
      superadmin:'SuperAdmin', coordenador:'Coordenador', aluno:'Aluno', perfil:'Perfil',
      dashboard:'Dashboard',   cursos:'Cursos',           coordenadores:'Coordenadores',
      alunos:'Alunos',         categorias:'Categorias',   submissoes:'Submissões',
      submeter:'Submeter',     historico:'Histórico',     'curso-detalhe':'Detalhes do Curso',
    };
    const parts  = path.split('/');
    const crumbs = parts.map((p, i) => ({
      label:  labels[p] || (isNaN(p) ? p : `#${p}`),
      route:  parts.slice(0, i + 1).join('/'),
      active: i === parts.length - 1,
    }));
    const el = document.querySelector('.navbar-breadcrumb');
    if (!el) return;
    el.innerHTML = crumbs.map((c, i) => `
      ${i > 0 ? '<span class="separator"><i class="fas fa-chevron-right"></i></span>' : ''}
      <span class="crumb ${c.active ? 'active' : ''}" data-route="${c.route}">${c.label}</span>
    `).join('');
    el.querySelectorAll('.crumb:not(.active)').forEach(s => {
      s.addEventListener('click', () => Router.navigate(s.dataset.route));
    });
  },
};
window.Router = Router;
