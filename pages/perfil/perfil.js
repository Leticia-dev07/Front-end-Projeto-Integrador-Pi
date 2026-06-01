/**
 * pages/perfil/perfil.js — AcadFlow
 * Edição de perfil para Admin, Coordenador e Aluno.
 * Endpoints:
 *   PUT /admins/{id}        body: SuperAdmin entity { name, email, password }
 *   PUT /coordenadores/{id} body: CoordenadorDTO    { name, email, password }
 *   PUT /alunos/{id}        body: AlunoDTO          { name, email, matricula, turma, senha }
 */
const PerfilPage = {
  async render() {
    const session   = Storage.getSession();
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-header stagger">
        <h1>Meu Perfil</h1>
        <p>Gerencie suas informações pessoais e senha de acesso</p>
      </div>
      <div class="page-enter" style="display:flex;align-items:center;justify-content:center;padding:var(--space-12)">
        <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--gray-300)"></i>
      </div>`;

    // Busca dados atuais do perfil
    let perfil = null;
    try {
      if (session.role === 'ADMIN') {
        const list = await UserService.getAdmins();
        perfil = list.find(u => u.email === session.email) || list[0];
      } else if (session.role === 'COORDENADOR') {
        const list = await UserService.getCoordenadores();
        perfil = list.find(u => u.email === session.email);
      } else {
        const list = await UserService.getAlunos();
        perfil = list.find(u => u.email === session.email);
      }
    } catch(e) { Toast.error('Erro', e.message); }

    const initials = Helpers.initials(perfil?.name || session.name || '?');
    const isAluno  = session.role === 'ALUNO';

    container.innerHTML = `
      <div class="page-header stagger">
        <h1>Meu Perfil</h1>
        <p>Gerencie suas informações pessoais e senha de acesso</p>
      </div>

      <div style="display:grid;grid-template-columns:280px 1fr;gap:var(--space-6);max-width:900px" class="stagger">

        <!-- Card avatar -->
        <div class="card" style="height:fit-content">
          <div class="card-body" style="display:flex;flex-direction:column;align-items:center;gap:var(--space-4);padding:var(--space-8) var(--space-6)">
            <div id="avatar-display" style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,var(--blue-400),var(--accent));display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:white;letter-spacing:-.04em;box-shadow:var(--shadow-accent)">
              ${initials}
            </div>
            <div style="text-align:center">
              <p style="font-weight:var(--fw-bold);font-size:var(--text-md)">${Helpers.escHtml(perfil?.name || session.name)}</p>
              <p style="font-size:var(--text-xs);color:var(--gray-400);margin-top:2px">${Helpers.escHtml(perfil?.email || session.email)}</p>
              <span class="badge badge-blue" style="margin-top:var(--space-2)">${Helpers.roleLabel(session.role)}</span>
            </div>
            ${isAluno ? `
            <div style="width:100%;padding:var(--space-3) var(--space-4);background:var(--gray-50);border-radius:var(--radius-md);border:1px solid var(--gray-100)">
              <p style="font-size:var(--text-xs);color:var(--gray-500);margin-bottom:4px">Matrícula</p>
              <p style="font-weight:var(--fw-semibold);font-size:var(--text-sm)">${Helpers.escHtml(perfil?.matricula||'—')}</p>
            </div>
            <div style="width:100%;padding:var(--space-3) var(--space-4);background:var(--gray-50);border-radius:var(--radius-md);border:1px solid var(--gray-100)">
              <p style="font-size:var(--text-xs);color:var(--gray-500);margin-bottom:4px">Turma</p>
              <p style="font-weight:var(--fw-semibold);font-size:var(--text-sm)">${Helpers.escHtml(perfil?.turma||'—')}</p>
            </div>
            <div style="width:100%;padding:var(--space-3) var(--space-4);background:var(--success-light);border-radius:var(--radius-md);border:1px solid #a7f3d0;text-align:center">
              <p style="font-size:var(--text-xs);color:#065f46;margin-bottom:2px">Horas Acumuladas</p>
              <p style="font-size:var(--text-2xl);font-weight:var(--fw-black);color:var(--success)">${perfil?.horasAcumuladas||0}h</p>
            </div>` : ''}
          </div>
        </div>

        <!-- Formulários -->
        <div style="display:flex;flex-direction:column;gap:var(--space-5)">

          <!-- Dados pessoais -->
          <div class="card">
            <div class="card-header">
              <span class="card-header-title"><i class="fas fa-user" style="color:var(--accent);margin-right:var(--space-2)"></i>Dados Pessoais</span>
            </div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:var(--space-4)">
                <div class="form-row cols-2">
                  <div class="form-group">
                    <label class="form-label">Nome completo <span class="required">*</span></label>
                    <div class="form-control-icon-wrap">
                      <i class="input-icon fas fa-user"></i>
                      <input id="p-name" class="form-control" value="${Helpers.escHtml(perfil?.name||session.name||'')}" placeholder="Seu nome" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">E-mail <span class="required">*</span></label>
                    <div class="form-control-icon-wrap">
                      <i class="input-icon fas fa-envelope"></i>
                      <input id="p-email" type="email" class="form-control" value="${Helpers.escHtml(perfil?.email||session.email||'')}" placeholder="seu@email.com" />
                    </div>
                  </div>
                </div>
                ${isAluno ? `
                <div class="form-row cols-2">
                  <div class="form-group">
                    <label class="form-label">Matrícula</label>
                    <input id="p-matricula" class="form-control" value="${Helpers.escHtml(perfil?.matricula||'')}" placeholder="Número de matrícula" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Turma</label>
                    <input id="p-turma" class="form-control" value="${Helpers.escHtml(perfil?.turma||'')}" placeholder="ADS-Noite" />
                  </div>
                </div>` : ''}
                <div style="display:flex;justify-content:flex-end">
                  <button class="btn btn-primary" id="btn-save-dados">
                    <i class="fas fa-floppy-disk"></i> Salvar alterações
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Alterar senha -->
          <div class="card">
            <div class="card-header">
              <span class="card-header-title"><i class="fas fa-lock" style="color:var(--accent);margin-right:var(--space-2)"></i>Alterar Senha</span>
            </div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:var(--space-4)">
                <div class="form-group">
                  <label class="form-label">Nova senha</label>
                  <div class="form-control-icon-wrap">
                    <i class="input-icon fas fa-lock"></i>
                    <input id="p-nova-senha" type="password" class="form-control has-right" placeholder="Mínimo 6 caracteres" />
                    <i class="input-icon-right fas fa-eye" id="toggle-nova-senha"></i>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Confirmar nova senha</label>
                  <div class="form-control-icon-wrap">
                    <i class="input-icon fas fa-lock"></i>
                    <input id="p-conf-senha" type="password" class="form-control has-right" placeholder="Repita a nova senha" />
                    <i class="input-icon-right fas fa-eye" id="toggle-conf-senha"></i>
                  </div>
                </div>
                <div style="display:flex;justify-content:flex-end">
                  <button class="btn btn-primary" id="btn-save-senha">
                    <i class="fas fa-key"></i> Alterar senha
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>`;

    this._bindEvents(session, perfil, isAluno);
  },

  _bindEvents(session, perfil, isAluno) {
    // Toggle password visibility
    ['toggle-nova-senha','toggle-conf-senha'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => {
        const inp  = document.getElementById(id.replace('toggle-','p-').replace('-nova','').replace('conf-','conf-'));
        // fix: get the sibling input
        const btn  = document.getElementById(id);
        const wrap = btn?.closest('.form-control-icon-wrap');
        const input= wrap?.querySelector('input');
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.className = `input-icon-right fas fa-eye${input.type==='text'?'-slash':''}`;
      });
    });

    // Salvar dados pessoais
    document.getElementById('btn-save-dados')?.addEventListener('click', async () => {
      const btn   = document.getElementById('btn-save-dados');
      const name  = document.getElementById('p-name')?.value.trim();
      const email = document.getElementById('p-email')?.value.trim();
      if (!name || !email) { Toast.error('Campos obrigatórios', 'Nome e e-mail são obrigatórios.'); return; }

      Loader.btnLoading(btn);
      try {
        let body = { name, email };
        if (isAluno) {
          body.matricula = document.getElementById('p-matricula')?.value.trim();
          body.turma     = document.getElementById('p-turma')?.value.trim();
        }
        if (session.role === 'ADMIN')        await UserService.updateAdmin(perfil.id, body);
        else if (session.role === 'COORDENADOR') await UserService.saveCoordenador(body, perfil.id);
        else                                  await UserService.saveAluno(body, perfil.id);

        // Atualiza sessão local
        const s = Storage.getSession();
        s.name = name; s.email = email; s.avatar = Helpers.initials(name);
        Storage.setSession(s);
        Navbar.render(s);
        Sidebar.render(s);
        Toast.success('Dados atualizados!', name);
      } catch(e) { Toast.error('Erro ao salvar', e.message); }
      finally    { Loader.btnDone(btn); }
    });

    // Alterar senha
    document.getElementById('btn-save-senha')?.addEventListener('click', async () => {
      const btn     = document.getElementById('btn-save-senha');
      const nova    = document.getElementById('p-nova-senha')?.value;
      const conf    = document.getElementById('p-conf-senha')?.value;
      if (!nova || nova.length < 6) { Toast.error('Senha inválida', 'A senha deve ter ao menos 6 caracteres.'); return; }
      if (nova !== conf)             { Toast.error('Senhas diferentes', 'A confirmação não confere.'); return; }

      Loader.btnLoading(btn);
      try {
        const body = { name: perfil?.name || session.name, email: perfil?.email || session.email };
        if (session.role === 'ADMIN')        { body.password = nova; await UserService.updateAdmin(perfil.id, body); }
        else if (session.role === 'COORDENADOR') { body.password = nova; await UserService.saveCoordenador(body, perfil.id); }
        else                                  { body.senha = nova; await UserService.saveAluno(body, perfil.id); }
        document.getElementById('p-nova-senha').value = '';
        document.getElementById('p-conf-senha').value = '';
        Toast.success('Senha alterada com sucesso!');
      } catch(e) { Toast.error('Erro ao alterar senha', e.message); }
      finally    { Loader.btnDone(btn); }
    });
  },
};
window.PerfilPage = PerfilPage;
