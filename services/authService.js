/**
 * services/authService.js — AcadFlow
 * POST /auth/login → { token, role }
 * Enriquece sessão buscando perfil completo.
 */
const AuthService = {
  async login(email, password) {
    const data = await API.post('/auth/login', { email, password });
    const session = { token: data.token, role: data.role, email, name: '', avatar: '', profileId: null };
    Storage.setSession(session);
    await this._enrichSession(session);
    Storage.setSession(session);
    return session;
  },

  async _enrichSession(session) {
    try {
      if (session.role === 'ADMIN') {
        const list = await API.get('/admins');
        const me = list.find(u => u.email === session.email);
        if (me) { session.name = me.name; session.profileId = me.id; }
      } else if (session.role === 'COORDENADOR') {
        const list = await API.get('/coordenadores');
        const me = list.find(u => u.email === session.email);
        if (me) { session.name = me.name; session.profileId = me.id; }
      } else if (session.role === 'ALUNO') {
        const list = await API.get('/alunos');
        const me = list.find(u => u.email === session.email);
        if (me) { session.name = me.name; session.profileId = me.id; }
      }
    } catch (e) { console.warn('[Auth] enrich failed:', e.message); }
    if (!session.name) session.name = email.split('@')[0];
    session.avatar = Helpers.initials(session.name);
  },

  getSession() { return Storage.getSession(); },

  logout() {
    Storage.clearSession();
    const shell = document.getElementById('shell');
    if (shell) shell.classList.add('hidden');
    window.location.hash = '';
    window.location.reload();
  },
};
window.AuthService = AuthService;
