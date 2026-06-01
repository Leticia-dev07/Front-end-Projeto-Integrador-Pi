/**
 * pages/coordenador/submissoes.js — AcadFlow
 *
 * [FIX] Exibe dadosOcr (CertificadoDTO) no modal de detalhes quando presente.
 * [FIX] Filtra submissões especificamente pelo ID do curso selecionado/vinculado,
 * integrando com a nova trava de segurança do Spring Boot (?cursoId=X).
 * [FIX] Resolve o problema da "URL indisponível" aceitando múltiplas chaves do DTO.
 */
const CoordenadorSubmissoes = {
  _filter:  'all',
  _allSubs: [],

  async render() {
    const session   = Storage.getSession();
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-header stagger">
        <h1>Submissões</h1>
        <p>Avalie os certificados dos alunos do seu curso</p>
        <div class="page-header-actions">
          <button class="btn btn-primary"   data-filter="all">Todas</button>
          <button class="btn btn-secondary" data-filter="PENDENTE">Pendentes</button>
          <button class="btn btn-secondary" data-filter="APROVADO">Aprovadas</button>
          <button class="btn btn-secondary" data-filter="REJEITADO">Rejeitadas</button>
        </div>
      </div>
      <div id="subs-table-wrap" class="page-enter">${Loader.skeleton(5)}</div>`;

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

    // Busca os cursos vinculados ao coordenador
    const cursos = await UserService.getCursosByCoordenadorEmail(session.email).catch(() => []);
    const cursoAtivo = Storage.getCursoAtivo();
    
    // Define o ID único do curso para a busca (o ativo ou o primeiro da lista)
    const cursoId = cursoAtivo || (cursos.length > 0 ? cursos[0].id : null);

    // Proteção: Coordenador cadastrado mas ainda sem curso vinculado pelo Super Admin
    if (!cursoId) {
      this._allSubs = [];
      this._drawTable();
      Toast.info('Aviso', 'Você ainda não possui cursos vinculados para gerenciar submissões.');
      return;
    }

    // Chamada atualizada para buscar as submissões de UM curso específico
    this._allSubs = await ActivityService.getSubmissoesPorCurso(cursoId).catch(e => {
      Toast.error('Erro ao carregar submissões', e.message); return [];
    });
    this._drawTable();
  },

  _drawTable() {
    const data = this._filter === 'all'
      ? this._allSubs
      : this._allSubs.filter(s => s.status === this._filter);

    Table.render('subs-table-wrap', {
      columns: [
        { key: 'nomeAluno', label: 'Aluno', render: r => `
          <div style="display:flex;align-items:center;gap:var(--space-2)">
            <div class="avatar-sm">${Helpers.initials(r.nomeAluno)}</div>
            <span style="font-weight:var(--fw-medium)">${Helpers.escHtml(r.nomeAluno)}</span>
          </div>` },
        { key: 'nomeCategoria', label: 'Categoria', render: r =>
          `<span class="badge badge-blue">${Helpers.escHtml(r.nomeCategoria)}</span>` },
        { key: 'nomeCurso', label: 'Curso', render: r =>
          `<span style="font-size:var(--text-xs);color:var(--text-muted)">${Helpers.escHtml(r.nomeCurso || '—')}</span>` },
        { key: 'dadosOcr', label: 'OCR', render: r =>
          r.dadosOcr
            ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:var(--text-xs);
                color:var(--success);font-weight:600">
                <i class="fas fa-wand-magic-sparkles"></i> Sim
               </span>`
            : `<span class="text-muted">—</span>` },
        { key: 'horasAproveitadas', label: 'Horas', render: r =>
          r.horasAproveitadas > 0
            ? `<strong>${r.horasAproveitadas}h</strong>`
            : `<span class="text-muted">—</span>` },
        { key: 'dataEnvio', label: 'Data', render: r =>
          `<span style="color:var(--text-muted);font-size:var(--text-xs)">${Helpers.formatDate(r.dataEnvio)}</span>` },
        { key: 'status', label: 'Status', render: r => Helpers.statusBadge(r.status) },
      ],
      data,
      emptyMsg: 'Nenhuma submissão encontrada para este curso.',
      actions: [
        { key: 'view', label: 'Detalhes', icon: 'fas fa-eye', type: 'outline',
          onClick: row => this._openDetail(row) },
        { key: 'aprovar', label: 'Aprovar', icon: 'fas fa-check', type: 'success',
          hidden: row => row.status !== 'PENDENTE',
          onClick: row => Modal.confirm({
            title: 'Aprovar submissão', confirmText: 'Aprovar', type: 'warning',
            message: `Aprovar certificado de "${row.nomeAluno}"?`,
            onConfirm: async () => {
              await ActivityService.aprovar(row.id);
              Toast.success('Aprovada!', row.nomeAluno);
              const idx = this._allSubs.findIndex(s => s.id === row.id);
              if (idx >= 0) this._allSubs[idx] = await ActivityService.getSubmissao(row.id);
              this._drawTable();
              Sidebar.refreshBadge();
            },
          }),
        },
        { key: 'rejeitar', label: 'Rejeitar', icon: 'fas fa-xmark', type: 'ghost',
          hidden: row => row.status !== 'PENDENTE',
          onClick: row => this._openRejeitar(row) },
      ],
    });
  },

  _openDetail(sub) {
    // [CORREÇÃO] Pega a URL independente de como o DTO do Spring Boot a chame
    const linkArquivo = sub.urlArquivo || sub.urlCertificado;

    // Seção de dados OCR (CertificadoDTO) integrados com a entidade Java
    const ocrSection = sub.dadosOcr ? `
      <div class="divider"></div>
      <div style="padding:var(--space-4);background:var(--surface-hover);border-radius:var(--radius-md);
        border:1px solid var(--border-color)">
        <p style="font-size:var(--text-xs);font-weight:var(--fw-semibold);color:var(--accent);
          margin-bottom:var(--space-3);display:flex;align-items:center;gap:var(--space-2)">
          <i class="fas fa-wand-magic-sparkles"></i> Dados do Certificado (Autenticação)
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
          ${[
            ['Nome do aluno',    sub.dadosOcr.nomeAlunoOcr],
            ['Curso/Evento',     sub.dadosOcr.nomeCursoOcr],
            ['Carga horária',    sub.dadosOcr.cargaHorariaOcr ? sub.dadosOcr.cargaHorariaOcr + 'h' : null],
            ['Data de conclusão',sub.dadosOcr.dataConclusaoOcr],
          ].map(([label, val]) => val ? `
            <div>
              <p style="font-size:var(--text-xs);color:var(--text-muted)">${label}</p>
              <p style="font-size:var(--text-sm);font-weight:var(--fw-medium);
                color:var(--text-primary);margin-top:2px">${Helpers.escHtml(String(val))}</p>
            </div>` : '').join('')}
        </div>
      </div>` : '';

    Modal.open({
      title: 'Detalhes da Submissão',
      size:  'lg',
      body: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5)">
          <div>
            <p class="form-label">Aluno</p>
            <p style="font-weight:var(--fw-semibold);margin-top:2px">${Helpers.escHtml(sub.nomeAluno)}</p>
          </div>
          <div>
            <p class="form-label">Categoria</p>
            <p style="font-weight:var(--fw-semibold);margin-top:2px">${Helpers.escHtml(sub.nomeCategoria)}</p>
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
            <p class="form-label">Status</p>
            <div style="margin-top:4px">${Helpers.statusBadge(sub.status)}</div>
          </div>
          ${sub.horasAproveitadas > 0 ? `
          <div>
            <p class="form-label">Horas aprovadas</p>
            <p style="font-size:var(--text-lg);font-weight:var(--fw-black);color:var(--success);margin-top:2px">
              ${sub.horasAproveitadas}h
            </p>
          </div>` : ''}
        </div>

        <div class="divider"></div>

        <div style="background:var(--surface-hover);border-radius:var(--radius-md);
          padding:var(--space-4);display:flex;align-items:center;gap:var(--space-3);
          border:1px solid var(--border-color)">
          <i class="fas fa-file-pdf" style="font-size:1.5rem;color:var(--danger)"></i>
          <div style="flex:1">
            <p style="font-weight:600;font-size:var(--text-sm);color:var(--text-primary)">Documento Anexado</p>
            <p style="font-size:var(--text-xs);color:var(--text-muted)">
              ${linkArquivo ? 'Disponível na nuvem' : 'URL não disponível'}
            </p>
          </div>
          ${linkArquivo
            ? `<a href="${Helpers.escHtml(linkArquivo)}" target="_blank" rel="noopener"
                class="btn btn-outline btn-sm">
                <i class="fas fa-external-link-alt"></i> Abrir Certificado
               </a>`
            : `<button class="btn btn-ghost btn-sm" disabled>Sem Arquivo</button>`}
        </div>

        ${ocrSection}

        ${sub.observacaoCoordenador ? `
        <div style="margin-top:var(--space-4);padding:var(--space-3) var(--space-4);
          background:var(--warning-light);border-radius:var(--radius-md);
          border-left:3px solid var(--warning)">
          <p style="font-size:var(--text-xs);font-weight:600;color:var(--warning);margin-bottom:4px">
            <i class="fas fa-comment"></i> Observação do Coordenador
          </p>
          <p style="font-size:var(--text-sm);color:var(--text-primary)">${Helpers.escHtml(sub.observacaoCoordenador)}</p>
        </div>` : ''}`,

      footer: sub.status === 'PENDENTE' ? `
        <button class="btn btn-secondary" onclick="Modal.closeAll()">Fechar</button>
        <button class="btn btn-danger"  id="det-rej">Rejeitar</button>
        <button class="btn btn-success" id="det-aprov">Aprovar</button>`
        : `<button class="btn btn-secondary" onclick="Modal.closeAll()">Fechar</button>`,
    });

    document.getElementById('det-aprov')?.addEventListener('click', async () => {
      Modal.closeAll();
      await ActivityService.aprovar(sub.id);
      Toast.success('Aprovada!', sub.nomeAluno);
      const idx = this._allSubs.findIndex(s => s.id === sub.id);
      if (idx >= 0) this._allSubs[idx] = await ActivityService.getSubmissao(sub.id);
      this._drawTable();
      Sidebar.refreshBadge();
    });
    
    document.getElementById('det-rej')?.addEventListener('click', () => {
      Modal.closeAll();
      this._openRejeitar(sub);
    });
  },

  _openRejeitar(sub) {
    Modal.form({
      title: 'Rejeitar Submissão', size: 'sm',
      fields: `
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">
          Informe o motivo para <strong>${Helpers.escHtml(sub.nomeAluno)}</strong>:
        </p>
        <div class="form-group">
          <label class="form-label">Observação <span class="required">*</span></label>
          <textarea id="f-obs" class="form-control" rows="3"
            placeholder="Ex: Certificado ilegível. Por favor, reenvie com melhor qualidade."></textarea>
        </div>`,
      onSubmit: async (form, close) => {
        const obs = document.getElementById('f-obs').value.trim();
        if (!obs) throw new Error('Informe o motivo da rejeição.');
        await ActivityService.rejeitar(sub.id, obs);
        Toast.warning('Rejeitada', sub.nomeAluno);
        close();
        const idx = this._allSubs.findIndex(s => s.id === sub.id);
        if (idx >= 0) this._allSubs[idx] = await ActivityService.getSubmissao(sub.id);
        this._drawTable();
        Sidebar.refreshBadge();
      },
    });
    setTimeout(() => {
      const btn = document.querySelector('.btn-modal-submit');
      if (btn) { btn.className = 'btn btn-danger btn-modal-submit'; btn.textContent = 'Rejeitar'; }
    }, 50);
  },
};
window.CoordenadorSubmissoes = CoordenadorSubmissoes;