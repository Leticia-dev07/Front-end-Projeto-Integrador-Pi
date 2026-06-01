/**
 * components/sidebar/sidebar.js — AcadFlow
 * [FIX-HAMBURGER] Os nav-items agora chamam MobileMenu.close() ao navegar.
 */
const Sidebar = {
  _menus: {
    ADMIN: [
      { section:'Visão Geral', items:[
        { icon:'fas fa-chart-pie',       label:'Dashboard',     route:'superadmin/dashboard' },
      ]},
      { section:'Gerenciamento', items:[
        { icon:'fas fa-graduation-cap',  label:'Cursos',        route:'superadmin/cursos' },
        { icon:'fas fa-chalkboard-user', label:'Coordenadores', route:'superadmin/coordenadores' },
        { icon:'fas fa-users',           label:'Alunos',        route:'superadmin/alunos' },
      ]},
    ],
    COORDENADOR: [
      { section:'Visão Geral', items:[
        { icon:'fas fa-chart-pie',       label:'Dashboard',    route:'coordenador/dashboard' },
        { icon:'fas fa-book-open',       label:'Meu Curso',    route:'coordenador/curso-detalhe' },
      ]},
      { section:'Gestão', items:[
        { icon:'fas fa-tags',            label:'Categorias',   route:'coordenador/categorias' },
        { icon:'fas fa-users',           label:'Alunos',       route:'coordenador/alunos' },
        { icon:'fas fa-file-arrow-up',   label:'Submissões',   route:'coordenador/submissoes', badgeId:'sidebar-badge-subs' },
      ]},
    ],
    ALUNO: [
      { section:'Início', items:[
        { icon:'fas fa-chart-pie',         label:'Dashboard',  route:'aluno/dashboard' },
      ]},
      { section:'Atividades', items:[
        { icon:'fas fa-plus-circle',       label:'Submeter',   route:'aluno/submeter' },
        { icon:'fas fa-clock-rotate-left', label:'Histórico',  route:'aluno/historico' },
      ]},
    ],
  },

  render(session) {
    const sidebar = document.getElementById('sidebar');
    const menus   = this._menus[session.role] || [];

    sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="brand-icon"><i class="fas fa-graduation-cap"></i></div>
          <span class="brand-text">AcadFlow</span>
        </div>
        <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Colapsar menu">
          <i class="fas fa-angles-left"></i>
        </button>
      </div>

      <!-- Seletor de curso (coordenador com múltiplos cursos) -->
      <div id="curso-switcher" class="hidden"
        style="padding:var(--space-3) var(--space-4);border-bottom:1px solid rgba(255,255,255,0.07)">
        <p style="font-size:.6rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;
           color:rgba(255,255,255,.3);margin-bottom:var(--space-2)">Curso ativo</p>
        <select id="curso-select"
          style="width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
                 border-radius:var(--radius-sm);color:white;font-size:var(--text-xs);padding:6px 8px;
                 outline:none;font-family:var(--font-sans);cursor:pointer;appearance:none">
          <option value="">Carregando...</option>
        </select>
      </div>

      <nav class="sidebar-nav">
        ${menus.map(s => `
          <p class="nav-section-label">${s.section}</p>
          ${s.items.map(item => `
            <div class="nav-item" data-route="${item.route}" data-tooltip="${item.label}"
              role="button" tabindex="0" aria-label="${item.label}">
              <i class="nav-icon ${item.icon}" aria-hidden="true"></i>
              <span class="nav-label">${item.label}</span>
              ${item.badgeId ? `<span class="nav-badge hidden" id="${item.badgeId}">0</span>` : ''}
            </div>`).join('')}
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user" id="sidebar-profile-btn" title="Editar perfil" role="button" tabindex="0">
          <div class="user-avatar">${Helpers.escHtml(session.avatar || Helpers.initials(session.name))}</div>
          <div class="user-info">
            <p class="user-name">${Helpers.escHtml(session.name)}</p>
            <p class="user-role">${Helpers.roleLabel(session.role)}</p>
          </div>
          <i class="fas fa-pen" style="color:rgba(255,255,255,.25);font-size:.75rem;margin-left:auto;flex-shrink:0" aria-hidden="true"></i>
        </div>
        <button id="logout-btn"
          style="width:100%;margin-top:var(--space-2);background:rgba(255,255,255,.06);border:none;
                 border-radius:var(--radius-sm);padding:var(--space-2);color:rgba(255,255,255,.4);
                 font-size:var(--text-xs);cursor:pointer;display:flex;align-items:center;
                 justify-content:center;gap:var(--space-2);font-family:var(--font-sans);
                 transition:background var(--transition-fast)">
          <i class="fas fa-right-from-bracket" aria-hidden="true"></i>
          <span class="nav-label">Sair do sistema</span>
        </button>
      </div>`;

    // Toggle colapso desktop
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const icon = sidebar.querySelector('.sidebar-toggle i');
      icon.className = sidebar.classList.contains('collapsed') ? 'fas fa-angles-right' : 'fas fa-angles-left';
    });

    // [FIX-HAMBURGER] Nav items fecham o menu mobile ao navegar
    sidebar.querySelectorAll('.nav-item').forEach(el => {
      const navigate = () => {
        Router.navigate(el.dataset.route);
        // MobileMenu.close() já é chamado pelo Router.navigate()
      };
      el.addEventListener('click', navigate);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(); } });
    });

    // Perfil
    document.getElementById('sidebar-profile-btn').addEventListener('click', () => Router.navigate('perfil'));
    document.getElementById('sidebar-profile-btn').addEventListener('keydown', e => {
      if (e.key === 'Enter') Router.navigate('perfil');
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      Modal.confirm({
        title:'Sair do sistema', message:'Deseja realmente encerrar sua sessão?',
        confirmText:'Sair', type:'warning',
        onConfirm: async () => AuthService.logout(),
      });
    });

    // Seletor de cursos (coordenador)
    if (session.role === 'COORDENADOR') {
      this._initCourseSwitcher(session);
      this.refreshBadge();
    }
  },

  async _initCourseSwitcher(session) {
    const switcher = document.getElementById('curso-switcher');
    const select   = document.getElementById('curso-select');
    if (!switcher || !select) return;
    try {
      let cursos = [];
      if (session.profileId) cursos = await UserService.getCursosByCoordenadorId(session.profileId);
      if (!cursos.length && session.email) cursos = await UserService.getCursosByCoordenadorEmail(session.email);
      if (!cursos.length) return;
      switcher.classList.remove('hidden');
      const cursoAtivo = Storage.getCursoAtivo();
      select.innerHTML = cursos.map(c =>
        `<option value="${c.id}" ${c.id === cursoAtivo ? 'selected' : ''}>${Helpers.escHtml(c.nome)}</option>`
      ).join('');
      if (!cursoAtivo || !cursos.find(c => c.id === cursoAtivo)) {
        Storage.setCursoAtivo(cursos[0].id);
        select.value = String(cursos[0].id);
      } else {
        select.value = String(cursoAtivo);
      }
      select.addEventListener('change', () => {
        Storage.setCursoAtivo(Number(select.value));
        Router.navigate(Router.currentRoute || 'coordenador/dashboard');
        this.refreshBadge();
      });
    } catch (e) { console.warn('[Sidebar] CourseSwitcher:', e.message); }
  },

  async refreshBadge() {
    const badgeEl = document.getElementById('sidebar-badge-subs');
    if (!badgeEl) return;
    try {
      const session    = Storage.getSession();
      const cursoAtivo = Storage.getCursoAtivo();
      let cursoIds = [];
      if (cursoAtivo) {
        cursoIds = [cursoAtivo];
      } else if (session.profileId) {
        const cursos = await UserService.getCursosByCoordenadorId(session.profileId).catch(() => []);
        cursoIds = cursos.map(c => c.id);
      }
      if (!cursoIds.length) return;
      const subs  = await ActivityService.getSubmissoesByCursoIds(cursoIds);
      const count = subs.filter(s => s.status === 'PENDENTE').length;
      badgeEl.textContent = count;
      badgeEl.classList.toggle('hidden', count === 0);
    } catch { /* silencioso */ }
  },
};
window.Sidebar = Sidebar;
