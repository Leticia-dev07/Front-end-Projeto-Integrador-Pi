/**
 * pages/superadmin/alunos.js — AcadFlow
 */
const SuperAdminAlunos = {
  _cursos: [],
  async render() {
    document.getElementById('page-content').innerHTML = `
      <div class="page-header stagger"><h1>Alunos</h1><p>Cadastro e vínculo de alunos aos cursos</p></div>
      <div id="alunos-table-wrap" class="page-enter">${Loader.skeleton(5)}</div>`;
    const [alunos, cursos] = await Promise.all([
      UserService.getAlunos().catch(e=>{ Toast.error('Erro',e.message); return []; }),
      UserService.getCursos().catch(()=>[]),
    ]);
    this._cursos = cursos;
    this._draw(alunos);
  },

  _draw(list) {
    Table.render('alunos-table-wrap', {
      columns:[
        { key:'name', label:'Aluno', render:r=>`
          <div style="display:flex;align-items:center;gap:var(--space-2)">
            <div class="avatar-sm">${Helpers.initials(r.name)}</div>
            <div><p style="font-weight:var(--fw-semibold)">${Helpers.escHtml(r.name)}</p>
              <p style="font-size:var(--text-xs);color:var(--gray-400)">${Helpers.escHtml(r.email)}</p></div>
          </div>` },
        { key:'matricula', label:'Matrícula', render:r=>
          `<code style="font-size:var(--text-xs);background:var(--gray-100);padding:2px 6px;border-radius:4px">${r.matricula||'—'}</code>` },
        { key:'turma',          label:'Turma',   render:r=>`<span class="badge badge-gray">${r.turma||'—'}</span>` },
        { key:'horasAcumuladas',label:'Horas Aprov.', render:r=>`<strong>${r.horasAcumuladas||0}h</strong>` },
      ],
      data: list,
      toolbar:`<button class="btn btn-primary" id="btn-novo-aluno"><i class="fas fa-plus"></i> Novo Aluno</button>`,
      actions:[
        { key:'edit',label:'Editar', icon:'fas fa-pen',   type:'outline', onClick:row=>this._form(row) },
        { key:'del', label:'Excluir',icon:'fas fa-trash', type:'ghost',
          onClick:(row,reload)=>Modal.confirm({
            title:'Excluir aluno',confirmText:'Excluir',type:'danger',
            message:`Excluir "${row.name}"?`,
            onConfirm: async ()=>{
              await UserService.deleteAluno(row.id);
              Toast.success('Excluído',row.name);
              reload(await UserService.getAlunos());
            },
          }),
        },
      ],
    });
    document.getElementById('btn-novo-aluno')?.addEventListener('click',()=>this._form());
  },

  _form(aluno=null) {
    const cursoOpts = this._cursos.map(c=>`<option value="${c.id}">${Helpers.escHtml(c.nome)}</option>`).join('');
    Modal.form({
      title: aluno?'Editar Aluno':'Novo Aluno', size:'lg',
      fields:`
        <div class="form-row cols-2">
          <div class="form-group"><label class="form-label">Nome <span class="required">*</span></label>
            <input id="f-name"  class="form-control" value="${Helpers.escHtml(aluno?.name||'')}"      placeholder="Nome completo" /></div>
          <div class="form-group"><label class="form-label">E-mail <span class="required">*</span></label>
            <input id="f-email" type="email" class="form-control" value="${Helpers.escHtml(aluno?.email||'')}" placeholder="aluno@email.com" /></div>
        </div>
        <div class="form-row cols-2">
          <div class="form-group"><label class="form-label">Matrícula <span class="required">*</span></label>
            <input id="f-mat"   class="form-control" value="${Helpers.escHtml(aluno?.matricula||'')}" placeholder="202501001" /></div>
          <div class="form-group"><label class="form-label">Turma <span class="required">*</span></label>
            <input id="f-turma" class="form-control" value="${Helpers.escHtml(aluno?.turma||'')}"     placeholder="ADS-Noite" /></div>
        </div>
        ${!aluno?`<div class="form-row cols-2">
          <div class="form-group"><label class="form-label">Senha <span class="required">*</span></label>
            <input id="f-senha" type="password" class="form-control" placeholder="Mínimo 6 chars" /></div>
          <div class="form-group"><label class="form-label">Vincular ao Curso</label>
            <select id="f-curso" class="form-control"><option value="">— Nenhum —</option>${cursoOpts}</select></div>
        </div>`:''}`,
      onSubmit: async (form,close)=>{
        const name  = document.getElementById('f-name').value.trim();
        const email = document.getElementById('f-email').value.trim();
        const mat   = document.getElementById('f-mat').value.trim();
        const turma = document.getElementById('f-turma').value.trim();
        if (!name||!email||!mat||!turma) throw new Error('Preencha todos os campos obrigatórios.');
        const data = {name,email,matricula:mat,turma};
        if (!aluno) {
          const senha = document.getElementById('f-senha')?.value;
          if (!senha||senha.length<6) throw new Error('Senha: mínimo 6 caracteres.');
          data.senha = senha;
          const cursoId = Number(document.getElementById('f-curso')?.value)||null;
          await UserService.saveAluno(data, null, cursoId);
        } else {
          await UserService.saveAluno(data, aluno.id);
        }
        Toast.success(aluno?'Atualizado!':'Cadastrado!',name);
        close();
        this._draw(await UserService.getAlunos());
      },
    });
  },
};
window.SuperAdminAlunos = SuperAdminAlunos;
