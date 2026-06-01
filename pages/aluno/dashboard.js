/**
 * pages/aluno/dashboard.js — AcadFlow
 * Suporta múltiplos cursos via Storage.getAlunoCursoAtivo().
 */
const AlunoDashboard = {
  async render() {
    const session   = Storage.getSession();
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-header stagger"><h1>Meu Painel</h1><p>Carregando...</p></div>
      ${Loader.statsSkeleton(4)}`;

    if (!session.profileId) {
      container.innerHTML = `
        <div class="page-header stagger"><h1>Meu Painel</h1></div>
        <div class="card"><div class="card-body empty-state">
          <i class="fas fa-circle-exclamation empty-icon" style="color:var(--danger)"></i>
          <h3>Perfil não encontrado</h3><p>Faça login novamente.</p>
        </div></div>`;
      return;
    }

    const stats = await DashboardService.getAlunoStats(session.profileId, session.name)
      .catch(e => { Toast.error('Erro', e.message); return null; });
    if (!stats) return;

    container.innerHTML = `
      <div class="page-header stagger">
        <h1>Olá, ${Helpers.escHtml(stats.nomeAluno.split(' ')[0])} 👋</h1>
        <div style="display:flex;align-items:center;gap:var(--space-3);margin-top:var(--space-1);flex-wrap:wrap">
          <p style="color:var(--text-secondary)">Curso: <strong>${Helpers.escHtml(stats.nomeCurso)}</strong></p>
          ${stats.totalCursos > 1
            ? `<span class="badge badge-blue"><i class="fas fa-graduation-cap" style="margin-right:4px"></i>${stats.totalCursos} cursos</span>`
            : ''}
        </div>
      </div>

      <!-- Hero progress -->
      <div class="card stagger" style="margin-bottom:var(--space-6);background:linear-gradient(135deg,var(--blue-900),var(--blue-700));border:none">
        <div class="card-body" style="display:flex;align-items:center;gap:var(--space-8);flex-wrap:wrap">
          <div style="flex:1;min-width:200px">
            <p style="font-size:var(--text-sm);opacity:.7;margin-bottom:var(--space-2);color:white">Progresso geral</p>
            <div style="display:flex;align-items:baseline;gap:var(--space-2);margin-bottom:var(--space-4)">
              <span id="pct-val" style="font-size:var(--text-4xl);font-weight:var(--fw-black);line-height:1;color:white">${stats.pctConcluido}</span>
              <span style="font-size:var(--text-xl);opacity:.7;color:white">%</span>
            </div>
            <div style="background:rgba(255,255,255,.15);border-radius:var(--radius-full);height:10px;overflow:hidden">
              <div id="hero-bar" style="height:100%;border-radius:var(--radius-full);background:white;width:0%;transition:width 1.2s cubic-bezier(.4,0,.2,1)"></div>
            </div>
            <p style="margin-top:var(--space-2);font-size:var(--text-xs);opacity:.6;color:white">
              ${stats.horasAprovadas}h concluídas de ${stats.cargaMax}h necessárias
            </p>
          </div>
          <div style="display:flex;gap:var(--space-6);flex-wrap:wrap">
            ${[['Aprovadas',stats.horasAprovadas],['Pendentes',stats.horasPendentes],['Faltantes',stats.horasFaltantes]].map(([l,v])=>`
            <div style="text-align:center">
              <p style="font-size:var(--text-3xl);font-weight:var(--fw-black);color:white">${v}</p>
              <p style="font-size:var(--text-xs);opacity:.6;color:white">${l}</p>
            </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="stats-grid stagger" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:var(--space-6)">
        ${Card.stat({ icon:'fas fa-file-arrow-up', label:'Total Enviado', value:stats.totalSubs, color:'blue' })}
        ${Card.stat({ icon:'fas fa-circle-check',  label:'Aprovados',    value:stats.submissoes.filter(s=>s.status==='APROVADO').length,  color:'green'  })}
        ${Card.stat({ icon:'fas fa-clock',          label:'Pendentes',   value:stats.submissoes.filter(s=>s.status==='PENDENTE').length,  color:'orange' })}
        ${Card.stat({ icon:'fas fa-circle-xmark',  label:'Rejeitados',  value:stats.submissoes.filter(s=>s.status==='REJEITADO').length, color:'red'    })}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6)">
        <!-- Timeline -->
        <div class="card">
          <div class="card-header">
            <span class="card-header-title"><i class="fas fa-timeline" style="color:var(--accent);margin-right:var(--space-2)"></i>Atividades recentes</span>
            <button class="btn btn-outline btn-sm" onclick="Router.navigate('aluno/historico')">Ver todas</button>
          </div>
          <div class="card-body">
            ${stats.submissoes.length ? `<div class="timeline">
              ${stats.submissoes.slice(0,5).map(s=>`
              <div class="timeline-item">
                <div class="timeline-dot ${s.status.toLowerCase()}">
                  <i class="fas fa-${s.status==='APROVADO'?'check':s.status==='REJEITADO'?'xmark':'clock'}"></i>
                </div>
                <div class="timeline-content">
                  <p class="timeline-title">${Helpers.escHtml(s.nomeCategoria)}</p>
                  <p class="timeline-sub">${Helpers.timeAgo(s.dataEnvio)} · ${Helpers.statusBadge(s.status)}</p>
                  ${s.nomeCurso&&s.nomeCurso!=='Sem curso'?`<p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px"><i class="fas fa-graduation-cap" style="margin-right:3px"></i>${Helpers.escHtml(s.nomeCurso)}</p>`:''}
                  ${s.observacaoCoordenador?`<p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:4px;font-style:italic">"${Helpers.escHtml(s.observacaoCoordenador)}"</p>`:''}
                </div>
              </div>`).join('')}
            </div>` : `<div class="empty-state"><i class="fas fa-inbox empty-icon"></i><h3>Nenhuma atividade ainda</h3></div>`}
          </div>
        </div>

        <!-- Ações rápidas -->
        <div class="card">
          <div class="card-header"><span class="card-header-title">Ações rápidas</span></div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:var(--space-3)">
            <button class="btn btn-primary btn-lg" onclick="Router.navigate('aluno/submeter')" style="justify-content:flex-start;gap:var(--space-3)">
              <i class="fas fa-plus-circle" style="font-size:1.1rem"></i>
              <div style="text-align:left">
                <p style="font-weight:var(--fw-semibold)">Submeter Certificado</p>
                <p style="font-size:var(--text-xs);opacity:.8">Enviar novo comprovante</p>
              </div>
            </button>
            <button class="btn btn-outline btn-lg" onclick="Router.navigate('aluno/historico')" style="justify-content:flex-start;gap:var(--space-3)">
              <i class="fas fa-clock-rotate-left" style="font-size:1.1rem"></i>
              <div style="text-align:left">
                <p style="font-weight:var(--fw-semibold)">Ver Histórico</p>
                <p style="font-size:var(--text-xs);color:var(--text-muted)">Todas as submissões</p>
              </div>
            </button>
            <div style="padding:var(--space-4);background:${stats.pctConcluido>=100?'var(--success-light)':'var(--accent-light)'};border-radius:var(--radius-md);border:1px solid ${stats.pctConcluido>=100?'rgba(18,161,80,.2)':'var(--border-strong)'}">
              ${stats.pctConcluido>=100
                ?`<div style="display:flex;align-items:center;gap:var(--space-3)">
                    <i class="fas fa-trophy" style="font-size:1.5rem;color:var(--success)"></i>
                    <div><p style="font-weight:var(--fw-bold);color:var(--success)">Parabéns! 🎉</p>
                    <p style="font-size:var(--text-xs);color:#065f46">Carga horária concluída!</p></div>
                  </div>`
                :`<p style="font-size:var(--text-sm);color:var(--accent)">
                    Faltam <strong>${stats.horasFaltantes}h</strong> para completar a carga horária.
                  </p>`}
            </div>
          </div>
        </div>
      </div>`;

    setTimeout(() => {
      const bar = document.getElementById('hero-bar');
      if (bar) bar.style.width = stats.pctConcluido + '%';
      Card.animateCount(document.getElementById('pct-val'), stats.pctConcluido);
    }, 200);
  },
};
window.AlunoDashboard = AlunoDashboard;
