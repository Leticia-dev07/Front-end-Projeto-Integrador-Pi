/**
 * components/toast/toast.js
 * Non-blocking notification toasts.
 */
const Toast = {
  _icons: { success: 'fas fa-check-circle', error: 'fas fa-circle-xmark', warning: 'fas fa-triangle-exclamation', info: 'fas fa-circle-info' },

  show(type = 'info', title, message = '', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <i class="toast-icon ${this._icons[type] || this._icons.info}"></i>
      <div class="toast-content">
        <p class="toast-title">${Helpers.escHtml(title)}</p>
        ${message ? `<p class="toast-message">${Helpers.escHtml(message)}</p>` : ''}
      </div>
      <i class="toast-close fas fa-xmark" role="button" aria-label="Fechar"></i>
    `;

    const close = () => {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 300);
    };

    el.querySelector('.toast-close').addEventListener('click', close);
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));

    if (duration > 0) setTimeout(close, duration);
    return el;
  },

  success(title, msg, dur) { return this.show('success', title, msg, dur); },
  error(title, msg, dur)   { return this.show('error',   title, msg, dur); },
  warning(title, msg, dur) { return this.show('warning', title, msg, dur); },
  info(title, msg, dur)    { return this.show('info',    title, msg, dur); },
};

window.Toast = Toast;
