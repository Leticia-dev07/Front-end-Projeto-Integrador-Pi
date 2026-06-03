/**
 * services/activityService.js — AcadFlow
 *
 * CONTRATO DO BACKEND — SubmissaoResource / SubmissaoService:
 *
 * POST /submissoes  multipart/form-data
 * part "submissao" (application/json Submissao entity):
 * {
 * aluno:     { id: number },
 * categoria: { id: number },
 * curso:     { id: number },         ← obrigatório
 * certificado: {                     ← opcional (dados de Autenticação/OCR)
 * nomeAlunoOcr:    string | null,
 * nomeCursoOcr:    string | null,
 * cargaHorariaOcr: number | null,
 * dataConclusaoOcr:string | null
 * } | null
 * }
 * part "file": arquivo binário
 */
const ActivityService = {

  /* ── CATEGORIAS ───────────────────────────────────────── */
  getCategorias()  { return API.get('/categorias'); },
  getCategoria(id) { return API.get(`/categorias/${id}`); },

  async getCategoriasByCurso(cursoId) {
    const all = await API.get('/categorias');
    if (!cursoId) return all;
    return all.filter(c => c.cursoId === Number(cursoId));
  },

  saveCategoria(data, id, cursoId) {
    const body = {
      area:                    data.area,
      exigeComprovante:        data.exigeComprovante ?? true,
      horasPorCertificado:     data.horasPorCertificado,
      limiteSubmissoesSemestre: data.limiteSubmissoesSemestre,
    };
    if (id)      return API.put(`/categorias/${id}`, body);
    if (cursoId) return API.post(`/categorias/curso/${cursoId}`, body);
    return API.post('/categorias', body);
  },

  deleteCategoria(id) { return API.del(`/categorias/${id}`); },

  /* ── CURSOS DO ALUNO ──────────────────────────────────── */
  /**
   * [NOVO] Rota otimizada: Busca apenas os cursos vinculados ao aluno.
   */
  getCursosByAluno(alunoId) {
    if (!alunoId) return Promise.resolve([]);
    return API.get(`/alunos/${alunoId}/cursos`);
  },

  /* ── SUBMISSÕES ───────────────────────────────────────── */
  getSubmissoes()  { return API.get('/submissoes'); },
  
  getSubmissao(id) { return API.get(`/submissoes/${id}`); },

  getSubmissoesPorCurso(cursoId) {
    if (!cursoId) return Promise.resolve([]);
    return API.get(`/submissoes?cursoId=${cursoId}`);
  },

  getSubmissoesPorAluno(alunoId) {
    if (!alunoId) return Promise.resolve([]);
    return API.get(`/submissoes/aluno/${alunoId}`);
  },

  async getSubmissoesByAluno(nomeAluno) {
    const all = await this.getSubmissoes();
    return all.filter(s => s.nomeAluno === nomeAluno);
  },

  /**
   * Submete certificado.
   */
  async inserirSubmissao({ alunoId, categoriaId, cursoId, file, dadosOcr = null }) {
    if (!cursoId) throw new Error('Selecione o curso antes de enviar.');

    const submissaoObj = {
      aluno:     { id: alunoId     },
      categoria: { id: categoriaId },
      curso:     { id: cursoId     },
    };

    if (dadosOcr && Object.values(dadosOcr).some(v => v !== null && v !== '')) {
      submissaoObj.certificado = {
        nomeAlunoOcr:     dadosOcr.nomeAlunoOcr     || null,
        nomeCursoOcr:     dadosOcr.nomeCursoOcr     || null,
        cargaHorariaOcr:  dadosOcr.cargaHorariaOcr  ? Number(dadosOcr.cargaHorariaOcr) : null,
        dataConclusaoOcr: dadosOcr.dataConclusaoOcr || null,
      };
    }

    const fd = new FormData();
    fd.append('submissao', new Blob(
      [JSON.stringify(submissaoObj)],
      { type: 'application/json' }
    ));
    fd.append('file', file);

    return API.postMultipart('/submissoes', fd);
  },

  aprovar(id) { return API.putEmpty(`/submissoes/${id}/aprovar`); },

  rejeitar(id, observacao) {
    return API._fetch(`/submissoes/${id}/rejeitar`, {
      method: 'PUT',
      headers: { ...API._headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(observacao),
    });
  },
};
window.ActivityService = ActivityService;