/**
 * services/api.js — AcadFlow
 * Camada base HTTP. Token JWT injetado automaticamente.
 * Base URL: https://back-end-projeto-integrador.onrender.com
 */
const API = {
  BASE: 'https://back-end-projeto-integrador.onrender.com',

  _headers(extra = {}) {
    const h = { 'Accept': 'application/json', ...extra };
    const session = Storage.getSession();
    if (session?.token) h['Authorization'] = `Bearer ${session.token}`;
    return h;
  },

  async _fetch(path, options = {}) {
    const url = this.BASE + path;
    try {
      const res = await fetch(url, options);
      if (res.status === 204) return null;
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        return ct.includes('application/json') ? res.json() : null;
      }
      let msg = `Erro ${res.status}`;
      try { const b = await res.json(); msg = b.message || b.error || msg; } catch {}
      if (res.status === 401) {
        Storage.clearSession();
        window.location.hash = '#/login';
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      if (res.status === 403) throw new Error('Sem permissão para esta ação.');
      if (res.status === 404) throw new Error('Recurso não encontrado.');
      throw new Error(msg);
    } catch (err) {
      if (err.message.match(/Sessão|permissão|Erro \d|encontrado/)) throw err;
      throw new Error('Falha na conexão com o servidor.');
    }
  },

  get(p)            { return this._fetch(p, { headers: this._headers() }); },
  post(p, b)        { return this._fetch(p, { method:'POST',   headers: this._headers({'Content-Type':'application/json'}), body: JSON.stringify(b) }); },
  put(p, b)         { return this._fetch(p, { method:'PUT',    headers: this._headers({'Content-Type':'application/json'}), body: b !== undefined ? JSON.stringify(b) : undefined }); },
  putEmpty(p)       { return this._fetch(p, { method:'PUT',    headers: this._headers() }); },
  del(p)            { return this._fetch(p, { method:'DELETE', headers: this._headers() }); },
  postMultipart(p, fd) { return this._fetch(p, { method:'POST', headers: this._headers(), body: fd }); },
};
window.API = API;
