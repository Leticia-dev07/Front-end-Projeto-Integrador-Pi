/**
 * pages/coordenador/curso-detalhe.js — AcadFlow
 *
 * [FIX-COORD-VER-CURSO] Página de detalhes do curso para o coordenador.
 * Exibe informações gerais, categorias, alunos e submissões.
 * O coordenador visualiza apenas o curso ativo (sem editar vínculos).
 * [FIX-ISOLAMENTO-CURSO] Submissões buscadas diretamente na API pelo cursoId.
 * [FIX-COR-NOME-CURSO] Forçado color:#ffffff !important apenas no Nome do Curso 
 * (e sua descrição) dentro do banner para ignorar as regras do tema claro.
 */
const CoordenadorCursoDetalhe = {
  async render() {
    const session   = Storage.getSession();
    const container = document.getElementById('page-content');

    container.innerHTML = `
      <div class="page-header stagger">
        <button class="btn btn-ghost btn-sm" onclick="Router.navigate('coordenador/dashboard')" style="margin-bottom:var(--space-2)">
          <i class="fas fa-arrow-left"></i> Voltar ao Dashboard
        </button>
        <h1>Detalhes do Curso</h1>
        <p>Informações completas do seu curso</p>
      </div>
      <div class="page-enter" style="display:flex;align-items:center;justify-content:center;padding:var(--space-16)">
        <div style="text-align:center;color:var(--gray-300)">
          <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:var(--space-3)"></i>
          <p>Carregando...</p>
        </div>
      </div>`;

    // Descobre o curso ativo do coordenador
    let cursos = [];
    try {
      if (session.profileId) {
        cursos = await UserService.getCursosByCoordenadorId(session.profileId);
      }
      if (!cursos.length && session.email) {
        cursos = await UserService.getCursosByCoordenadorEmail(session.email);
      }
    } catch { cursos = []; }

    const cursoAtivo = Storage.getCursoAtivo();
    const cursoObj   = cursos.find(c => c.id === cursoAtivo) || cursos[0] || null;

    if (!cursoObj) {
      container.innerHTML = `
        <div class="page-header stagger"><h1>Detalhes do Curso</h1></div>
        <div class="card"><div class="card-body empty-state">
          <i class="fas fa-graduation-cap empty-icon"></i>
          <h3>Nenhum curso encontrado</h3>
          <p>Seu perfil não está vinculado a nenhum curso. Contate o administrador.</p>
        </div></div>`;
      return;
    }

    const cursoId = cursoObj.id;

    try {
      const [alunosDoCurso, subsDoCurso, todasCats] = await Promise.all([
        UserService.getAlunosByCurso(cursoId).catch(() => []),
        ActivityService.getSubmissoesPorCurso(cursoId).catch(() => []),
        ActivityService.getCategorias().catch(() => []),
      ]);

      const cats        = todasCats.filter(c => c.cursoId === cursoId);

      const horasTotais = alunosDoCurso.reduce((a, al) => a + (al.horasAcumuladas || 0), 0);
      const mediaHoras  = alunosDoCurso.length ? Math.round(horasTotais / alunosDoCurso.length) : 0;

      const pendentes  = subsDoCurso.filter(s => s.status === 'PENDENTE').length;
      const aprovadas  = subsDoCurso.filter(s => s.status === 'APROVADO').length;
      const rejeitadas = subsDoCurso.filter(s => s.status === 'REJEITADO').length;

      container.innerHTML = `
        <div class="stagger">

          <div style="margin-bottom:var(--space-5)">
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('coordenador/dashboard')">
              <i class="fas fa-arrow-left"></i> Voltar
            </button>
          </div>

          <!-- Banner do curso (A cor branca forçada no Nome do Curso com !important) -->
          <div class="card" style="margin-bottom:var(--space-6);background:linear-gradient(135deg,var(--blue-900),var(--blue-700));color:white;border:none">
            <div class="card-body" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--space-4)">
              <div style="flex:1">
                <span class="badge" style="background:rgba(255,255,255,.15);color:rgba(255,255,255,.85);margin-bottom:var(--space-3)">
                  <i class="fas fa-graduation-cap"></i> Curso
                </span>
                
                <!-- NOME DO CURSO -->
                <h2 style="font-size:var(--text-2xl);font-weight:var(--fw-black);letter-spacing:-.04em;margin-top:4px;color:#ffffff !important;">
                  ${Helpers.escHtml(cursoObj.nome)}
                </h2>
                
                <p style="opacity:.8;margin-top:var(--space-2);max-width:600px;line-height:1.6;color:#ffffff !important;">
                  ${Helpers.escHtml(cursoObj.descricao || 'Sem descrição cadastrada.')}
                </p>
              </div>
              
              <!-- NÚMEROS E ESTATÍSTICAS DO BANNER -->
              <div style="display:flex;gap:var(--space-6);flex-wrap:wrap;text-align:center">
                ${[
                  ['fas fa-hourglass-half', 'Carga Máxima', `${cursoObj.cargaHorariaMax}h`],
                  ['fas fa-users',           'Alunos',       alunosDoCurso.length],
                  ['fas fa-file-arrow-up',   'Submissões',   subsDoCurso.length],
                  ['fas fa-chart-line',      'Média Horas',  `${mediaHoras}h`],
                ].map(([ic, lb, vl]) => `
                  <div>
                    <i class="${ic}" style="font-size:1rem;opacity:.6;margin-bottom:4px;display:block;color:#ffffff !important;"></i>
                    <p style="font-size:var(--text-2xl);font-weight:var(--fw-black);line-height:1;color:#ffffff !important;">${vl}</p>
                    <p style="font-size:.65rem;opacity:.6;margin-top:2px;color:#ffffff !important;">${lb}</p>
                  </div>`).join('')}
              </div>
            </div>
          </div>

          <!-- Stats de submissões -->
          <div class="stats-grid stagger" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:var(--space-6)">
            ${Card.stat({ icon:'fas fa-file-arrow-up',  label:'Total Submissões', value: subsDoCurso.length, color:'blue'   })}
            ${Card.stat({ icon:'fas fa-clock',          label:'Pendentes',        value: pendentes,          color:'orange' })}
            ${Card.stat({ icon:'fas fa-circle-check',    label:'Aprovadas',        value: aprovadas,          color:'green'  })}
            ${Card.stat({ icon:'fas fa-circle-xmark',    label:'Rejeitadas',       value: rejeitadas,         color:'red'    })}
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6)">

            <!-- Categorias -->
            <div class="card">
              <div class="card-header">
                <span class="card-header-title">
                  <i class="fas fa-tags" style="color:var(--accent);margin-right:var(--space-2)"></i>
                  Categorias de Atividades (${cats.length})
                </span>
                <button class="btn btn-outline btn-sm" onclick="Router.navigate('coordenador/categorias')">
                  Gerenciar
                </button>
              </div>
              <div class="card-body" style="padding:0;max-height:280px;overflow-y:auto">
                ${cats.length ? cats.map(c => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-5);border-bottom:1px solid var(--gray-100)">
                  <div>
                    <p style="font-weight:var(--fw-medium);font-size:var(--text-sm)">${Helpers.escHtml(c.area)}</p>
                    <p style="font-size:var(--text-xs);color:var(--gray-400)">
                      Limite: ${c.limiteSubmissoesSemestre}/semestre
                      · ${c.exigeComprovante ? 'Exige comprovante' : 'Comprovante opcional'}
                    </p>
                  </div>
                  <span class="badge badge-blue">${c.horasPorCertificado}h</span>
                </div>`).join('') : `
                <div class="empty-state" style="padding:var(--space-8)">
                  <i class="fas fa-tags empty-icon"></i>
                  <h3>Sem categorias</h3>
                  <p>Crie categorias no menu lateral.</p>
                </div>`}
              </div>
            </div>

            <!-- Progresso dos alunos -->
            <div class="card">
              <div class="card-header">
                <span class="card-header-title">
                  <i class="fas fa-chart-bar" style="color:var(--accent);margin-right:var(--space-2)"></i>
                  Progresso dos Alunos
                </span>
              </div>
              <div class="card-body" style="padding:0;max-height:280px;overflow-y:auto">
                ${alunosDoCurso.length ? alunosDoCurso
                    .sort((a, b) => (b.horasAcumuladas || 0) - (a.horasAcumuladas || 0))
                    .map(a => {
                      const pct = Helpers.pct(a.horasAcumuladas || 0, cursoObj.cargaHorariaMax || 200);
                      return `
                      <div style="padding:var(--space-3) var(--space-5);border-bottom:1px solid var(--gray-100)">
                        <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:4px">
                          <div class="avatar-sm" style="width:24px;height:24px;font-size:.6rem;flex-shrink:0">${Helpers.initials(a.name)}</div>
                          <p style="font-size:var(--text-sm);font-weight:var(--fw-medium);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Helpers.escHtml(a.name)}</p>
                          <span style="font-size:var(--text-xs);font-weight:var(--fw-bold);color:${pct >= 100 ? 'var(--success)' : 'var(--gray-500)'};flex-shrink:0">
                            ${a.horasAcumuladas || 0}h / ${cursoObj.cargaHorariaMax}h
                          </span>
                        </div>
                        <div class="progress-bar-wrap" style="height:5px">
                          <div class="progress-bar-fill ${Helpers.progressClass(pct)}" style="width:${pct}%"></div>
                        </div>
                      </div>`;
                    }).join('') : `
                <div class="empty-state" style="padding:var(--space-8)">
                  <i class="fas fa-users empty-icon"></i>
                  <h3>Sem alunos matriculados</h3>
                </div>`}
              </div>
            </div>
          </div>

          <!-- Submissões recentes -->
          <div class="card">
            <div class="card-header">
              <span class="card-header-title">
                <i class="fas fa-clock-rotate-left" style="color:var(--accent);margin-right:var(--space-2)"></i>
                Submissões Recentes
              </span>
              <button class="btn btn-outline btn-sm" onclick="Router.navigate('coordenador/submissoes')">
                Ver todas
              </button>
            </div>
            <div class="card-body" style="padding:0">
              ${subsDoCurso.length ? `
              <table class="data-table">
                <thead><tr><th>Aluno</th><th>Categoria</th><th>Data</th><th>Status</th><th>Horas</th></tr></thead>
                <tbody>
                  ${[...subsDoCurso]
                      .sort((a, b) => new Date(b.dataEnvio) - new Date(a.dataEnvio))
                      .slice(0, 8)
                      .map(s => `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:var(--space-2)">
                        <div class="avatar-sm">${Helpers.initials(s.nomeAluno)}</div>
                        <span>${Helpers.escHtml(s.nomeAluno)}</span>
                      </div>
                    </td>
                    <td><span class="badge badge-blue">${Helpers.escHtml(s.nomeCategoria)}</span></td>
                    <td style="font-size:var(--text-xs);color:var(--gray-400)">${Helpers.formatDate(s.dataEnvio)}</td>
                    <td>${Helpers.statusBadge(s.status)}</td>
                    <td>${s.horasAproveitadas > 0 ? `<strong>${s.horasAproveitadas}h</strong>` : '—'}</td>
                  </tr>`).join('')}
                </tbody>
              </table>` : `
              <div class="empty-state" style="padding:var(--space-10)">
                <i class="fas fa-inbox empty-icon"></i>
                <h3>Nenhuma submissão ainda</h3>
                <p>As submissões dos alunos aparecerão aqui.</p>
              </div>`}
            </div>
          </div>

        </div>`;

    } catch (e) {
      container.innerHTML += `
        <div style="padding:var(--space-5);color:var(--danger);background:var(--danger-light);border-radius:var(--radius-md);margin-top:var(--space-4)">
          <i class="fas fa-circle-exclamation"></i> Erro ao carregar: ${Helpers.escHtml(e.message)}
        </div>`;
    }
  },
};

window.CoordenadorCursoDetalhe = CoordenadorCursoDetalhe;