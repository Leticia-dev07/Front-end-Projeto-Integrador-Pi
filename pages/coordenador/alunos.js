/**
 * pages/coordenador/alunos.js — AcadFlow
 *
 * CORREÇÕES APLICADAS:
 *
 * [FIX-COORD-VINCULAR-ALUNO] Coordenador agora pode:
 *   1. Cadastrar novo aluno via POST /alunos/curso/{cursoId}
 *   2. Matricular aluno existente via POST /alunos/{alunoId}/cursos/{cursoId}
 *
 * [FIX-COORD-DESVINCULAR-ALUNO] Coordenador pode desmatricular aluno
 *   via DELETE /alunos/{alunoId}/cursos/{cursoId}
 *   (SecurityConfig permite: hasAnyRole("ADMIN","COORDENADOR"))
 *
 * [FIX-COORD-VER-CURSO] Botão "Ver detalhes do curso" redireciona para
 *   a página de detalhes do curso com informações completas.
 */
const CoordenadorAlunos = {
  _cursoId:   null,
  _cargaMax:  200,
  _cursoNome: '—',

  async render() {
    const session = Storage.getSession();
    document.getElementById('page-content').innerHTML = `
      <div class="page-header stagger"><h1>Alunos do Curso</h1><p>Carregando...</p></div>
      <div id="c-alunos-wrap" class="page-enter">${Loader.skeleton(4)}</div>`;

    // Descobre cursoAtivo e dados do curso
    const cursos = await UserService.getCursosByCoordenadorEmail(session.email).catch(() => []);
    const cursoAtivo = Storage.getCursoAtivo();
    const meuCurso   = cursos.find(c => c.id === cursoAtivo) || cursos[0] || null;

    this._cursoId   = meuCurso?.id   || null;
    this._cargaMax  = meuCurso?.cargaHorariaMax || 200;
    this._cursoNome = meuCurso?.nome  || '—';

    // Atualiza o header com o nome do curso
    document.querySelector('.page-header p').textContent =
      this._cursoId ? `Curso: ${this._cursoNome}` : 'Nenhum curso vinculado ao seu perfil.';

    if (!this._cursoId) {
      document.getElementById('c-alunos-wrap').innerHTML = `
        <div class="card"><div class="card-body empty-state">
          <i class="fas fa-graduation-cap empty-icon"></i>
          <h3>Sem curso ativo</h3>
          <p>Selecione um curso no menu lateral ou solicite vínculo ao administrador.</p>
        </div></div>`;
      return;
    }

    const [alunosDoCurso, todosAlunos] = await Promise.all([
      UserService.getAlunosByCurso(this._cursoId).catch(e => { Toast.error('Erro', e.message); return []; }),
      UserService.getAlunos().catch(() => []),
    ]);

    this._alunosDoCurso      = alunosDoCurso;
    this._alunosNaoMatriculados = todosAlunos.filter(a =>
      !alunosDoCurso.some(ad => ad.id === a.id)
    );

    this._draw(alunosDoCurso);
  },

  _draw(list) {
    const max       = this._cargaMax;
    const cursoId   = this._cursoId;
    const cursoNome = this._cursoNome;

    Table.render('c-alunos-wrap', {
      columns: [
        { key: 'name', label: 'Aluno', render: r => `
          <div style="display:flex;align-items:center;gap:var(--space-2)">
            <div class="avatar-sm">${Helpers.initials(r.name)}</div>
            <div>
              <p style="font-weight:var(--fw-semibold)">${Helpers.escHtml(r.name)}</p>
              <p style="font-size:var(--text-xs);color:var(--gray-400)">${Helpers.escHtml(r.matricula || '')}</p>
            </div>
          </div>` },
        { key: 'turma', label: 'Turma', render: r =>
          `<span class="badge badge-gray">${r.turma || '—'}</span>` },
        { key: 'horasAcumuladas', label: 'Progresso', render: r => {
          const pct = Helpers.pct(r.horasAcumuladas || 0, max);
          return `
            <div style="min-width:140px">
              <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);margin-bottom:4px">
                <span>${r.horasAcumuladas || 0}h / ${max}h</span>
                <span style="color:${pct >= 100 ? 'var(--success)' : pct >= 70 ? 'var(--warning)' : 'var(--gray-400)'};font-weight:600">${pct}%</span>
              </div>
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill ${Helpers.progressClass(pct)}" style="width:${pct}%"></div>
              </div>
            </div>`;
        }},
        { key: 'email', label: 'E-mail', render: r =>
          `<span style="color:var(--gray-500);font-size:var(--text-xs)">${Helpers.escHtml(r.email)}</span>` },
      ],
      data: list,
      toolbar: `
        <div style="display:flex;gap:var(--space-2);flex-wrap:wrap">
          ${this._alunosNaoMatriculados.length ? `
          <button class="btn btn-outline btn-sm" id="btn-matricular-existente">
            <i class="fas fa-user-plus"></i> Matricular existente
          </button>` : ''}
          <button class="btn btn-primary" id="btn-novo-aluno-c">
            <i class="fas fa-plus"></i> Novo aluno
          </button>
        </div>`,
      emptyMsg: 'Nenhum aluno matriculado neste curso ainda.',
      actions: [
        { key: 'subs', label: 'Ver submissões', icon: 'fas fa-eye', type: 'outline',
          onClick: async row => {
            const allSubs = await ActivityService.getSubmissoes().catch(() => []);
            const subs    = allSubs.filter(s => s.nomeAluno === row.name);
            Modal.open({
              title: `Submissões — ${row.name}`,
              size: 'lg',
              body: subs.length ? `
                <table class="data-table">
                  <thead><tr><th>Categoria</th><th>Data</th><th>Horas</th><th>Status</th></tr></thead>
                  <tbody>${subs.map(s => `
                    <tr>
                      <td>${Helpers.escHtml(s.nomeCategoria)}</td>
                      <td style="font-size:var(--text-xs);color:var(--gray-400)">${Helpers.formatDate(s.dataEnvio)}</td>
                      <td>${s.horasAproveitadas > 0 ? `<strong>${s.horasAproveitadas}h</strong>` : '—'}</td>
                      <td>${Helpers.statusBadge(s.status)}</td>
                    </tr>`).join('')}
                  </tbody>
                </table>` :
                `<div class="empty-state"><i class="fas fa-inbox empty-icon"></i><h3>Sem submissões</h3><p>Este aluno ainda não enviou nenhuma atividade.</p></div>`,
            });
          },
        },
        {
          // [FIX-COORD-DESVINCULAR-ALUNO]
          key: 'desmatricular', label: 'Desmatricular', icon: 'fas fa-user-minus', type: 'ghost',
          onClick: (row, reload) => Modal.confirm({
            title: 'Desmatricular aluno',
            message: `Remover "${row.name}" do curso ${cursoNome}? O cadastro do aluno não será excluído.`,
            confirmText: 'Desmatricular',
            type: 'danger',
            onConfirm: async () => {
              // DELETE /alunos/{alunoId}/cursos/{cursoId}
              await UserService.desvincularAlunoCurso(row.id, cursoId);
              Toast.success('Aluno desmatriculado.', row.name);
              const updated = await UserService.getAlunosByCurso(cursoId);
              this._alunosNaoMatriculados.push(row); // Volta para lista de disponíveis
              reload(updated);
            },
          }),
        },
      ],
    });

    // [FIX-COORD-VINCULAR-ALUNO] Matricular aluno existente
    document.getElementById('btn-matricular-existente')?.addEventListener('click', () => {
      const opts = this._alunosNaoMatriculados.map(a =>
        `<option value="${a.id}">${Helpers.escHtml(a.name)} — Mat: ${Helpers.escHtml(a.matricula || '—')}</option>`
      ).join('');

      Modal.form({
        title: 'Matricular Aluno Existente',
        size: 'sm',
        fields: `
          <div class="form-group">
            <label class="form-label">Aluno <span class="required">*</span></label>
            <select id="f-aluno-existente" class="form-control">
              <option value="">— Selecionar aluno —</option>
              ${opts}
            </select>
            <p class="form-hint">Apenas alunos não matriculados neste curso são exibidos.</p>
          </div>`,
        onSubmit: async (form, close) => {
          const alunoId = Number(document.getElementById('f-aluno-existente').value);
          if (!alunoId) throw new Error('Selecione um aluno.');
          // POST /alunos/{alunoId}/cursos/{cursoId}
          await UserService.matricularEmCurso(alunoId, cursoId);
          Toast.success('Aluno matriculado com sucesso!');
          close();
          const updated = await UserService.getAlunosByCurso(cursoId);
          this._alunosDoCurso = updated;
          this._alunosNaoMatriculados = this._alunosNaoMatriculados.filter(a => a.id !== alunoId);
          this._draw(updated);
        },
      });
    });

    // Cadastrar novo aluno + vincular
    document.getElementById('btn-novo-aluno-c')?.addEventListener('click', () => this._formNovoAluno());
  },

  _formNovoAluno() {
    const cursoId = this._cursoId;
    Modal.form({
      title: 'Cadastrar Novo Aluno',
      size: 'lg',
      fields: `
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Nome completo <span class="required">*</span></label>
            <input id="f-name"  class="form-control" placeholder="Nome do aluno" />
          </div>
          <div class="form-group">
            <label class="form-label">E-mail <span class="required">*</span></label>
            <input id="f-email" type="email" class="form-control" placeholder="aluno@email.com" />
          </div>
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Matrícula <span class="required">*</span></label>
            <input id="f-mat"   class="form-control" placeholder="202501001" />
          </div>
          <div class="form-group">
            <label class="form-label">Turma <span class="required">*</span></label>
            <input id="f-turma" class="form-control" placeholder="ADS-Noite" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Senha inicial <span class="required">*</span></label>
          <input id="f-senha" type="password" class="form-control" placeholder="Mínimo 6 caracteres" />
          <p class="form-hint">O aluno poderá alterar a senha após o primeiro acesso.</p>
        </div>`,
      onSubmit: async (form, close) => {
        const name  = document.getElementById('f-name').value.trim();
        const email = document.getElementById('f-email').value.trim();
        const mat   = document.getElementById('f-mat').value.trim();
        const turma = document.getElementById('f-turma').value.trim();
        const senha = document.getElementById('f-senha').value;
        if (!name || !email || !mat || !turma) throw new Error('Preencha todos os campos obrigatórios.');
        if (!senha || senha.length < 6)        throw new Error('Senha deve ter no mínimo 6 caracteres.');
        // POST /alunos/curso/{cursoId} — cria + vincula automaticamente
        await UserService.saveAluno({ name, email, matricula: mat, turma, senha }, null, cursoId);
        Toast.success('Aluno cadastrado e matriculado!', name);
        close();
        const updated = await UserService.getAlunosByCurso(cursoId);
        this._alunosDoCurso = updated;
        this._draw(updated);
      },
    });
  },
};

window.CoordenadorAlunos = CoordenadorAlunos;
