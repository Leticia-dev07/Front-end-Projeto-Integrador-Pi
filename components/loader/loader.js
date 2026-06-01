/**
 * components/loader/loader.js
 */
const Loader = {
  /** Hide initial page loader */
  hidePageLoader() {
    const el = document.getElementById('page-loader');
    if (el) {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 500);
    }
  },

  /** Inline skeleton for a page area */
  skeleton(rows = 4) {
    return `
      <div class="stagger" style="padding:var(--space-4)">
        ${Array.from({ length: rows }).map(() => `
          <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-5);align-items:center">
            <div class="skeleton" style="width:40px;height:40px;border-radius:50%;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton skeleton-text wide"></div>
              <div class="skeleton skeleton-text short"></div>
            </div>
          </div>
        `).join('')}
      </div>`;
  },

  /** Stats skeleton */
  statsSkeleton(count = 4) {
    return `
      <div class="stats-grid stagger">
        ${Array.from({ length: count }).map(() => `<div class="skeleton skeleton-stat"></div>`).join('')}
      </div>`;
  },

  /** Set button to loading state */
  btnLoading(btn) {
    btn.disabled = true;
    btn.dataset.origHtml = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
  },

  /** Restore button */
  btnDone(btn) {
    btn.disabled = false;
    if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
  },
};

window.Loader = Loader;
