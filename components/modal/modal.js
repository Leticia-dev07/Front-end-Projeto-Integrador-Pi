/**
 * components/modal/modal.js
 * Reusable modal system.
 */
const Modal = {
  _stack: [],

  open({ title, body, footer, size = '', onClose }) {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');

    const modal = document.createElement('div');
    modal.className = `modal ${size ? 'modal-' + size : ''}`;
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" aria-label="Fechar"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    `;

    const close = () => this.close(modal, onClose);

    modal.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', close, { once: true });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }, { once: true });

    container.appendChild(modal);
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
      modal.classList.add('visible');
    });

    this._stack.push({ modal, close });
    return { modal, close };
  },

  close(modal, callback) {
    const overlay = document.getElementById('modal-overlay');
    modal.classList.remove('visible');
    overlay.classList.remove('visible');
    setTimeout(() => {
      modal.remove();
      if (!document.querySelector('.modal')) overlay.classList.add('hidden');
      if (callback) callback();
    }, 250);
    this._stack = this._stack.filter(m => m.modal !== modal);
  },

  closeAll() {
    [...this._stack].forEach(({ modal }) => this.close(modal));
  },

  /** Confirm dialog */
  confirm({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'danger', onConfirm }) {
    const iconClass = type === 'danger' ? 'fas fa-trash-can' : 'fas fa-triangle-exclamation';
    const { modal, close } = this.open({
      title,
      size: 'sm',
      body: `
        <div class="confirm-icon ${type}"><i class="${iconClass}"></i></div>
        <p style="text-align:center;color:var(--gray-600);font-size:var(--text-sm);line-height:1.6">${Helpers.escHtml(message)}</p>
      `,
      footer: `
        <button class="btn btn-secondary btn-cancel">${cancelText}</button>
        <button class="btn btn-${type === 'danger' ? 'danger' : 'primary'} btn-confirm">${confirmText}</button>
      `,
    });

    modal.querySelector('.btn-cancel').addEventListener('click', () => close());
    modal.querySelector('.btn-confirm').addEventListener('click', async () => {
      const btn = modal.querySelector('.btn-confirm');
      Loader.btnLoading(btn);
      try { await onConfirm(); close(); }
      catch (err) { Loader.btnDone(btn); Toast.error('Erro', err.message); }
    });
  },

  /** Form modal helper */
  form({ title, fields, onSubmit, size = '' }) {
    const body = `<form id="modal-form" novalidate class="stagger">${fields}</form>`;
    const footer = `
      <button class="btn btn-secondary btn-modal-cancel">Cancelar</button>
      <button class="btn btn-primary btn-modal-submit">Salvar</button>
    `;
    const { modal, close } = this.open({ title, body, footer, size });

    modal.querySelector('.btn-modal-cancel').addEventListener('click', () => close());
    modal.querySelector('.btn-modal-submit').addEventListener('click', async () => {
      const btn = modal.querySelector('.btn-modal-submit');
      const form = modal.querySelector('#modal-form');
      Loader.btnLoading(btn);
      try {
        await onSubmit(form, close);
        Loader.btnDone(btn);
      } catch (err) {
        Loader.btnDone(btn);
        Toast.error('Erro ao salvar', err.message);
      }
    });

    return { modal, close };
  },
};

window.Modal = Modal;
