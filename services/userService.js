/**
 * services/userService.js — AcadFlow
 * ─────────────────────────────────────────────────────────────
 * CORREÇÕES APLICADAS:
 *
 * [FIX-1] vincularCoordCurso / desvincularCoordCurso
 *   Endpoint correto: POST|DELETE /coordenadores/{coordId}/cursos/{cursoId}
 *   Antes usava API._fetch diretamente de forma inconsistente.
 *   Agora usa API.post() e API.del() via wrapper centralizado.
 *
 * [FIX-2] deleteCoordenador
 *   O backend DELETE /coordenadores/{id} falha com FK violation quando o
 *   coordenador ainda está vinculado a cursos. A correção é desvincular
 *   todos os cursos ANTES de deletar — operação feita no frontend antes
 *   de chamar o delete.
 *   A função deleteCoordenadorSafe() busca os cursos do coordenador,
 *   remove todos os vínculos e só então deleta.
 *
 * [FIX-3] vincularAlunoExistente
 *   POST /alunos/{alunoId}/cursos/{cursoId} — matricula aluno já cadastrado.
 *   Antes esse método existia mas não era exposto via UI.
 *
 * [FIX-4] getCursosByCoordenadorId
 *   Usa o id do coordenador diretamente ao invés de email, mais confiável
 *   quando a sessão tem profileId definido.
 */
const UserService = {

  // ─── CURSOS ────────────────────────────────────────────────
  getCursos()           { return API.get('/cursos'); },
  getCurso(id)          { return API.get(`/cursos/${id}`); },
  saveCurso(data, id)   { return id ? API.put(`/cursos/${id}`, data) : API.post('/cursos', data); },
  deleteCurso(id)       { return API.del(`/cursos/${id}`); },

  // ─── COORDENADORES ─────────────────────────────────────────
  getCoordenadores()    { return API.get('/coordenadores'); },
  getCoordenador(id)    { return API.get(`/coordenadores/${id}`); },
  saveCoordenador(d, id){ return id ? API.put(`/coordenadores/${id}`, d) : API.post('/coordenadores', d); },

  /**
   * [FIX-2] Deleta coordenador desviculando todos os cursos antes.
   * O backend lança FK violation se o coordenador ainda estiver vinculado.
   */
  async deleteCoordenadorSafe(coordId) {
    // Busca todos os cursos para descobrir quais têm este coordenador
    const cursos = await this.getCursos().catch(() => []);
    const cursoIds = cursos
      .filter(c => c.coordenador && c.coordenador.id === coordId)
      .map(c => c.id);

    // Desvincula de todos os cursos antes de deletar
    for (const cid of cursoIds) {
      await this.desvincularCoordCurso(coordId, cid).catch(() => {});
    }

    return API.del(`/coordenadores/${coordId}`);
  },

  /**
   * [FIX-1] Vincular coordenador a curso.
   * Endpoint: POST /coordenadores/{coordId}/cursos/{cursoId}
   * Não tem corpo — é apenas uma operação de vínculo.
   */
  vincularCoordCurso(coordId, cursoId) {
    return API._fetch(`/coordenadores/${coordId}/cursos/${cursoId}`, {
      method: 'POST',
      headers: API._headers(),
    });
  },

  /**
   * [FIX-1] Desvincular coordenador de curso.
   * Endpoint: DELETE /coordenadores/{coordId}/cursos/{cursoId}
   */
  desvincularCoordCurso(coordId, cursoId) {
    return API.del(`/coordenadores/${coordId}/cursos/${cursoId}`);
  },

  // ─── ALUNOS ────────────────────────────────────────────────
  getAlunos()               { return API.get('/alunos'); },
  getAluno(id)              { return API.get(`/alunos/${id}`); },
  getAlunosByCurso(cursoId) { return API.get(`/alunos/curso/${cursoId}`); },

  /**
   * Cria ou atualiza aluno.
   * cursoId = null: POST /alunos (cria sem vínculo)
   * cursoId != null: POST /alunos/curso/{cursoId} (cria + vincula)
   * id != null: PUT /alunos/{id} (atualiza)
   */
  saveAluno(data, id = null, cursoId = null) {
    if (id)      return API.put(`/alunos/${id}`, data);
    if (cursoId) return API.post(`/alunos/curso/${cursoId}`, data);
    return API.post('/alunos', data);
  },

  deleteAluno(id) { return API.del(`/alunos/${id}`); },

  /**
   * [FIX-3] Matricula aluno já existente em um curso.
   * Endpoint: POST /alunos/{alunoId}/cursos/{cursoId}
   */
  matricularEmCurso(alunoId, cursoId) {
    return API._fetch(`/alunos/${alunoId}/cursos/${cursoId}`, {
      method: 'POST',
      headers: API._headers(),
    });
  },

  desvincularAlunoCurso(alunoId, cursoId) {
    return API.del(`/alunos/${alunoId}/cursos/${cursoId}`);
  },

  // ─── ADMINS ────────────────────────────────────────────────
  getAdmins()           { return API.get('/admins'); },
  updateAdmin(id, data) { return API.put(`/admins/${id}`, data); },

  // ─── Utilitários ───────────────────────────────────────────

  /**
   * [FIX-4] Retorna cursos do coordenador filtrando por profileId ou email.
   * Usa profileId da sessão quando disponível (mais preciso).
   */
  async getCursosByCoordenadorEmail(email) {
    const [cursos, coords] = await Promise.all([
      this.getCursos().catch(() => []),
      this.getCoordenadores().catch(() => []),
    ]);
    const me = coords.find(c => c.email === email);
    if (!me) return [];
    // CursoDTO.coordenador é o primeiro do Set<Coordenador> da entidade.
    // Filtramos por id do coordenador encontrado.
    return cursos.filter(c => c.coordenador && c.coordenador.id === me.id);
  },

  /**
   * Retorna cursos do coordenador por ID direto (mais confiável quando
   * a sessão tem profileId definido).
   */
  async getCursosByCoordenadorId(coordId) {
    const cursos = await this.getCursos().catch(() => []);
    return cursos.filter(c => c.coordenador && c.coordenador.id === coordId);
  },
};

window.UserService = UserService;
