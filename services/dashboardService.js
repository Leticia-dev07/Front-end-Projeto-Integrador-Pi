/**
 * services/dashboardService.js — AcadFlow
 * Usa nomeCurso do SubmissaoDTO para melhor filtragem.
 * * [FIX-SEGURANCA] Atualizado para usar ActivityService.getSubmissoesPorCurso()
 * impedindo vazamento de dados de outros cursos no Dashboard do Coordenador e Aluno.
 */
const DashboardService = {

  async getSuperAdminStats() {
    const [cursos, coords, alunos, subs] = await Promise.all([
      UserService.getCursos().catch(()=>[]),
      UserService.getCoordenadores().catch(()=>[]),
      UserService.getAlunos().catch(()=>[]),
      ActivityService.getSubmissoes().catch(()=>[]), // Apenas o SuperAdmin pode ver tudo
    ]);
    return {
      totalCursos: cursos.length, totalAlunos: alunos.length,
      totalCoordenadores: coords.length, totalSubmissoes: subs.length,
      pendentes:  subs.filter(s=>s.status==='PENDENTE').length,
      aprovadas:  subs.filter(s=>s.status==='APROVADO').length,
      rejeitadas: subs.filter(s=>s.status==='REJEITADO').length,
      monthlyData: this._groupByMonth(subs, 6),
      recentSubmissoes: [...subs].sort((a,b)=>new Date(b.dataEnvio)-new Date(a.dataEnvio)).slice(0,8),
    };
  },

  async getCoordenadorStats(cursoIds, cursoAtivo) {
    // 1. Identifica o curso foco do dashboard
    const cursoParaUsar = cursoAtivo || (cursoIds && cursoIds.length > 0 ? cursoIds[0] : null);
    
    // Se o coordenador não tem curso vinculado, retorna valores zerados para não quebrar a tela
    if (!cursoParaUsar) {
      return {
        totalAlunos: 0, totalSubs: 0, pendentes: 0, aprovadas: 0, rejeitadas: 0,
        mediaHoras: 0, cargaMax: 200, ranking: [], recentSubs: [],
        progressData: [
          { label:'Pendentes',  value:0, color:'#d97706' },
          { label:'Aprovadas',  value:0, color:'#12a150' },
          { label:'Rejeitadas', value:0, color:'#dc2626' },
        ],
      };
    }

    // 2. [CORREÇÃO AQUI] Busca APENAS as submissões deste curso via backend, 
    // junto com os alunos matriculados neste mesmo curso.
    const [alunosDoCurso, subsDoCurso, cursos] = await Promise.all([
      UserService.getAlunosByCurso(cursoParaUsar).catch(()=>[]),
      ActivityService.getSubmissoesPorCurso(cursoParaUsar).catch(()=>[]),
      UserService.getCursos().catch(()=>[]),
    ]);

    const alunos      = [...new Map(alunosDoCurso.map(a=>[a.id,a])).values()];
    const curso       = cursos.find(c=>c.id === cursoParaUsar);
    const cargaMax    = curso?.cargaHorariaMax || 200;
    const mediaHoras  = alunos.length ? Math.round(alunos.reduce((a,al)=>a+(al.horasAcumuladas||0),0)/alunos.length) : 0;
    
    return {
      totalAlunos: alunos.length, totalSubs: subsDoCurso.length,
      pendentes:   subsDoCurso.filter(s=>s.status==='PENDENTE').length,
      aprovadas:   subsDoCurso.filter(s=>s.status==='APROVADO').length,
      rejeitadas:  subsDoCurso.filter(s=>s.status==='REJEITADO').length,
      mediaHoras, cargaMax,
      ranking:     [...alunos].sort((a,b)=>(b.horasAcumuladas||0)-(a.horasAcumuladas||0)).slice(0,5),
      recentSubs:  [...subsDoCurso].sort((a,b)=>new Date(b.dataEnvio)-new Date(a.dataEnvio)).slice(0,5),
      progressData:[
        { label:'Pendentes',  value:subsDoCurso.filter(s=>s.status==='PENDENTE').length,  color:'#d97706' },
        { label:'Aprovadas',  value:subsDoCurso.filter(s=>s.status==='APROVADO').length,  color:'#12a150' },
        { label:'Rejeitadas', value:subsDoCurso.filter(s=>s.status==='REJEITADO').length, color:'#dc2626' },
      ],
    };
  },

  async getAlunoStats(alunoId, nomeAluno) {
    const [aluno, cursos] = await Promise.all([
      UserService.getAluno(alunoId).catch(()=>null),
      UserService.getCursos().catch(()=>[]),
    ]);
    if (!aluno) throw new Error('Aluno não encontrado.');

    // Descobre curso ativo do aluno (com cache de Storage)
    let nomeCurso = '—', cargaMax = 200, totalCursos = 0;
    const cursoAtivo = Storage.getAlunoCursoAtivo();

    // Conta quantos cursos o aluno pertence
    const cursosDoAluno = [];
    for (const c of cursos) {
      try {
        const al = await UserService.getAlunosByCurso(c.id);
        if (al.some(a => a.id === alunoId)) cursosDoAluno.push(c);
      } catch { /* ignora */ }
    }
    totalCursos = cursosDoAluno.length;

    // Usa curso ativo ou o primeiro encontrado
    const cursoRef = cursosDoAluno.find(c => c.id === cursoAtivo) || cursosDoAluno[0];
    if (cursoRef) { nomeCurso = cursoRef.nome; cargaMax = cursoRef.cargaHorariaMax || 200; }

    // [CORREÇÃO AQUI] Traz apenas as submissões deste curso, em vez de varrer o banco todo
    let subsDoAluno = [];
    if (cursoRef && cursoRef.id) {
       const allSubsDoCurso = await ActivityService.getSubmissoesPorCurso(cursoRef.id).catch(()=>[]);
       subsDoAluno = allSubsDoCurso.filter(s => s.nomeAluno === (nomeAluno || aluno.name));
    }

    const horasAprovadas  = subsDoAluno.filter(s=>s.status==='APROVADO').reduce((a,s)=>a+(s.horasAproveitadas||0),0);
    const horasPendentes  = subsDoAluno.filter(s=>s.status==='PENDENTE').reduce((a,s)=>a+(s.horasAproveitadas||0),0);

    return {
      nomeAluno: aluno.name, nomeCurso, cargaMax, totalCursos,
      horasAprovadas, horasPendentes,
      horasFaltantes: Math.max(0, cargaMax - horasAprovadas),
      pctConcluido:   Helpers.pct(horasAprovadas, cargaMax),
      totalSubs:      subsDoAluno.length,
      submissoes:     [...subsDoAluno].sort((a,b)=>new Date(b.dataEnvio)-new Date(a.dataEnvio)),
    };
  },

  _groupByMonth(subs, n) {
    const result=[], now=new Date();
    for(let i=n-1;i>=0;i--){
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      result.push({
        label: d.toLocaleDateString('pt-BR',{month:'short'}),
        value: subs.filter(s=>{ const sd=new Date(s.dataEnvio); return sd.getFullYear()===d.getFullYear()&&sd.getMonth()===d.getMonth(); }).length,
      });
    }
    return result;
  },
};
window.DashboardService = DashboardService;