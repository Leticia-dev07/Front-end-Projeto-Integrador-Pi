/**
 * utils/theme.js — AcadFlow
 * Gerencia alternância light/dark e persiste a preferência.
 */
const Theme = {
  _current: 'light',

  /** Aplica o tema no <html data-theme="..."> */
  apply(theme) {
    this._current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    Storage.setTheme(theme);

    // Atualiza ícone do botão na navbar
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = theme === 'dark'
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
      btn.title = theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro';
    }
  },

  toggle() {
    this.apply(this._current === 'dark' ? 'light' : 'dark');
  },

  /** Inicializa com a preferência salva ou do sistema */
  init() {
    const saved = Storage.getTheme();
    if (saved) {
      this.apply(saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.apply(prefersDark ? 'dark' : 'light');
    }
  },

  get current() { return this._current; },
};
window.Theme = Theme;
