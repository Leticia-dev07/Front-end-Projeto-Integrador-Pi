/**
 * components/navbar/navbar.js — AcadFlow
 *
 * [FIX-HAMBURGER] Causa raiz do overlay órfão:
 * - O navbar.render() é chamado a cada initShell()
 * - Cada chamada adicionava UM NOVO eventListener ao hamburger
 * - O overlay era criado dinamicamente, mas nunca removido entre navegações
 * - O resultado: múltiplos overlays empilhados, camada cinza que não some
 *
 * Correção:
 * - Overlay criado UMA ÚNICA VEZ na inicialização (MobileMenu.init)
 * - MobileMenu é um singleton — sem múltiplos listeners
 * - Router.navigate() e todos os nav-items chamam MobileMenu.close()
 * - Hambúrguer mostra/esconde via CSS (display), não via re-criação
 * - pointer-events do body liberado explicitamente no close()
 */
const MobileMenu = {
  _initialized: false,
  _overlay: null,
  _sidebar: null,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    this._sidebar = document.getElementById('sidebar');

    // Cria overlay UMA vez e anexa ao body
    this._overlay = document.createElement('div');
    this._overlay.id = 'sidebar-mobile-overlay';
    this._overlay.className = 'sidebar-overlay';
    document.body.appendChild(this._overlay);

    // Fechar ao clicar no overlay
    this._overlay.addEventListener('click', () => this.close());

    // Fechar com ESC
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.close();
    });
  },

  open() {
    if (!this._sidebar) this._sidebar = document.getElementById('sidebar');
    this._sidebar?.classList.add('mobile-open');
    this._overlay?.classList.add('active');
    document.body.style.overflow = 'hidden'; // Previne scroll por baixo
  },

  close() {
    this._sidebar?.classList.remove('mobile-open');
    this._overlay?.classList.remove('active');
    
    // CORREÇÃO: Garante o destravamento total da página
    document.body.style.overflow = '';
    document.body.style.pointerEvents = 'auto'; 

    // CORREÇÃO: Reseta visualmente o botão caso o menu feche via rota ou clique fora
    const hamburger = document.getElementById('mobile-menu-btn');
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      const icon = hamburger.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
    }
  },

  toggle() {
    const isOpen = this._sidebar?.classList.contains('mobile-open');
    isOpen ? this.close() : this.open();
  },

  isOpen() {
    return this._sidebar?.classList.contains('mobile-open') ?? false;
  },
};

const Navbar = {
  render(session) {
    const nav = document.getElementById('navbar');
    nav.innerHTML = `
      <div class="navbar-left">
        <button class="navbar-hamburger" id="mobile-menu-btn" aria-label="Abrir menu" aria-expanded="false">
          <i class="fas fa-bars"></i>
        </button>
        <nav class="navbar-breadcrumb" aria-label="Breadcrumb"></nav>
      </div>
      <div class="navbar-right">
        <div id="aluno-course-switcher-wrap" class="hidden aluno-course-switcher">
          <i class="fas fa-graduation-cap" style="color:var(--accent);font-size:.85rem;flex-shrink:0"></i>
          <select id="aluno-curso-select" title="Trocar curso ativo" aria-label="Curso ativo"></select>
        </div>

        <button class="theme-toggle" id="theme-toggle-btn"
          title="Alternar tema" aria-label="Alternar tema claro/escuro">
          <i class="fas fa-moon"></i>
        </button>

        <div class="navbar-divider"></div>

        <div class="navbar-user-btn" id="nav-user-btn" style="cursor:pointer" onclick="Router.navigate('perfil')">
          <div class="user-avatar" style="width:32px;height:32px;font-size:.75rem">
            ${Helpers.escHtml(session.avatar || Helpers.initials(session.name))}
          </div>
          <div>
            <p class="nav-user-name">${Helpers.escHtml(session.name)}</p>
            <p class="nav-user-role">${Helpers.roleLabel(session.role)}</p>
          </div>
        </div>
      </div>`;

    // ── Tema ─────────────────────────────────────────────────
    document.getElementById('theme-toggle-btn').addEventListener('click', () => Theme.toggle());
    Theme.apply(Theme.current || Storage.getTheme() || 'light');

    // ── Hambúrguer — [FIX] usa MobileMenu singleton ──────────
    MobileMenu.init();
    const hamburger = document.getElementById('mobile-menu-btn');

    // Visibilidade responsiva
    const updateHamburgerVisibility = () => {
      const show = window.innerWidth <= 768;
      hamburger.style.display = show ? 'flex' : 'none';
      if (!show) MobileMenu.close(); // Fecha ao voltar para desktop
    };
    updateHamburgerVisibility();

    // Usa ResizeObserver para ser mais confiável que resize event
    const resizeObs = new ResizeObserver(() => updateHamburgerVisibility());
    resizeObs.observe(document.body);

    hamburger.addEventListener('click', () => {
      MobileMenu.toggle();
      // O toggle já vai chamar open() ou close(), que agora ajusta tudo
      hamburger.setAttribute('aria-expanded', String(MobileMenu.isOpen()));
      hamburger.querySelector('i').className = MobileMenu.isOpen() ? 'fas fa-xmark' : 'fas fa-bars';
    });

    // ── Seletor de curso (aluno) ──────────────────────────────
    if (session.role === 'ALUNO') this._initAlunoCursoswitcher(session);
  },

  async _initAlunoCursoswitcher(session) {
    const wrap   = document.getElementById('aluno-course-switcher-wrap');
    const select = document.getElementById('aluno-curso-select');
    if (!wrap || !select) return;
    try {
      const cursos = await UserService.getCursos();
      const meusCursos = [];
      for (const c of cursos) {
        try {
          const alunos = await UserService.getAlunosByCurso(c.id);
          if (alunos.some(a => a.id === session.profileId)) meusCursos.push(c);
        } catch { /* ignora */ }
      }
      if (meusCursos.length <= 1) return;
      wrap.classList.remove('hidden');
      const cursoAtivo = Storage.getAlunoCursoAtivo() || meusCursos[0]?.id;
      if (!Storage.getAlunoCursoAtivo()) Storage.setAlunoCursoAtivo(meusCursos[0]?.id);
      
      // Limpeza de segurança (caso chame novamente)
      select.innerHTML = meusCursos.map(c =>
        `<option value="${c.id}" ${c.id === cursoAtivo ? 'selected' : ''}>${Helpers.escHtml(c.nome)}</option>`
      ).join('');
      
      select.value = String(cursoAtivo);
      select.addEventListener('change', () => {
        Storage.setAlunoCursoAtivo(Number(select.value));
        Router.navigate(Router.currentRoute || 'aluno/dashboard');
      });
    } catch { /* silencioso */ }
  },
};

window.MobileMenu = MobileMenu;
window.Navbar     = Navbar;