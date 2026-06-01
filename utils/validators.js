/**
 * utils/validators.js
 * Form validation helpers.
 */
const Validators = {
  required: (v) => (v !== null && v !== undefined && String(v).trim() !== '') || 'Campo obrigatório.',
  email:    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'E-mail inválido.',
  minLen:   (n) => (v) => (String(v).trim().length >= n) || `Mínimo ${n} caracteres.`,
  maxLen:   (n) => (v) => (String(v).trim().length <= n) || `Máximo ${n} caracteres.`,
  number:   (v) => (!isNaN(Number(v)) && v !== '') || 'Deve ser um número.',
  positive: (v) => (Number(v) > 0) || 'Deve ser positivo.',
  min:      (n) => (v) => (Number(v) >= n) || `Mínimo: ${n}.`,
  max:      (n) => (v) => (Number(v) <= n) || `Máximo: ${n}.`,

  /** Run rules against a value, return first error or null */
  run(value, rules = []) {
    for (const rule of rules) {
      const result = rule(value);
      if (result !== true) return result;
    }
    return null;
  },

  /** Validate entire form. Returns { valid, errors:{fieldName: msg} } */
  form(data, schema) {
    const errors = {};
    for (const [field, rules] of Object.entries(schema)) {
      const err = Validators.run(data[field], rules);
      if (err) errors[field] = err;
    }
    return { valid: Object.keys(errors).length === 0, errors };
  },

  /** Show/clear inline error on a field */
  showError(inputEl, msg) {
    if (!inputEl) return;
    inputEl.classList.add('error');
    let errEl = inputEl.parentElement.querySelector('.form-error');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.className = 'form-error';
      inputEl.insertAdjacentElement('afterend', errEl);
    }
    errEl.innerHTML = `<i class="fas fa-circle-exclamation"></i>${msg}`;
  },

  clearError(inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove('error');
    const errEl = inputEl.parentElement?.querySelector('.form-error');
    if (errEl) errEl.remove();
  },

  clearAll(form) {
    form.querySelectorAll('.form-control.error').forEach(el => Validators.clearError(el));
  },
};

window.Validators = Validators;
