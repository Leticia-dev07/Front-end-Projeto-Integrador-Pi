/**
 * pages/login/login.js — AcadFlow
 */
const LoginPage = {
  render() {
    const auth = document.getElementById('auth-container');
    auth.innerHTML = `
      <div class="auth-page page-enter">
        <div class="auth-left">
          <div class="auth-brand">
            <div class="auth-brand-icon"><i class="fas fa-graduation-cap"></i></div>
            <span class="auth-brand-name">AcadFlow</span>
          </div>
          <div class="auth-hero">
            <h2>Gestão inteligente de atividades complementares.</h2>
            <p>Plataforma completa para submissão, acompanhamento e aprovação de certificados acadêmicos para toda a instituição.</p>
          </div>
          <div style="display:flex;gap:var(--space-6)">
            ${[['JWT','Autenticação real'],['BCrypt','Senhas seguras'],['S3','Upload na nuvem']].map(([t,s])=>`
              <div style="color:rgba(255,255,255,.5);font-size:var(--text-xs)">
                <p style="font-size:var(--text-2xl);font-weight:800;color:white;line-height:1">${t}</p>
                <p>${s}</p>
              </div>`).join('')}
          </div>
        </div>

        <div class="auth-right">
          <div class="auth-form-wrap">
            <h1 class="auth-form-title">Bem-vindo de volta</h1>
            <p class="auth-form-sub">Acesse sua conta para continuar</p>

            <div style="background:var(--info-light);border:1px solid #a5f3fc;border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-xs);color:#0e7490;display:flex;align-items:flex-start;gap:var(--space-2)">
              <i class="fas fa-circle-info" style="margin-top:1px;flex-shrink:0"></i>
              <span>Servidor no Render (plano gratuito). Primeira requisição pode levar até <strong>30 segundos</strong>.</span>
            </div>

            <div id="login-error" class="hidden" style="background:var(--danger-light);color:var(--danger);padding:var(--space-3) var(--space-4);border-radius:var(--radius-md);font-size:var(--text-sm);margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-2)">
              <i class="fas fa-circle-exclamation"></i><span id="login-error-msg"></span>
            </div>

            <form id="login-form" novalidate>
              <div class="form-group" style="margin-bottom:var(--space-4)">
                <label class="form-label">E-mail</label>
                <div class="form-control-icon-wrap">
                  <i class="input-icon fas fa-envelope"></i>
                  <input id="login-email" type="email" class="form-control" placeholder="seu@email.com" autocomplete="email" />
                </div>
              </div>
              <div class="form-group" style="margin-bottom:var(--space-5)">
                <label class="form-label">Senha</label>
                <div class="form-control-icon-wrap">
                  <i class="input-icon fas fa-lock"></i>
                  <input id="login-senha" type="password" class="form-control has-right" placeholder="••••••••" autocomplete="current-password" />
                  <i class="input-icon-right fas fa-eye" id="toggle-pass"></i>
                </div>
              </div>
              <div class="form-check" style="margin-bottom:var(--space-6)">
                <input type="checkbox" id="remember-me" />
                <label for="remember-me">Lembrar meu e-mail</label>
              </div>
              <button type="submit" class="btn btn-primary btn-lg" style="width:100%" id="login-btn">
                <i class="fas fa-right-to-bracket"></i> Entrar
              </button>
            </form>

            <div class="auth-demo-users">
              <p class="auth-demo-title">Credenciais de demonstração</p>
              ${[
                ['fas fa-shield-halved','SuperAdmin','admin@senac.com','123456'],
                ['fas fa-chalkboard-user','Coordenador','coordenador@senac.com','123456'],
                ['fas fa-user-graduate','Aluno','aluno@senac.com','123456'],
              ].map(([ic,role,email,pass])=>`
                <button class="demo-user-btn" data-email="${email}" data-pass="${pass}">
                  <i class="${ic}"></i>
                  <span><strong>${role}</strong> — ${email}</span>
                </button>`).join('')}
            </div>
          </div>
        </div>
      </div>`;

    this._bindEvents();
    const rem = Storage.getRemember();
    if (rem) { document.getElementById('login-email').value=rem; document.getElementById('remember-me').checked=true; }
  },

  _bindEvents() {
    document.getElementById('toggle-pass').addEventListener('click',()=>{
      const inp=document.getElementById('login-senha'), icon=document.getElementById('toggle-pass');
      inp.type=inp.type==='password'?'text':'password';
      icon.className=`input-icon-right fas fa-eye${inp.type==='text'?'-slash':''}`;
    });

    document.querySelectorAll('.demo-user-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.getElementById('login-email').value=btn.dataset.email;
        document.getElementById('login-senha').value=btn.dataset.pass;
        document.getElementById('login-form').dispatchEvent(new Event('submit'));
      });
    });

    document.getElementById('login-form').addEventListener('submit', async e=>{
      e.preventDefault();
      const btn      = document.getElementById('login-btn');
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-senha').value;
      const remember = document.getElementById('remember-me').checked;
      const errBox   = document.getElementById('login-error');
      const errMsg   = document.getElementById('login-error-msg');
      errBox.classList.add('hidden');
      if (!email||!password){ errMsg.textContent='Preencha e-mail e senha.'; errBox.classList.remove('hidden'); return; }
      Loader.btnLoading(btn);
      try {
        const session = await AuthService.login(email, password);
        if (remember) Storage.setRemember(email); else Storage.clearRemember();
        document.getElementById('auth-container').innerHTML='';
        App.initShell(session);
      } catch(err) {
        errMsg.textContent=err.message;
        errBox.classList.remove('hidden');
      } finally { Loader.btnDone(btn); }
    });
  },
};
window.LoginPage = LoginPage;
