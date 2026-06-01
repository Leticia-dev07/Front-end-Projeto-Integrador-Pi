/**
 * utils/storage.js — AcadFlow
 * Sessão JWT, tema, curso ativo (coordenador e aluno).
 */
const Storage = {
  set(key, v)   { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} },
  get(key)      { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  remove(key)   { try { localStorage.removeItem(key); } catch {} },

  // ── Sessão ──────────────────────────────────────────────
  setSession(u) { this.set('af_session', u); },
  getSession()  { return this.get('af_session'); },
  clearSession(){ this.remove('af_session'); this.remove('af_curso_ativo'); this.remove('af_aluno_curso_ativo'); },

  // ── Lembrar e-mail ──────────────────────────────────────
  setRemember(e){ this.set('af_remember', e); },
  getRemember() { return this.get('af_remember') || ''; },
  clearRemember(){ this.remove('af_remember'); },

  // ── Curso ativo — Coordenador ───────────────────────────
  setCursoAtivo(id) { this.set('af_curso_ativo', id); },
  getCursoAtivo()   { return this.get('af_curso_ativo'); },

  // ── Curso ativo — Aluno (suporte a múltiplos cursos) ────
  setAlunoCursoAtivo(id) { this.set('af_aluno_curso_ativo', id); },
  getAlunoCursoAtivo()   { return this.get('af_aluno_curso_ativo'); },

  // ── Tema (light / dark) ─────────────────────────────────
  setTheme(t)  { this.set('af_theme', t); },
  getTheme()   { return this.get('af_theme') || 'light'; },
};
window.Storage = Storage;
