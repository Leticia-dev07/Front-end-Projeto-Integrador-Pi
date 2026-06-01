/**
 * pages/superadmin/dashboard.js — AcadFlow
 */
const SuperAdminDashboard = {
  async render() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-header stagger"><h1>Dashboard Geral</h1><p>Visão consolidada de toda a plataforma</p></div>
      ${Loader.statsSkeleton(7)}`;

    const stats = await DashboardService.getSuperAdminStats().catch(e=>{
      Toast.error('Erro ao carregar dashboard', e.message); return null;
    });
    if (!stats) return;

    container.innerHTML = `
      <div class="page-header stagger"><h1>Dashboard Geral</h1><p>Visão consolidada de toda a plataforma</p></div>
      <div class="stats-grid stagger" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
        ${Card.stat({icon:'fas fa-graduation-cap', label:'Cursos',        value:stats.totalCursos,        color:'blue',   id:'s-cu'})}
        ${Card.stat({icon:'fas fa-users',           label:'Alunos',        value:stats.totalAlunos,        color:'cyan',   id:'s-al'})}
        ${Card.stat({icon:'fas fa-chalkboard-user', label:'Coordenadores', value:stats.totalCoordenadores, color:'purple', id:'s-co'})}
        ${Card.stat({icon:'fas fa-file-arrow-up',   label:'Submissões',    value:stats.totalSubmissoes,    color:'blue',   id:'s-su'})}
        ${Card.stat({icon:'fas fa-clock',           label:'Pendentes',     value:stats.pendentes,          color:'orange', id:'s-pe'})}
        ${Card.stat({icon:'fas fa-circle-check',    label:'Aprovadas',     value:stats.aprovadas,          color:'green',  id:'s-ap'})}
        ${Card.stat({icon:'fas fa-circle-xmark',    label:'Rejeitadas',    value:stats.rejeitadas,         color:'red',    id:'s-re'})}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6)">
        <div class="card">
          <div class="card-header"><span class="card-header-title"><i class="fas fa-chart-bar" style="color:var(--accent);margin-right:var(--space-2)"></i>Submissões por mês</span></div>
          <div class="card-body">${Card.barChart(stats.monthlyData)}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-header-title"><i class="fas fa-chart-pie" style="color:var(--accent);margin-right:var(--space-2)"></i>Status das submissões</span></div>
          <div class="card-body" style="display:flex;align-items:center;justify-content:center;gap:var(--space-8)">
            <div style="position:relative">
              ${Card.donut(stats.totalSubmissoes?Math.round(stats.aprovadas/stats.totalSubmissoes*100):0,'var(--success)',120)}
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
                <span style="font-size:var(--text-xl);font-weight:var(--fw-black)">${stats.totalSubmissoes?Math.round(stats.aprovadas/stats.totalSubmissoes*100):0}%</span>
                <span style="font-size:var(--text-xs);color:var(--gray-400)">aprovação</span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--space-3)">
              ${[['var(--success)','Aprovadas',stats.aprovadas],['var(--warning)','Pendentes',stats.pendentes],['var(--danger)','Rejeitadas',stats.rejeitadas]].map(([c,l,v])=>`
                <div style="display:flex;align-items:center;gap:var(--space-2)">
                  <span style="width:10px;height:10px;border-radius:50%;background:${c};flex-shrink:0"></span>
                  <span style="font-size:var(--text-sm);color:var(--gray-600)">${l}: <strong>${v}</strong></span>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-header-title"><i class="fas fa-clock-rotate-left" style="color:var(--accent);margin-right:var(--space-2)"></i>Submissões recentes</span>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Aluno</th><th>Categoria</th><th>Data</th><th>Status</th></tr></thead>
            <tbody>${stats.recentSubmissoes.length?stats.recentSubmissoes.map(s=>`
              <tr>
                <td><div style="display:flex;align-items:center;gap:var(--space-2)">
                  <div class="avatar-sm">${Helpers.initials(s.nomeAluno)}</div><span>${Helpers.escHtml(s.nomeAluno)}</span>
                </div></td>
                <td>${Helpers.escHtml(s.nomeCategoria)}</td>
                <td style="color:var(--gray-400);font-size:var(--text-xs)">${Helpers.timeAgo(s.dataEnvio)}</td>
                <td>${Helpers.statusBadge(s.status)}</td>
              </tr>`).join('')
            :`<tr><td colspan="4"><div class="empty-state"><i class="fas fa-inbox empty-icon"></i><h3>Sem submissões</h3></div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    setTimeout(()=>{
      [['s-cu',stats.totalCursos],['s-al',stats.totalAlunos],['s-co',stats.totalCoordenadores],
       ['s-su',stats.totalSubmissoes],['s-pe',stats.pendentes],['s-ap',stats.aprovadas],['s-re',stats.rejeitadas]]
      .forEach(([id,val])=>Card.animateCount(document.querySelector(`#${id} .stat-value`),val));
    },100);
  },
};
window.SuperAdminDashboard = SuperAdminDashboard;
