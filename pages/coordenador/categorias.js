/**
 * pages/coordenador/categorias.js — AcadFlow
 * Categorias filtradas pelo cursoAtivo do coordenador.
 */
const CoordenadorCategorias = {
  _cursoId: null,

  async render() {
    const session = Storage.getSession();
    document.getElementById('page-content').innerHTML = `
      <div class="page-header stagger"><h1>Categorias</h1><p>Categorias de atividades complementares do seu curso</p></div>
      <div id="cat-table-wrap" class="page-enter">${Loader.skeleton(4)}</div>`;

    // Descobre cursoAtivo
    const cursos = await UserService.getCursosByCoordenadorEmail(session.email).catch(()=>[]);
    this._cursoId = Storage.getCursoAtivo() || cursos[0]?.id || null;

    const all  = await ActivityService.getCategorias().catch(e=>{ Toast.error('Erro',e.message); return []; });
    const list = this._cursoId ? all.filter(c=>c.cursoId===Number(this._cursoId)) : all;
    this._draw(list);
  },

  _draw(list) {
    Table.render('cat-table-wrap', {
      columns:[
        { key:'area', label:'Categoria' },
        { key:'horasPorCertificado',    label:'Horas/Cert.',  render:r=>`<span class="badge badge-blue">${r.horasPorCertificado}h</span>` },
        { key:'limiteSubmissoesSemestre',label:'Limite/Sem.',  render:r=>`<strong>${r.limiteSubmissoesSemestre}</strong> submissões` },
        { key:'exigeComprovante',        label:'Exige Comprov.',render:r=>
          r.exigeComprovante?`<span class="badge badge-approved">Sim</span>`:`<span class="badge badge-gray">Não</span>` },
      ],
      data: list,
      toolbar:`<button class="btn btn-primary" id="btn-nova-cat"><i class="fas fa-plus"></i> Nova Categoria</button>`,
      actions:[
        { key:'edit',label:'Editar', icon:'fas fa-pen',   type:'outline', onClick:row=>this._form(row) },
        { key:'del', label:'Excluir',icon:'fas fa-trash', type:'ghost',
          onClick:(row,reload)=>Modal.confirm({
            title:'Excluir categoria',confirmText:'Excluir',type:'danger',
            message:`Excluir "${row.area}"?`,
            onConfirm: async ()=>{
              await ActivityService.deleteCategoria(row.id);
              Toast.success('Excluída');
              const all = await ActivityService.getCategorias();
              reload(this._cursoId ? all.filter(c=>c.cursoId===Number(this._cursoId)) : all);
            },
          }),
        },
      ],
    });
    document.getElementById('btn-nova-cat')?.addEventListener('click',()=>this._form());
  },

  _form(cat=null) {
    Modal.form({
      title: cat?'Editar Categoria':'Nova Categoria',
      fields:`
        <div class="form-group"><label class="form-label">Nome <span class="required">*</span></label>
          <input id="f-area" class="form-control" value="${Helpers.escHtml(cat?.area||'')}" placeholder="Ex: Cursos Online, Palestras..." /></div>
        <div class="form-row cols-2">
          <div class="form-group"><label class="form-label">Horas por certificado <span class="required">*</span></label>
            <input id="f-horas"  type="number" class="form-control" value="${cat?.horasPorCertificado||20}"  min="1" max="300" /></div>
          <div class="form-group"><label class="form-label">Limite submissões/semestre</label>
            <input id="f-limite" type="number" class="form-control" value="${cat?.limiteSubmissoesSemestre||3}" min="1" /></div>
        </div>
        <div class="form-check" style="margin-top:var(--space-2)">
          <input type="checkbox" id="f-comp" ${cat?.exigeComprovante!==false?'checked':''} />
          <label for="f-comp">Exige comprovante obrigatório</label>
        </div>`,
      onSubmit: async (form,close)=>{
        const area   = document.getElementById('f-area').value.trim();
        const horas  = Number(document.getElementById('f-horas').value);
        const limite = Number(document.getElementById('f-limite').value);
        const comp   = document.getElementById('f-comp').checked;
        if (!area)  throw new Error('Nome da categoria é obrigatório.');
        if (!horas) throw new Error('Horas inválidas.');
        await ActivityService.saveCategoria(
          { area, horasPorCertificado:horas, limiteSubmissoesSemestre:limite, exigeComprovante:comp },
          cat?.id,
          !cat ? this._cursoId : null
        );
        Toast.success(cat?'Atualizada!':'Criada!', area);
        close();
        const all = await ActivityService.getCategorias();
        this._draw(this._cursoId ? all.filter(c=>c.cursoId===Number(this._cursoId)) : all);
      },
    });
  },
};
window.CoordenadorCategorias = CoordenadorCategorias;
