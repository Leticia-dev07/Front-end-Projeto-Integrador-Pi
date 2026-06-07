/**
 * pages/aluno/submeter.js — AcadFlow
 *
 * FLUXO ATUALIZADO E DEFINITIVO:
 * 1. Todos os campos são sempre visíveis e desbloqueados.
 * 2. Busca otimizada de cursos diretamente no backend.
 * 3. Bloqueio ABSOLUTO de duplicidade de cursos via normalize('NFD') na renderização.
 * 4. Seção do Certificado fixa, nativa e obrigatória (independente de OCR).
 * 5. Botão sempre clicável (validação via Toast para melhor UX).
 * 6. Integração OCR Inteligente via Microsserviço Local.
 */
const AlunoSubmeter = {
  _file:       null,
  _alunoId:    null,
  _cursoId:    null,
  _meusCursos: [],
  _cats:       [],

  async render() {
    const session   = Storage.getSession();
    const container = document.getElementById('page-content');

    container.innerHTML = `
      <div class="page-header stagger">
        <h1>Submeter Atividade</h1>
        <p>Envie seu certificado para análise do coordenador</p>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;padding:var(--space-16)">
        <div style="text-align:center;color:var(--text-muted)">
          <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:var(--space-4)"></i>
          <p>Carregando...</p>
        </div>
      </div>`;

    this._alunoId = session.profileId;
    this._file    = null;

    await this._loadCursos(session);
    const all  = await ActivityService.getCategorias().catch(() => []);
    this._cats = this._cursoId ? all.filter(c => c.cursoId === Number(this._cursoId)) : all;

    this._renderForm();
  },

  // ── BUSCA DE CURSOS OTIMIZADA ──
  async _loadCursos(session) {
    try {
      const cursos = await ActivityService.getCursosByAluno(session.profileId);
      this._meusCursos = cursos || [];
      
      const salvo  = Storage.getAlunoCursoAtivo();
      const valido = this._meusCursos.find(c => Number(c.id) === Number(salvo));
      this._cursoId = valido ? valido.id : (this._meusCursos[0]?.id || null);
      if (this._cursoId) Storage.setAlunoCursoAtivo(this._cursoId);
    } catch { 
      this._meusCursos = [];
      this._cursoId = null; 
    }
  },

  _renderForm() {
    const container = document.getElementById('page-content');
    const catOpts   = this._cats.map(c =>
      `<option value="${c.id}" data-horas="${c.horasPorCertificado}" data-limite="${c.limiteSubmissoesSemestre}">
        ${Helpers.escHtml(c.area)} (${c.horasPorCertificado}h/cert.)
      </option>`
    ).join('');

    // ── FILTRO DEFINITIVO DE DUPLICATAS NA RENDERIZAÇÃO ──
    const cursosUnicosParaRender = [];
    const nomesVistosParaRender = new Set();

    for (const c of this._meusCursos) {
      if (!c || !c.nome) continue;
      const nomeBlindado = c.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

      if (!nomesVistosParaRender.has(nomeBlindado)) {
        nomesVistosParaRender.add(nomeBlindado);
        cursosUnicosParaRender.push(c);
      }
    }

    const cursoOpts = cursosUnicosParaRender.map(c =>
      `<option value="${c.id}" ${c.id === this._cursoId ? 'selected' : ''}>${Helpers.escHtml(c.nome)}</option>`
    ).join('');

    container.innerHTML = `
      <div class="page-header stagger">
        <h1>Submeter Atividade</h1>
        <p>Envie seu certificado para análise do coordenador</p>
      </div>

      <div class="grid-sidebar stagger submeter-grid">

        <div class="card">
          <div class="card-header">
            <span class="card-header-title">
              <i class="fas fa-file-arrow-up" style="color:var(--accent);margin-right:var(--space-2)"></i>
              Nova submissão
            </span>
          </div>
          <div class="card-body">
            <form id="submit-form" novalidate style="display:flex;flex-direction:column;gap:var(--space-6)">

              <div>
                <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3)">
                  <span class="step-badge" style="width:24px;height:24px;border-radius:50%;background:var(--accent);color:white;
                    display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;flex-shrink:0">1</span>
                  <p style="font-weight:var(--fw-semibold);color:var(--text-primary);font-size:var(--text-sm)">
                    Faça upload do certificado <span style="color:var(--danger)">*</span>
                  </p>
                </div>
                <div class="file-upload-zone" id="upload-zone">
                  <input type="file" id="f-file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
                  <div class="upload-icon"><i class="fas fa-cloud-arrow-up"></i></div>
                  <p class="upload-title">Arraste ou clique para selecionar</p>
                  <p class="upload-sub">PDF, JPG ou PNG · Máx. 10 MB</p>
                </div>
                <div id="file-preview" class="hidden"></div>
              </div>

              <div>
                <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3)">
                  <span class="step-badge" style="width:24px;height:24px;border-radius:50%;
                    background:var(--accent);color:white;
                    display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;flex-shrink:0">2</span>
                  <p style="font-weight:var(--fw-semibold);font-size:var(--text-sm);color:var(--text-primary)">
                    Classifique a atividade
                  </p>
                </div>

                ${cursosUnicosParaRender.length > 1 ? `
                <div class="form-group" style="margin-bottom: var(--space-3);">
                  <label class="form-label">Curso <span style="color:var(--danger)">*</span></label>
                  <select id="f-curso" class="form-control">${cursoOpts}</select>
                </div>` : `<input type="hidden" id="f-curso" value="${this._cursoId || ''}">`}

                <div class="form-group">
                  <label class="form-label">Categoria da atividade <span style="color:var(--danger)">*</span></label>
                  ${this._cats.length
                    ? `<select id="f-cat" class="form-control">
                        <option value="">— Selecione —</option>${catOpts}
                       </select>`
                    : `<div style="padding:var(--space-4);background:var(--warning-light);border-radius:var(--radius-md);
                        font-size:var(--text-sm);color:#92400e">
                        <i class="fas fa-triangle-exclamation"></i>
                        Nenhuma categoria cadastrada para este curso. Contate o coordenador.
                       </div>`}
                </div>

                <div id="cat-info" class="hidden"
                  style="margin-top: var(--space-3); padding:var(--space-3) var(--space-4);background:var(--accent-light);
                    border-radius:var(--radius-md);border:1px solid var(--border-strong)">
                  <p style="font-size:var(--text-xs);color:var(--accent);font-weight:600">
                    <i class="fas fa-circle-info"></i>
                    Esta categoria concede <strong><span id="cat-horas"></span>h</strong> por certificado
                    · Limite: <span id="cat-limite"></span>/semestre
                  </p>
                </div>
              </div>

              <div style="padding-top: var(--space-4); border-top: 1px solid var(--border-color);">
                <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3)">
                  <span class="step-badge" style="width:24px;height:24px;border-radius:50%;
                    background:var(--accent);color:white;
                    display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;flex-shrink:0">3</span>
                  <p style="font-weight:var(--fw-semibold);font-size:var(--text-sm);color:var(--text-primary)">
                    Dados do Documento
                  </p>
                </div>
                
                <div style="background:var(--surface-hover); padding:var(--space-4); border-radius:var(--radius-md); border:1px solid var(--border-color);">
                  <div style="display:flex; flex-wrap:wrap; gap:var(--space-3); margin-bottom:var(--space-3);">
                    <div class="form-group" style="flex: 1 1 200px;">
                      <label class="form-label">Nome do aluno (como está no certificado) <span style="color:var(--danger)">*</span></label>
                      <input type="text" id="cert-nome-aluno" class="form-control" placeholder="Ex: João da Silva" autocomplete="off" />
                    </div>
                    <div class="form-group" style="flex: 1 1 200px;">
                      <label class="form-label">Nome do Curso/Evento <span style="color:var(--danger)">*</span></label>
                      <input type="text" id="cert-nome-curso" class="form-control" placeholder="Ex: Spring Boot Avançado" autocomplete="off" />
                    </div>
                  </div>
                  
                  <div style="display:flex; flex-wrap:wrap; gap:var(--space-3);">
                    <div class="form-group" style="flex: 1 1 200px;">
                      <label class="form-label">Carga horária (horas) <span style="color:var(--danger)">*</span></label>
                      <input type="number" id="cert-carga" class="form-control" placeholder="Ex: 40" min="1" max="999" />
                    </div>
                    <div class="form-group" style="flex: 1 1 200px;">
                      <label class="form-label">Data de conclusão <span style="color:var(--danger)">*</span></label>
                      <input type="text" id="cert-data" class="form-control" placeholder="Ex: 15/03/2026" autocomplete="off" />
                    </div>
                  </div>
                </div>
              </div>

              ${this._cats.length
                ? `<button type="submit" class="btn btn-primary btn-lg" id="submit-btn" style="margin-top:var(--space-2)">
                    <i class="fas fa-paper-plane"></i> Enviar para análise
                   </button>`
                : ''}
            </form>
          </div>
        </div>

        <div class="submeter-info-panel" style="display:flex;flex-direction:column;gap:var(--space-4)">
          <div class="card">
            <div class="card-header"><span class="card-header-title">Como funciona</span></div>
            <div class="card-body" style="padding:0">
              ${[
                ['fas fa-upload',     '1. Upload',   'Selecione o arquivo do certificado'],
                ['fas fa-list-check', '2. Dados',    'Escolha categoria e curso'],
                ['fas fa-paper-plane','3. Envio',    'Preencha as informações e envie'],
                ['fas fa-clock',      '4. Aguarde',  'O Coordenador irá avaliar'],
              ].map(([ic, t, d]) => `
                <div style="display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--border-color)">
                  <i class="${ic}" style="color:var(--accent);margin-top:2px;width:14px;text-align:center;flex-shrink:0"></i>
                  <div>
                    <p style="font-size:var(--text-sm);font-weight:var(--fw-semibold);color:var(--text-primary)">${t}</p>
                    <p style="font-size:var(--text-xs);color:var(--text-muted)">${d}</p>
                  </div>
                </div>`).join('')}
            </div>
          </div>

          ${this._cats.length ? `
          <div class="card">
            <div class="card-header"><span class="card-header-title">Categorias disponíveis</span></div>
            <div class="card-body" style="padding:0;max-height:220px;overflow-y:auto">
              ${this._cats.map(c => `
              <div style="display:flex;align-items:center;justify-content:space-between;
                padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--border-color)">
                <div>
                  <p style="font-size:var(--text-sm);font-weight:var(--fw-medium);color:var(--text-primary)">${Helpers.escHtml(c.area)}</p>
                  <p style="font-size:var(--text-xs);color:var(--text-muted)">Limite: ${c.limiteSubmissoesSemestre}/sem.</p>
                </div>
                <span class="badge badge-blue">${c.horasPorCertificado}h</span>
              </div>`).join('')}
            </div>
          </div>` : ''}

          <div class="card" style="border:1.5px solid #fde68a">
            <div class="card-body" style="background:var(--warning-light)">
              <p style="font-size:var(--text-sm);font-weight:600;color:#92400e;margin-bottom:var(--space-2)">
                <i class="fas fa-triangle-exclamation"></i> Atenção
              </p>
              <ul style="font-size:var(--text-xs);color:#78350f;line-height:1.8;padding-left:var(--space-4);list-style:disc">
                <li>Envie apenas certificados originais</li>
                <li>O arquivo deve estar legível</li>
                <li>Duplicatas serão rejeitadas</li>
                <li>Prazo de análise: até 5 dias úteis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;

    this._bindEvents();
  },

  _bindEvents() {
    const zone      = document.getElementById('upload-zone');
    const input     = document.getElementById('f-file');
    const preview   = document.getElementById('file-preview');
    const catInput  = document.getElementById('f-cat');

    // ── Troca de curso → recarrega categorias ──────────────
    document.getElementById('f-curso')?.addEventListener('change', async e => {
      const newId = Number(e.target.value);
      if (newId !== this._cursoId) {
        this._cursoId = newId;
        Storage.setAlunoCursoAtivo(newId);
        const all  = await ActivityService.getCategorias().catch(() => []);
        this._cats = all.filter(c => c.cursoId === newId);
        const sel  = document.getElementById('f-cat');
        if (sel) {
          sel.innerHTML = `<option value="">— Selecione —</option>` +
            this._cats.map(c =>
              `<option value="${c.id}" data-horas="${c.horasPorCertificado}" data-limite="${c.limiteSubmissoesSemestre}">
                ${Helpers.escHtml(c.area)} (${c.horasPorCertificado}h/cert.)</option>`
            ).join('');
          document.getElementById('cat-info')?.classList.add('hidden');
        }
      }
    });

    // ── Info da categoria ───────────────────────────────────
    catInput?.addEventListener('change', e => {
      const opt  = e.target.selectedOptions[0];
      const info = document.getElementById('cat-info');
      if (opt?.dataset.horas) {
        const horasEl  = document.getElementById('cat-horas');
        const limiteEl = document.getElementById('cat-limite');
        if (horasEl)  horasEl.textContent  = opt.dataset.horas;
        if (limiteEl) limiteEl.textContent = opt.dataset.limite;
        info?.classList.remove('hidden');
      } else {
        info?.classList.add('hidden');
      }
    });

    // ── Upload ─────────────────────────────────────────────
    const handleFile = async file => {
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { Toast.error('Arquivo muito grande', 'O limite é de 10 MB.'); return; }
      this._file = file;
      zone.classList.add('has-file');
      preview.classList.remove('hidden');
      preview.innerHTML = `
        <div class="file-preview">
          <i class="file-preview-icon fas fa-${file.type.includes('pdf') ? 'file-pdf' : 'file-image'}"></i>
          <span class="file-preview-name">${Helpers.escHtml(file.name)}</span>
          <span style="font-size:var(--text-xs);color:var(--text-muted)">${(file.size/1024).toFixed(0)} KB</span>
          <i class="file-preview-remove fas fa-xmark" id="remove-file" role="button" tabindex="0" title="Remover"></i>
        </div>`;
      
      document.getElementById('remove-file').addEventListener('click', () => {
        this._file = null; input.value = '';
        zone.classList.remove('has-file');
        preview.classList.add('hidden');
      });
      
      if (typeof this._processOcrPlaceholder === 'function') {
        await this._processOcrPlaceholder(file);
      }
    };

    input?.addEventListener('change', e => handleFile(e.target.files[0]));
    zone?.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone?.addEventListener('dragleave', ()  => zone.classList.remove('dragover'));
    zone?.addEventListener('drop',      e  => {
      e.preventDefault();
      zone.classList.remove('dragover');
      handleFile(e.dataTransfer.files[0]);
    });

    // ── Envio com Validação Forte ──────────────────────────
    document.getElementById('submit-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const btn     = document.getElementById('submit-btn');
      const catId   = Number(document.getElementById('f-cat')?.value);
      const cursoId = Number(document.getElementById('f-curso')?.value) || this._cursoId;

      if (!this._file)  { Toast.error('Faltou o arquivo!', 'Faça o upload do seu certificado no Passo 1.'); return; }
      if (!cursoId)     { Toast.error('Faltou o curso!', 'Selecione a qual curso esta atividade pertence no Passo 2.'); return; }
      if (!catId)       { Toast.error('Faltou a categoria!', 'Selecione a categoria da atividade no Passo 2.'); return; }
      if (!this._alunoId){ Toast.error('Sessão inválida', 'Faça login novamente no sistema.'); return; }

      const dadosOcr = {
        nomeAlunoOcr:     document.getElementById('cert-nome-aluno')?.value.trim() || null,
        nomeCursoOcr:     document.getElementById('cert-nome-curso')?.value.trim() || null,
        cargaHorariaOcr:  document.getElementById('cert-carga')?.value ? Number(document.getElementById('cert-carga').value) : null,
        dataConclusaoOcr: document.getElementById('cert-data')?.value.trim() || null,
      };
      
      if (!dadosOcr.nomeAlunoOcr || !dadosOcr.nomeCursoOcr || !dadosOcr.cargaHorariaOcr || !dadosOcr.dataConclusaoOcr) {
        Toast.error('Campos Incompletos', 'Preencha todos os dados exigidos no Passo 3.');
        return;
      }

      Loader.btnLoading(btn);
      try {
        await ActivityService.inserirSubmissao({
          alunoId:     this._alunoId,
          categoriaId: catId,
          cursoId,
          file:        this._file,
          dadosOcr:    dadosOcr,
        });
        Toast.success('Atividade enviada!', 'Ela já está na fila de análise do coordenador.');
        setTimeout(() => Router.navigate('aluno/historico'), 1200);
      } catch (err) {
        Toast.error('Erro ao enviar', err.message);
        Loader.btnDone(btn);
      }
    });
  },

  // ── INTEGRAÇÃO COM A API DE OCR LOCAL ──
  // ── INTEGRAÇÃO COM A API DE OCR (PRODUÇÃO) ──
  async _processOcrPlaceholder(file) {
    // Atualizamos a mensagem para tranquilizar o aluno em caso de Cold Start do Render
    Toast.info('Analisando documento...', 'A IA está extraindo os dados. Isso pode levar até 1 minuto na primeira leitura.');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Apontando para o seu microsserviço no Render
      const response = await fetch('https://ocr-tesseract-python.onrender.com/ler-certificado', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao processar o certificado.');
      }

      const data = await response.json();
      
      if (data.sucesso && data.dadosOcr) {
        this._preencherCamposOcr(data.dadosOcr);
      }
    } catch (error) {
      console.error("Erro no OCR:", error);
      Toast.error('Erro na Leitura Automática', 'Não foi possível ler o arquivo. Por favor, preencha os dados manualmente.');
    }
  },

  _preencherCamposOcr(dados) {
    if (!dados) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('cert-nome-aluno', dados.nomeAlunoOcr);
    set('cert-nome-curso', dados.nomeCursoOcr);
    set('cert-carga',      dados.cargaHorariaOcr);
    set('cert-data',       dados.dataConclusaoOcr);
    
    if (dados.categoriaId) {
      const cat = document.getElementById('f-cat');
      if (cat) { cat.value = dados.categoriaId; cat.dispatchEvent(new Event('change')); }
    }
    Toast.success('Dados Extraídos', 'Campos preenchidos automaticamente. Verifique as informações antes de enviar.');
  },
};
window.AlunoSubmeter = AlunoSubmeter;