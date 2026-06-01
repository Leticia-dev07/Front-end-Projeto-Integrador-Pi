/**
 * pages/coordenador/dashboard.js — AcadFlow
 *
 * [FIX-COORD-VER-CURSO] Adiciona card de detalhes do curso com botão
 * para navegar para a página completa de informações.
 *
 * [FIX-COORD-CURSO-ATIVO] Usa profileId da sessão para buscar cursos
 * com getCursosByCoordenadorId() quando disponível, caindo para
 * getCursosByCoordenadorEmail() como fallback.
 */
const CoordenadorDashboard = {
  async render() {
    const session   = Storage.getSession();
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-header stagger"><h1>Dashboard</h1><p>Carregando dados do curso...</p></div>
      ${Loader.statsSkeleton(5)}`;

    // Busca cursos do coordenador logado (por id quando disponível, email como fallback)
    let cursos = [];
    try {
      if (session.profileId) {
        cursos = await UserService.getCursosByCoordenadorId(session.profileId);
      }
      if (!cursos.length && session.email) {
        cursos = await UserService.getCursosByCoordenadorEmail(session.email);
      }
    } catch { cursos = []; }

    // Garante que cursoAtivo seja válido para os cursos deste coordenador
    let cursoAtivo = Storage.getCursoAtivo();
    if (!cursos.find(c => c.id === cursoAtivo)) {
      cursoAtivo = cursos[0]?.id || null;
      if (cursoAtivo) Storage.setCursoAtivo(cursoAtivo);
    }

    if (!cursoAtivo) {
      container.innerHTML = `
        <div class="page-header stagger"><h1>Dashboard</h1></div>
        <div class="card">
          <div class="card-body empty-state" style="padding:var(--space-16)">
            <i class="fas fa-graduation-cap empty-icon"></i>
            <h3>Nenhum curso vinculado</h3>
            <p>Solicite ao administrador para vincular um curso ao seu perfil.</p>
          </div>
        </div>`;
      return;
    }

    const cursoIds  = cursos.map(c => c.id);
    const cursoObj  = cursos.find(c => c.id === cursoAtivo) || cursos[0];
    const nomeCurso = cursoObj?.nome || '—';

    const stats = await DashboardService.getCoordenadorStats(cursoIds, cursoAtivo).catch(e => {
      Toast.error('Erro ao carregar dashboard', e.message);
      return null;
    });
    if (!stats) return;

    container.innerHTML = `
      <div class="page-header stagger">
        <h1>Dashboard</h1>
        <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;margin-top:var(--space-2)">
          <p style="color:var(--gray-500)">Curso ativo:
            <strong style="color:var(--gray-800)">${Helpers.escHtml(nomeCurso)}</strong>
          </p>
          ${cursos.length > 1 ? `<span class="badge badge-blue">${cursos.length} cursos vinculados</span>` : ''}
          <!-- [FIX-COORD-VER-CURSO] Botão de detalhes -->
          <button class="btn btn-outline btn-sm" onclick="Router.navigate('coordenador/curso-detalhe')">
            <i class="fas fa-info-circle"></i> Ver detalhes do curso
          </button>
        </div>
      </div>

      <div class="stats-grid stagger">
        ${Card.stat({ icon:'fas fa-users',            label:'Alunos',        value: stats.totalAlunos, color:'blue',   id:'cs-al' })}
        ${Card.stat({ icon:'fas fa-clock',             label:'Pendentes',     value: stats.pendentes,   color:'orange', id:'cs-pe' })}
        ${Card.stat({ icon:'fas fa-circle-check',      label:'Aprovadas',     value: stats.aprovadas,   color:'green',  id:'cs-ap' })}
        ${Card.stat({ icon:'fas fa-circle-xmark',      label:'Rejeitadas',    value: stats.rejeitadas,  color:'red',    id:'cs-re' })}
        ${Card.stat({ icon:'fas fa-clock-rotate-left', label:'Média de Horas',value: stats.mediaHoras + 'h', color:'cyan' })}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6)">

        <!-- Ranking de alunos -->
        <div class="card">
          <div class="card-header">
            <span class="card-header-title">
              <i class="fas fa-trophy" style="color:var(--warning);margin-right:var(--space-2)"></i>Ranking de Alunos
            </span>
          </div>
          <div class="card-body" style="padding:0">
            ${stats.ranking.length ? stats.ranking.map((a, i) => {
              const pct = Helpers.pct(a.horasAcumuladas || 0, stats.cargaMax);
              return `
              <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-5);border-bottom:1px solid var(--gray-100)">
                <span style="font-size:var(--text-lg);font-weight:var(--fw-black);color:${i < 3 ? 'var(--warning)' : 'var(--gray-300)'};width:24px;text-align:center">${i + 1}</span>
                <div class="avatar-sm">${Helpers.initials(a.name)}</div>
                <div style="flex:1;min-width:0">
                  <p style="font-size:var(--text-sm);font-weight:var(--fw-semibold);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Helpers.escHtml(a.name)}</p>
                  <div class="progress-bar-wrap" style="height:4px;margin-top:4px">
                    <div class="progress-bar-fill ${Helpers.progressClass(pct)}" style="width:${pct}%"></div>
                  </div>
                </div>
                <span style="font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--accent);flex-shrink:0">${a.horasAcumuladas || 0}h</span>
              </div>`;
            }).join('') : `
            <div class="empty-state" style="padding:var(--space-8)">
              <i class="fas fa-users empty-icon"></i>
              <h3>Sem alunos matriculados</h3>
            </div>`}
          </div>
        </div>

        <!-- Distribuição de status -->
        <div class="card">
          <div class="card-header">
            <span class="card-header-title">
              <i class="fas fa-chart-simple" style="color:var(--accent);margin-right:var(--space-2)"></i>Distribuição de Status
            </span>
          </div>
          <div class="card-body" style="display:flex;align-items:center;justify-content:center;gap:var(--space-6)">
            <div style="position:relative">
              ${Card.donut(stats.totalSubs ? Math.round(stats.aprovadas / stats.totalSubs * 100) : 0, 'var(--success)', 110)}
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
                <span style="font-size:var(--text-lg);font-weight:var(--fw-black)">${stats.totalSubs ? Math.round(stats.aprovadas / stats.totalSubs * 100) : 0}%</span>
                <span style="font-size:.65rem;color:var(--gray-400)">aprovação</span>
              </div>
            </div>
            <div>
              ${stats.progressData.map(d => `
              <div style="margin-bottom:var(--space-3)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                  <span style="font-size:var(--text-xs);color:var(--gray-600)">${d.label}</span>
                  <span style="font-size:var(--text-sm);font-weight:var(--fw-bold)">${d.value}</span>
                </div>
                <div class="progress-bar-wrap" style="width:150px">
                  <div class="progress-bar-fill" style="width:${Helpers.pct(d.value, stats.totalSubs)}%;background:${d.color}"></div>
                </div>
              </div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Submissões recentes -->
      <div class="card">
        <div class="card-header">
          <span class="card-header-title">
            <i class="fas fa-file-arrow-up" style="color:var(--accent);margin-right:var(--space-2)"></i>Submissões recentes
          </span>
          <button class="btn btn-outline btn-sm" onclick="Router.navigate('coordenador/submissoes')">
            Ver todas <i class="fas fa-arrow-right" style="margin-left:4px"></i>
          </button>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Aluno</th><th>Categoria</th><th>Data</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              ${stats.recentSubs.length ? stats.recentSubs.map(s => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:var(--space-2)">
                    <div class="avatar-sm">${Helpers.initials(s.nomeAluno)}</div>
                    <span>${Helpers.escHtml(s.nomeAluno)}</span>
                  </div>
                </td>
                <td><span class="badge badge-blue">${Helpers.escHtml(s.nomeCategoria)}</span></td>
                <td style="font-size:var(--text-xs);color:var(--gray-400)">${Helpers.timeAgo(s.dataEnvio)}</td>
                <td>${Helpers.statusBadge(s.status)}</td>
                <td>
                  ${s.status === 'PENDENTE'
                    ? `<button class="btn btn-sm btn-outline" onclick="Router.navigate('coordenador/submissoes')">Avaliar</button>`
                    : '—'}
                </td>
              </tr>`).join('') : `
              <tr>
                <td colspan="5">
                  <div class="empty-state" style="padding:var(--space-8)">
                    <i class="fas fa-inbox empty-icon"></i>
                    <h3>Nenhuma submissão</h3>
                  </div>
                </td>
              </tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    // Anima contadores
    setTimeout(() => {
      Card.animateCount(document.querySelector('#cs-al .stat-value'), stats.totalAlunos);
      Card.animateCount(document.querySelector('#cs-pe .stat-value'), stats.pendentes);
      Card.animateCount(document.querySelector('#cs-ap .stat-value'), stats.aprovadas);
      Card.animateCount(document.querySelector('#cs-re .stat-value'), stats.rejeitadas);
    }, 100);
  },
};

window.CoordenadorDashboard = CoordenadorDashboard;
