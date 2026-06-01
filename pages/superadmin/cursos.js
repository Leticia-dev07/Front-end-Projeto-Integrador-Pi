/**
 * pages/superadmin/cursos.js — AcadFlow
 *
 * [FIX-SAVE-CURSO] Ao criar um novo curso, o ID só existe após o POST retornar.
 * Antes: `saved?.id || curso?.id` podia ser undefined em edição (PUT retorna DTO mas
 * a variável era descartada). Agora capturamos corretamente o ID em ambos os casos.
 *
 * [FIX-COORD-VINCULAR] A vinculação do coordenador ao salvar/editar curso agora:
 *  1. Desvincula o coord atual (se houver) para evitar múltiplos vínculos
 *  2. Vincula o novo coord selecionado
 */
const SuperAdminCursos = {
  async render() {
    document.getElementById('page-content').innerHTML = `
      <div class="page-header stagger"><h1>Cursos</h1><p>Gerencie os cursos da instituição</p></div>
      <div id="cursos-table-wrap" class="page-enter">${Loader.skeleton(4)}</div>`;

    const cursos = await UserService.getCursos().catch(e => { Toast.error('Erro', e.message); return []; });
    this._draw(cursos);
  },

  _draw(cursos) {
    Table.render('cursos-table-wrap', {
      columns: [
        { key: 'nome', label: 'Nome do Curso' },
        { key: 'descricao', label: 'Descrição', render: r =>
          `<span style="color:var(--gray-500);font-size:var(--text-xs)">${Helpers.escHtml((r.descricao || '').slice(0, 70))}${(r.descricao || '').length > 70 ? '…' : ''}</span>` },
        { key: 'cargaHorariaMax', label: 'Carga Máx.', render: r =>
          `<span class="badge badge-blue">${r.cargaHorariaMax}h</span>` },
        { key: 'coordenador', label: 'Coordenador', render: r =>
          r.coordenador
            ? `<div style="display:flex;align-items:center;gap:var(--space-2)">
                <div class="avatar-sm" style="width:24px;height:24px;font-size:.6rem">${Helpers.initials(r.coordenador.name)}</div>
                <span style="font-size:var(--text-sm)">${Helpers.escHtml(r.coordenador.name)}</span>
               </div>`
            : `<span class="badge badge-gray">Sem coordenador</span>` },
      ],
      data: cursos,
      toolbar: `<button class="btn btn-primary" id="btn-novo-curso"><i class="fas fa-plus"></i> Novo Curso</button>`,
      actions: [
        { key: 'detail', label: 'Ver detalhes', icon: 'fas fa-eye', type: 'outline',
          onClick: row => Router.navigate(`superadmin/curso-detalhe/${row.id}`) },
        { key: 'edit',   label: 'Editar',        icon: 'fas fa-pen', type: 'ghost',
          onClick: row => this._form(row) },
        { key: 'del',    label: 'Excluir',       icon: 'fas fa-trash', type: 'ghost',
          onClick: (row, reload) => Modal.confirm({
            title: 'Excluir curso',
            confirmText: 'Excluir',
            type: 'danger',
            message: `Excluir "${row.nome}"? Esta ação remove o curso e todos os seus vínculos.`,
            onConfirm: async () => {
              await UserService.deleteCurso(row.id);
              Toast.success('Curso excluído', row.nome);
              reload(await UserService.getCursos());
            },
          }),
        },
      ],
    });

    document.getElementById('btn-novo-curso')?.addEventListener('click', () => this._form());
  },

  async _form(curso = null) {
    const coords = await UserService.getCoordenadores().catch(() => []);
    const coordOpts = coords.map(c =>
      `<option value="${c.id}" ${curso?.coordenador?.id === c.id ? 'selected' : ''}>${Helpers.escHtml(c.name)} — ${Helpers.escHtml(c.email)}</option>`
    ).join('');

    Modal.form({
      title: curso ? 'Editar Curso' : 'Novo Curso',
      size: 'lg',
      fields: `
        <div class="form-group">
          <label class="form-label">Nome do curso <span class="required">*</span></label>
          <input id="f-nome" class="form-control"
            value="${Helpers.escHtml(curso?.nome || '')}"
            placeholder="Ex: Análise e Desenvolvimento de Sistemas" />
        </div>
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <textarea id="f-desc" class="form-control" rows="3"
            placeholder="Descreva brevemente o curso...">${Helpers.escHtml(curso?.descricao || '')}</textarea>
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Carga horária máxima (h) <span class="required">*</span></label>
            <input id="f-carga" type="number" class="form-control"
              value="${curso?.cargaHorariaMax || 200}" min="1" />
          </div>
          <div class="form-group">
            <label class="form-label">Coordenador responsável</label>
            <select id="f-coord" class="form-control">
              <option value="">— Nenhum —</option>
              ${coordOpts}
            </select>
          </div>
        </div>`,
      onSubmit: async (form, close) => {
        const nome    = document.getElementById('f-nome').value.trim();
        const desc    = document.getElementById('f-desc').value.trim();
        const carga   = Number(document.getElementById('f-carga').value);
        const coordId = Number(document.getElementById('f-coord').value) || null;

        if (!nome)  throw new Error('Nome é obrigatório.');
        if (!carga) throw new Error('Carga horária inválida.');

        // [FIX-SAVE-CURSO] Captura o retorno do save para obter o ID correto
        const savedCurso = await UserService.saveCurso(
          { nome, descricao: desc, cargaHorariaMax: carga },
          curso?.id   // null = POST, número = PUT
        );

        // ID do curso: recém-criado ou já existente
        const cursoId = savedCurso?.id || curso?.id;

        if (cursoId && coordId !== null) {
          try {
            // [FIX-COORD-VINCULAR] Desvincula atual (se houver) e vincula o novo
            if (curso?.coordenador && curso.coordenador.id !== coordId) {
              await UserService.desvincularCoordCurso(curso.coordenador.id, cursoId).catch(() => {});
            }
            if (coordId) {
              await UserService.vincularCoordCurso(coordId, cursoId);
            }
          } catch {
            // Vínculo é operação secundária — não bloqueia o save do curso
            Toast.warning('Curso salvo', 'Não foi possível vincular o coordenador. Tente pela página de detalhes.');
          }
        }

        Toast.success(curso ? 'Curso atualizado!' : 'Curso criado!', nome);
        close();
        this._draw(await UserService.getCursos());
      },
    });
  },
};

window.SuperAdminCursos = SuperAdminCursos;
