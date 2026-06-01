/**
 * pages/superadmin/curso-detalhe.js — AcadFlow
 *
 * CORREÇÕES APLICADAS:
 *
 * [FIX-1] Desvincular coordenador:
 *   Agora usa UserService.desvincularCoordCurso(coordId, cursoId) com
 *   a ordem correta dos parâmetros.
 *
 * [FIX-COORD-TROCA] Trocar coordenador:
 *   Implementado fluxo completo: desvincula o atual → vincula o novo.
 *   Usa o mesmo endpoint POST /coordenadores/{coordId}/cursos/{cursoId}.
 *
 * [FIX-ALUNO-VINCULAR] Vincular aluno existente ao curso:
 *   Novo botão "Matricular aluno existente" abre modal com select de alunos
 *   não matriculados e chama POST /alunos/{alunoId}/cursos/{cursoId}.
 *
 * [FIX-ALUNO-DESVINCULAR] Desvincular aluno do curso:
 *   Chama DELETE /alunos/{alunoId}/cursos/{cursoId}.
 *
 * [FIX-SAVE-CURSO] Vincular coordenador ao criar/editar curso:
 *   O retorno de saveCurso() agora é capturado corretamente.
 *   A ordem de operações garante que o ID do curso existe antes de vincular.
 */
const CursoDetalhePage = {

  async render(cursoId) {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-header stagger">
        <button class="btn btn-ghost btn-sm" onclick="Router.navigate('superadmin/cursos')" style="margin-bottom:var(--space-2)">
          <i class="fas fa-arrow-left"></i> Voltar para Cursos
        </button>
        <h1>Detalhes do Curso</h1>
        <p>Coordenadores, alunos, categorias e submissões</p>
      </div>
      <div class="page-enter" style="display:flex;align-items:center;justify-content:center;padding:var(--space-16)">
        <div style="text-align:center;color:var(--gray-300)">
          <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:var(--space-3)"></i>
          <p>Carregando detalhes...</p>
        </div>
      </div>`;

    try {
      const [curso, todosCoords, todosAlunos, allSubs, todasCats] = await Promise.all([
        UserService.getCurso(cursoId),
        UserService.getCoordenadores(),
        UserService.getAlunos(),
        ActivityService.getSubmissoes(),
        ActivityService.getCategorias(),
      ]);

      const alunosDoCurso = await UserService.getAlunosByCurso(cursoId).catch(() => []);
      const alunoIdsDoCurso = new Set(alunosDoCurso.map(a => a.id));
      const nomesAlunos     = new Set(alunosDoCurso.map(a => a.name));
      const subsDoCurso     = allSubs.filter(s => nomesAlunos.has(s.nomeAluno));
      const cats            = todasCats.filter(c => c.cursoId === cursoId);

      // Coordenador vinculado (o DTO retorna apenas 1, o primeiro do Set)
      const coordAtual      = curso.coordenador || null;
      // Coordenadores disponíveis para vincular (exceto o atual)
      const coordsDisponiveis = todosCoords.filter(c => c.id !== coordAtual?.id);
      // Alunos não matriculados neste curso (para matricular existente)
      const alunosNaoMatriculados = todosAlunos.filter(a => !alunoIdsDoCurso.has(a.id));

      const horasTotais = alunosDoCurso.reduce((a, al) => a + (al.horasAcumuladas || 0), 0);
      const mediaHoras  = alunosDoCurso.length ? Math.round(horasTotais / alunosDoCurso.length) : 0;

      container.innerHTML = `
        <div class="stagger">
          <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6)">
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('superadmin/cursos')">
              <i class="fas fa-arrow-left"></i> Voltar
            </button>
          </div>

          <!-- Banner do curso -->
          <div class="card" style="margin-bottom:var(--space-6);background:linear-gradient(135deg,var(--blue-900),var(--blue-700));color:white;border:none">
            <div class="card-body" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--space-4)">
              <div style="flex:1">
                <h2 style="font-size:var(--text-2xl);font-weight:var(--fw-black);letter-spacing:-.04em">${Helpers.escHtml(curso.nome)}</h2>
                <p style="opacity:.7;margin-top:var(--space-2)">${Helpers.escHtml(curso.descricao || 'Sem descrição cadastrada.')}</p>
              </div>
              <div style="display:flex;gap:var(--space-6);flex-wrap:wrap;text-align:center">
                ${[
                  ['fas fa-users', 'Alunos', alunosDoCurso.length],
                  ['fas fa-file-arrow-up', 'Submissões', subsDoCurso.length],
                  ['fas fa-hourglass-half', 'Carga Máx.', `${curso.cargaHorariaMax}h`],
                  ['fas fa-chart-line', 'Média Horas', `${mediaHoras}h`],
                ].map(([ic, lb, vl]) => `
                  <div>
                    <i class="${ic}" style="font-size:1.1rem;opacity:.6;margin-bottom:4px"></i>
                    <p style="font-size:var(--text-2xl);font-weight:var(--fw-black);line-height:1">${vl}</p>
                    <p style="font-size:.65rem;opacity:.55;margin-top:2px">${lb}</p>
                  </div>`).join('')}
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6)">

            <!-- Coordenador vinculado -->
            <div class="card">
              <div class="card-header">
                <span class="card-header-title">
                  <i class="fas fa-chalkboard-user" style="color:var(--accent);margin-right:var(--space-2)"></i>Coordenador
                </span>
                <!-- [FIX-COORD-TROCA] Botão para vincular/trocar coordenador -->
                <button class="btn btn-outline btn-sm" id="btn-vincular-coord">
                  <i class="fas fa-${coordAtual ? 'rotate' : 'link'}"></i>
                  ${coordAtual ? 'Trocar' : 'Vincular'}
                </button>
              </div>
              <div class="card-body" style="padding:0">
                ${coordAtual ? `
                <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-4) var(--space-5)">
                  <div class="avatar-sm" style="width:40px;height:40px;font-size:.9rem">${Helpers.initials(coordAtual.name)}</div>
                  <div style="flex:1">
                    <p style="font-weight:var(--fw-semibold)">${Helpers.escHtml(coordAtual.name)}</p>
                    <p style="font-size:var(--text-xs);color:var(--gray-400)">${Helpers.escHtml(coordAtual.email)}</p>
                  </div>
                  <!-- [FIX-1] Botão desvincular passa coordId correto -->
                  <button class="btn btn-ghost btn-sm" id="btn-desvincular-coord"
                    data-coord-id="${coordAtual.id}" data-coord-nome="${Helpers.escHtml(coordAtual.name)}"
                    title="Desvincular este coordenador">
                    <i class="fas fa-unlink" style="color:var(--danger)"></i>
                  </button>
                </div>` : `
                <div class="empty-state" style="padding:var(--space-8)">
                  <i class="fas fa-chalkboard-user empty-icon"></i>
                  <h3>Sem coordenador</h3>
                  <p>Vincule um coordenador responsável por este curso.</p>
                </div>`}
              </div>
            </div>

            <!-- Categorias -->
            <div class="card">
              <div class="card-header">
                <span class="card-header-title">
                  <i class="fas fa-tags" style="color:var(--accent);margin-right:var(--space-2)"></i>Categorias (${cats.length})
                </span>
              </div>
              <div class="card-body" style="padding:0;max-height:220px;overflow-y:auto">
                ${cats.length ? cats.map(c => `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-5);border-bottom:1px solid var(--gray-100)">
                    <div>
                      <p style="font-weight:var(--fw-medium);font-size:var(--text-sm)">${Helpers.escHtml(c.area)}</p>
                      <p style="font-size:var(--text-xs);color:var(--gray-400)">Lim: ${c.limiteSubmissoesSemestre}/sem.</p>
                    </div>
                    <span class="badge badge-blue">${c.horasPorCertificado}h</span>
                  </div>`).join('') :
                  `<div class="empty-state" style="padding:var(--space-8)">
                    <i class="fas fa-tags empty-icon"></i>
                    <h3>Sem categorias</h3>
                    <p>O coordenador pode cadastrá-las no menu Categorias.</p>
                  </div>`}
              </div>
            </div>
          </div>

          <!-- Alunos matriculados -->
          <div class="card" style="margin-bottom:var(--space-6)">
            <div class="card-header">
              <span class="card-header-title">
                <i class="fas fa-users" style="color:var(--accent);margin-right:var(--space-2)"></i>
                Alunos matriculados (${alunosDoCurso.length})
              </span>
              <div style="display:flex;gap:var(--space-2)">
                <!-- [FIX-ALUNO-VINCULAR] Botão matricular aluno existente -->
                ${alunosNaoMatriculados.length ? `
                <button class="btn btn-outline btn-sm" id="btn-matricular-existente">
                  <i class="fas fa-user-plus"></i> Matricular existente
                </button>` : ''}
                <button class="btn btn-primary btn-sm" id="btn-novo-aluno-curso">
                  <i class="fas fa-plus"></i> Novo aluno
                </button>
              </div>
            </div>
            <div class="card-body" style="padding:0">
              ${alunosDoCurso.length ? `
              <table class="data-table">
                <thead><tr><th>Aluno</th><th>Matrícula</th><th>Turma</th><th>Progresso</th><th style="width:60px">Ação</th></tr></thead>
                <tbody>
                  ${alunosDoCurso.map(a => {
                    const pct = Helpers.pct(a.horasAcumuladas || 0, curso.cargaHorariaMax || 200);
                    return `<tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:var(--space-2)">
                          <div class="avatar-sm">${Helpers.initials(a.name)}</div>
                          <div>
                            <p style="font-weight:var(--fw-semibold)">${Helpers.escHtml(a.name)}</p>
                            <p style="font-size:var(--text-xs);color:var(--gray-400)">${Helpers.escHtml(a.email)}</p>
                          </div>
                        </div>
                      </td>
                      <td><code style="font-size:var(--text-xs);background:var(--gray-100);padding:2px 6px;border-radius:4px">${a.matricula || '—'}</code></td>
                      <td><span class="badge badge-gray">${a.turma || '—'}</span></td>
                      <td>
                        <div style="min-width:120px">
                          <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);margin-bottom:3px">
                            <span>${a.horasAcumuladas || 0}h</span>
                            <span style="color:${pct >= 100 ? 'var(--success)' : pct >= 70 ? 'var(--warning)' : 'var(--gray-400)'};font-weight:600">${pct}%</span>
                          </div>
                          <div class="progress-bar-wrap">
                            <div class="progress-bar-fill ${Helpers.progressClass(pct)}" style="width:${pct}%"></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <!-- [FIX-ALUNO-DESVINCULAR] -->
                        <button class="btn btn-ghost btn-sm btn-desmatricular"
                          data-aluno-id="${a.id}"
                          data-aluno-nome="${Helpers.escHtml(a.name)}"
                          title="Desmatricular do curso">
                          <i class="fas fa-user-minus" style="color:var(--danger)"></i>
                        </button>
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>` :
              `<div class="empty-state" style="padding:var(--space-10)">
                <i class="fas fa-users empty-icon"></i>
                <h3>Nenhum aluno matriculado</h3>
                <p>Use os botões acima para adicionar alunos a este curso.</p>
              </div>`}
            </div>
          </div>

          <!-- Submissões recentes -->
          <div class="card">
            <div class="card-header">
              <span class="card-header-title">
                <i class="fas fa-file-arrow-up" style="color:var(--accent);margin-right:var(--space-2)"></i>
                Submissões (${subsDoCurso.length})
              </span>
            </div>
            <div class="card-body" style="padding:0">
              ${subsDoCurso.length ? `
              <table class="data-table">
                <thead><tr><th>Aluno</th><th>Categoria</th><th>Data</th><th>Status</th><th>Horas</th></tr></thead>
                <tbody>
                  ${subsDoCurso.slice(0, 10).map(s => `
                  <tr>
                    <td>${Helpers.escHtml(s.nomeAluno)}</td>
                    <td><span class="badge badge-blue">${Helpers.escHtml(s.nomeCategoria)}</span></td>
                    <td style="font-size:var(--text-xs);color:var(--gray-400)">${Helpers.formatDate(s.dataEnvio)}</td>
                    <td>${Helpers.statusBadge(s.status)}</td>
                    <td>${s.horasAproveitadas > 0 ? `<strong>${s.horasAproveitadas}h</strong>` : '—'}</td>
                  </tr>`).join('')}
                </tbody>
              </table>` :
              `<div class="empty-state" style="padding:var(--space-10)">
                <i class="fas fa-inbox empty-icon"></i>
                <h3>Sem submissões</h3>
              </div>`}
            </div>
          </div>
        </div>`;

      // Bind all event handlers
      this._bindEvents(cursoId, coordAtual, coordsDisponiveis, alunosNaoMatriculados, curso);

    } catch (e) {
      container.innerHTML += `
        <div style="padding:var(--space-6);color:var(--danger);background:var(--danger-light);border-radius:var(--radius-md);margin-top:var(--space-4)">
          <i class="fas fa-circle-exclamation"></i> ${Helpers.escHtml(e.message)}
        </div>`;
    }
  },

  _bindEvents(cursoId, coordAtual, coordsDisponiveis, alunosNaoMatriculados, curso) {

    // ── [FIX-COORD-TROCA] Vincular / Trocar coordenador ──────────────────────
    document.getElementById('btn-vincular-coord')?.addEventListener('click', () => {
      if (!coordsDisponiveis.length) {
        Toast.info('Sem coordenadores', 'Todos os coordenadores já estão vinculados a este curso.');
        return;
      }
      const opts = coordsDisponiveis.map(c =>
        `<option value="${c.id}">${Helpers.escHtml(c.name)} — ${Helpers.escHtml(c.email)}</option>`
      ).join('');

      Modal.form({
        title: coordAtual ? 'Trocar Coordenador' : 'Vincular Coordenador',
        size: 'sm',
        fields: `
          ${coordAtual ? `
          <div style="padding:var(--space-3) var(--space-4);background:var(--warning-light);border-radius:var(--radius-md);margin-bottom:var(--space-4);font-size:var(--text-sm);color:#92400e">
            <i class="fas fa-triangle-exclamation"></i>
            O coordenador atual (<strong>${Helpers.escHtml(coordAtual.name)}</strong>) será desvinculado.
          </div>` : ''}
          <div class="form-group">
            <label class="form-label">Novo coordenador <span class="required">*</span></label>
            <select id="f-coord-novo" class="form-control">
              <option value="">— Selecionar —</option>
              ${opts}
            </select>
          </div>`,
        onSubmit: async (form, close) => {
          const novoCoordId = Number(document.getElementById('f-coord-novo').value);
          if (!novoCoordId) throw new Error('Selecione um coordenador.');

          // [FIX-1] Desvincula o atual antes de vincular o novo
          if (coordAtual) {
            await UserService.desvincularCoordCurso(coordAtual.id, cursoId);
          }
          await UserService.vincularCoordCurso(novoCoordId, cursoId);
          Toast.success('Coordenador vinculado!');
          close();
          CursoDetalhePage.render(cursoId);
        },
      });
    });

    // ── [FIX-1] Desvincular coordenador atual ────────────────────────────────
    document.getElementById('btn-desvincular-coord')?.addEventListener('click', (e) => {
      const btn      = e.currentTarget;
      const coordId  = Number(btn.dataset.coordId);
      const nome     = btn.dataset.coordNome || 'este coordenador';

      Modal.confirm({
        title: 'Desvincular coordenador',
        message: `Remover ${nome} como responsável por este curso? O curso ficará sem coordenador.`,
        confirmText: 'Desvincular',
        type: 'danger',
        onConfirm: async () => {
          // [FIX-1] Ordem correta: coordId primeiro, cursoId segundo
          await UserService.desvincularCoordCurso(coordId, cursoId);
          Toast.success('Coordenador desvinculado.');
          CursoDetalhePage.render(cursoId);
        },
      });
    });

    // ── [FIX-ALUNO-VINCULAR] Matricular aluno existente ──────────────────────
    document.getElementById('btn-matricular-existente')?.addEventListener('click', () => {
      const opts = alunosNaoMatriculados.map(a =>
        `<option value="${a.id}">${Helpers.escHtml(a.name)} — Mat: ${Helpers.escHtml(a.matricula || '—')}</option>`
      ).join('');

      Modal.form({
        title: 'Matricular Aluno Existente',
        size: 'sm',
        fields: `
          <div class="form-group">
            <label class="form-label">Aluno <span class="required">*</span></label>
            <div class="form-control-icon-wrap">
              <i class="input-icon fas fa-search"></i>
              <select id="f-aluno-existente" class="form-control">
                <option value="">— Buscar aluno —</option>
                ${opts}
              </select>
            </div>
            <p class="form-hint">Exibindo apenas alunos ainda não matriculados neste curso.</p>
          </div>`,
        onSubmit: async (form, close) => {
          const alunoId = Number(document.getElementById('f-aluno-existente').value);
          if (!alunoId) throw new Error('Selecione um aluno.');
          // POST /alunos/{alunoId}/cursos/{cursoId}
          await UserService.matricularEmCurso(alunoId, cursoId);
          Toast.success('Aluno matriculado com sucesso!');
          close();
          CursoDetalhePage.render(cursoId);
        },
      });
    });

    // ── Cadastrar novo aluno e vincular ao curso ──────────────────────────────
    document.getElementById('btn-novo-aluno-curso')?.addEventListener('click', () => {
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
          </div>`,
        onSubmit: async (form, close) => {
          const name  = document.getElementById('f-name').value.trim();
          const email = document.getElementById('f-email').value.trim();
          const mat   = document.getElementById('f-mat').value.trim();
          const turma = document.getElementById('f-turma').value.trim();
          const senha = document.getElementById('f-senha').value;
          if (!name || !email || !mat || !turma) throw new Error('Preencha todos os campos obrigatórios.');
          if (!senha || senha.length < 6) throw new Error('Senha deve ter no mínimo 6 caracteres.');
          // POST /alunos/curso/{cursoId} — cria + vincula
          await UserService.saveAluno({ name, email, matricula: mat, turma, senha }, null, cursoId);
          Toast.success('Aluno cadastrado e matriculado!', name);
          close();
          CursoDetalhePage.render(cursoId);
        },
      });
    });

    // ── [FIX-ALUNO-DESVINCULAR] Desmatricular aluno ──────────────────────────
    document.querySelectorAll('.btn-desmatricular').forEach(btn => {
      btn.addEventListener('click', () => {
        const alunoId   = Number(btn.dataset.alunoId);
        const alunoNome = btn.dataset.alunoNome || 'este aluno';
        Modal.confirm({
          title: 'Desmatricular aluno',
          message: `Remover "${alunoNome}" deste curso? O cadastro do aluno não será deletado.`,
          confirmText: 'Desmatricular',
          type: 'danger',
          onConfirm: async () => {
            // DELETE /alunos/{alunoId}/cursos/{cursoId}
            await UserService.desvincularAlunoCurso(alunoId, cursoId);
            Toast.success('Aluno desmatriculado.', alunoNome);
            CursoDetalhePage.render(cursoId);
          },
        });
      });
    });
  },
};

window.CursoDetalhePage = CursoDetalhePage;
