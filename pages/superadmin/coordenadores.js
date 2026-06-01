/**
 * pages/superadmin/coordenadores.js — AcadFlow
 *
 * [FIX-2] Botão de excluir agora chama deleteCoordenadorSafe()
 * que desvincula todos os cursos antes de deletar, evitando FK violation.
 */
const SuperAdminCoordenadores = {
  _cursos: [],

  async render() {
    document.getElementById('page-content').innerHTML = `
      <div class="page-header stagger"><h1>Coordenadores</h1><p>Gerencie coordenadores e seus vínculos com cursos</p></div>
      <div id="coords-table-wrap" class="page-enter">${Loader.skeleton(4)}</div>`;

    const [list, cursos] = await Promise.all([
      UserService.getCoordenadores().catch(e => { Toast.error('Erro', e.message); return []; }),
      UserService.getCursos().catch(() => []),
    ]);
    this._cursos = cursos;
    this._draw(list, cursos);
  },

  _draw(list, cursos) {
    const cursosRef = cursos || this._cursos || [];
    const enriched  = list.map(c => ({
      ...c,
      cursosVinculados: cursosRef.filter(cu => cu.coordenador && cu.coordenador.id === c.id),
    }));

    Table.render('coords-table-wrap', {
      columns: [
        { key: 'name', label: 'Nome', render: r => `
          <div style="display:flex;align-items:center;gap:var(--space-2)">
            <div class="avatar-sm">${Helpers.initials(r.name)}</div>
            <div>
              <p style="font-weight:var(--fw-semibold)">${Helpers.escHtml(r.name)}</p>
              <p style="font-size:var(--text-xs);color:var(--gray-400)">${Helpers.escHtml(r.email)}</p>
            </div>
          </div>` },
        { key: 'cursosVinculados', label: 'Cursos vinculados', render: r =>
          r.cursosVinculados?.length
            ? r.cursosVinculados.map(c => `<span class="badge badge-blue" style="margin-right:3px">${Helpers.escHtml(c.nome)}</span>`).join('')
            : `<span class="text-muted">Nenhum curso vinculado</span>` },
      ],
      data: enriched,
      toolbar: `<button class="btn btn-primary" id="btn-novo-coord"><i class="fas fa-plus"></i> Novo Coordenador</button>`,
      actions: [
        { key: 'edit', label: 'Editar', icon: 'fas fa-pen', type: 'outline',
          onClick: row => this._form(row) },
        {
          // [FIX-2] Usa deleteCoordenadorSafe — desvincula cursos antes de deletar
          key: 'del', label: 'Excluir', icon: 'fas fa-trash', type: 'ghost',
          onClick: (row, reload) => Modal.confirm({
            title: 'Excluir coordenador',
            confirmText: 'Excluir',
            type: 'danger',
            message: `Excluir "${row.name}"? Todos os vínculos com cursos serão removidos automaticamente.`,
            onConfirm: async () => {
              await UserService.deleteCoordenadorSafe(row.id);
              Toast.success('Coordenador excluído', row.name);
              const [updated, cursosAtual] = await Promise.all([
                UserService.getCoordenadores(),
                UserService.getCursos(),
              ]);
              this._cursos = cursosAtual;
              this._draw(updated, cursosAtual);
            },
          }),
        },
      ],
    });

    document.getElementById('btn-novo-coord')?.addEventListener('click', () => this._form());
  },

  _form(coord = null) {
    Modal.form({
      title: coord ? 'Editar Coordenador' : 'Novo Coordenador',
      fields: `
        <div class="form-group">
          <label class="form-label">Nome completo <span class="required">*</span></label>
          <div class="form-control-icon-wrap">
            <i class="input-icon fas fa-user"></i>
            <input id="f-name" class="form-control" value="${Helpers.escHtml(coord?.name || '')}" placeholder="Nome do coordenador" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">E-mail institucional <span class="required">*</span></label>
          <div class="form-control-icon-wrap">
            <i class="input-icon fas fa-envelope"></i>
            <input id="f-email" type="email" class="form-control" value="${Helpers.escHtml(coord?.email || '')}" placeholder="coord@instituicao.edu" />
          </div>
        </div>
        ${!coord ? `
        <div class="form-group">
          <label class="form-label">Senha inicial <span class="required">*</span></label>
          <div class="form-control-icon-wrap">
            <i class="input-icon fas fa-lock"></i>
            <input id="f-pass" type="password" class="form-control" placeholder="Mínimo 6 caracteres" />
          </div>
          <p class="form-hint">O coordenador poderá alterar a senha após o primeiro acesso.</p>
        </div>` : ''}`,
      onSubmit: async (form, close) => {
        const name  = document.getElementById('f-name').value.trim();
        const email = document.getElementById('f-email').value.trim();
        if (!name || !email) throw new Error('Nome e e-mail são obrigatórios.');
        const data = { name, email };
        if (!coord) {
          const pass = document.getElementById('f-pass')?.value;
          if (!pass || pass.length < 6) throw new Error('Senha deve ter no mínimo 6 caracteres.');
          data.password = pass;
        }
        await UserService.saveCoordenador(data, coord?.id);
        Toast.success(coord ? 'Coordenador atualizado!' : 'Coordenador criado!', name);
        close();
        const [updated, cursosAtual] = await Promise.all([
          UserService.getCoordenadores(),
          UserService.getCursos(),
        ]);
        this._cursos = cursosAtual;
        this._draw(updated, cursosAtual);
      },
    });
  },
};

window.SuperAdminCoordenadores = SuperAdminCoordenadores;
