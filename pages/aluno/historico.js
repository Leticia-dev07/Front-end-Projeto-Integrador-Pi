/**
 * pages/aluno/historico.js — AcadFlow
 * [FIX] Exibe nomeCurso e dadosOcr no modal de detalhes.
 */
const AlunoHistorico = {
  _filter:  'all',
  _allSubs: [],

  async render() {
    const session   = Storage.getSession();
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-header stagger">
        <h1>Histórico de Submissões</h1>
        <p>Acompanhe todas as suas atividades enviadas</p>
        <div class="page-header-actions">
          <button class="btn btn-primary"   data-filter="all">Todas</button>
          <button class="btn btn-secondary" data-filter="PENDENTE">Pendentes</button>
          <button class="btn btn-secondary" data-filter="APROVADO">Aprovadas</button>
          <button class="btn btn-secondary" data-filter="REJEITADO">Rejeitadas</button>
          <button class="btn btn-primary" onclick="Router.navigate('aluno/submeter')">
            <i class="fas fa-plus"></i> Nova Submissão
          </button>
        </div>
      </div>
      <div id="historico-wrap" class="page-enter">${Loader.skeleton(5)}</div>`;

    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._filter = btn.dataset.filter;
        container.querySelectorAll('[data-filter]').forEach(b => {
          b.classList.toggle('btn-primary',   b.dataset.filter === this._filter);
          b.classList.toggle('btn-secondary', b.dataset.filter !== this._filter);
        });
        this._drawTable();
      });
    });

    const all = await ActivityService.getSubmissoes().catch(e => { Toast.error('Erro', e.message); return []; });
    this._allSubs = all.filter(s => s.nomeAluno === session.name);
    this._drawTable();
  },

  _drawTable() {
    const data = this._filter === 'all'
      ? this._allSubs
      : this._allSubs.filter(s => s.status === this._filter);

    Table.render('historico-wrap', {
      columns: [
        { key: 'nomeCategoria', label: 'Categoria', render: r =>
          `<span class="badge badge-blue">${Helpers.escHtml(r.nomeCategoria)}</span>` },
        { key: 'nomeCurso', label: 'Curso', render: r =>
          r.nomeCurso && r.nomeCurso !== 'Sem curso'
            ? `<span style="font-size:var(--text-xs);color:var(--text-muted)">${Helpers.escHtml(r.nomeCurso)}</span>`
            : `<span class="text-muted">—</span>` },
        { key: 'dataEnvio', label: 'Enviado em', render: r =>
          `<span style="color:var(--text-muted);font-size:var(--text-xs)">${Helpers.formatDate(r.dataEnvio)}</span>` },
        { key: 'horasAproveitadas', label: 'Horas', render: r =>
          r.horasAproveitadas > 0
            ? `<span style="font-size:var(--text-md);font-weight:var(--fw-black);color:var(--success)">${r.horasAproveitadas}h</span>`
            : `<span class="text-muted">—</span>` },
        { key: 'status', label: 'Status', render: r => Helpers.statusBadge(r.status) },
        { key: 'observacaoCoordenador', label: 'Observação', render: r =>
          r.observacaoCoordenador
            ? `<span style="font-size:var(--text-xs);color:var(--text-muted);font-style:italic">
                ${Helpers.escHtml(r.observacaoCoordenador.slice(0, 50))}${r.observacaoCoordenador.length > 50 ? '…' : ''}
               </span>`
            : `<span class="text-muted">—</span>` },
      ],
      data,
      emptyMsg: 'Nenhuma submissão encontrada.',
      actions: [
        { key: 'detail', label: 'Ver detalhes', icon: 'fas fa-eye', type: 'outline',
          onClick: row => this._openDetail(row) },
      ],
    });
  },

  _openDetail(sub) {
    const isRej = sub.status === 'REJEITADO';

    // Seção de dados OCR
    const ocrSection = sub.dadosOcr ? `
      <div class="divider"></div>
      <div style="padding:var(--space-4);background:var(--surface-hover);
        border-radius:var(--radius-md);border:1px solid var(--border-color)">
        <p style="font-size:var(--text-xs);font-weight:var(--fw-semibold);color:var(--accent);
          margin-bottom:var(--space-3);display:flex;align-items:center;gap:var(--space-2)">
          <i class="fas fa-wand-magic-sparkles"></i> Dados lidos do certificado
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
          ${[
            ['Nome do aluno',     sub.dadosOcr.nomeAlunoOcr],
            ['Curso/Evento',      sub.dadosOcr.nomeCursoOcr],
            ['Carga horária OCR', sub.dadosOcr.cargaHorariaOcr ? sub.dadosOcr.cargaHorariaOcr + 'h' : null],
            ['Data de conclusão', sub.dadosOcr.dataConclusaoOcr],
          ].filter(([, v]) => v).map(([label, val]) => `
            <div>
              <p style="font-size:var(--text-xs);color:var(--text-muted)">${label}</p>
              <p style="font-size:var(--text-sm);font-weight:var(--fw-medium);
                color:var(--text-primary);margin-top:2px">${Helpers.escHtml(String(val))}</p>
            </div>`).join('')}
        </div>
      </div>` : '';

    Modal.open({
      title: 'Detalhes da Submissão',
      size:  'lg',
      body: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5)">
          <div>
            <p class="form-label">Categoria</p>
            <p style="font-weight:var(--fw-semibold);margin-top:2px">${Helpers.escHtml(sub.nomeCategoria)}</p>
          </div>
          <div>
            <p class="form-label">Status</p>
            <div style="margin-top:4px">${Helpers.statusBadge(sub.status)}</div>
          </div>
          <div>
            <p class="form-label">Curso</p>
            <p style="margin-top:2px">${Helpers.escHtml(sub.nomeCurso || '—')}</p>
          </div>
          <div>
            <p class="form-label">Data de envio</p>
            <p style="margin-top:2px">${Helpers.formatDate(sub.dataEnvio)}</p>
          </div>
          <div>
            <p class="form-label">Horas aprovadas</p>
            <p style="font-size:var(--text-xl);font-weight:var(--fw-black);
              color:var(--success);margin-top:2px">
              ${sub.horasAproveitadas > 0 ? sub.horasAproveitadas + 'h' : '—'}
            </p>
          </div>
        </div>

        <div class="divider"></div>

        <div style="background:var(--surface-hover);border-radius:var(--radius-md);
          padding:var(--space-4);display:flex;align-items:center;gap:var(--space-3);
          border:1px solid var(--border-color)">
          <i class="fas fa-file-pdf" style="font-size:1.5rem;color:var(--danger)"></i>
          <div style="flex:1">
            <p style="font-weight:600;font-size:var(--text-sm);color:var(--text-primary)">Certificado enviado</p>
            <p style="font-size:var(--text-xs);color:var(--text-muted)">
              ${sub.urlCertificado ? 'Disponível' : 'URL não disponível'}
            </p>
          </div>
          ${sub.urlCertificado
            ? `<a href="${Helpers.escHtml(sub.urlCertificado)}" target="_blank" rel="noopener"
                class="btn btn-outline btn-sm">
                <i class="fas fa-external-link-alt"></i> Abrir
               </a>`
            : `<button class="btn btn-ghost btn-sm" disabled>Sem URL</button>`}
        </div>

        ${ocrSection}

        ${sub.observacaoCoordenador ? `
        <div style="margin-top:var(--space-4);padding:var(--space-3) var(--space-4);
          background:${isRej ? 'var(--danger-light)' : 'var(--warning-light)'};
          border-radius:var(--radius-md);
          border-left:3px solid ${isRej ? 'var(--danger)' : 'var(--warning)'}">
          <p style="font-size:var(--text-xs);font-weight:600;
            color:${isRej ? 'var(--danger)' : 'var(--warning)'};margin-bottom:4px">
            <i class="fas fa-comment"></i> Observação do coordenador
          </p>
          <p style="font-size:var(--text-sm);color:var(--text-primary)">${Helpers.escHtml(sub.observacaoCoordenador)}</p>
        </div>` : ''}

        ${isRej ? `
        <div style="margin-top:var(--space-5);text-align:center">
          <button class="btn btn-primary"
            onclick="Modal.closeAll();Router.navigate('aluno/submeter')">
            <i class="fas fa-redo"></i> Reenviar atividade
          </button>
        </div>` : ''}`,
    });
  },
};
window.AlunoHistorico = AlunoHistorico;
