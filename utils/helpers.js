/**
 * utils/helpers.js — AcadFlow
 */
const Helpers = {
  formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
  },

  timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'agora mesmo';
    if (mins < 60) return `há ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `há ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `há ${days} dia${days > 1 ? 's' : ''}`;
    return Helpers.formatDate(iso);
  },

  initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  },

  statusBadge(status) {
    const map = {
      PENDENTE:  { cls: 'badge-pending',  label: 'Pendente'  },
      APROVADO:  { cls: 'badge-approved', label: 'Aprovado'  },
      REJEITADO: { cls: 'badge-rejected', label: 'Rejeitado' },
    };
    const s = map[status] || { cls: 'badge-gray', label: status || '—' };
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  },

  roleLabel(role) {
    return { ADMIN: 'SuperAdmin', COORDENADOR: 'Coordenador', ALUNO: 'Aluno' }[role] || role;
  },

  debounce(fn, ms = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },

  async delay(ms = 300) { return new Promise(r => setTimeout(r, ms)); },

  clamp(v, min, max) { return Math.min(max, Math.max(min, v)); },

  pct(val, total) {
    if (!total) return 0;
    return Math.round(Helpers.clamp((val / total) * 100, 0, 100));
  },

  escHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  sortBy(arr, key, dir = 'asc') {
    return [...arr].sort((a, b) => {
      const va = a[key] ?? '', vb = b[key] ?? '';
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return dir === 'asc' ? cmp : -cmp;
    });
  },

  progressClass(pct) {
    if (pct >= 100) return 'success';
    if (pct >= 70)  return 'warning';
    return '';
  },
};
window.Helpers = Helpers;
