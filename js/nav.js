// nav.js — Navegação, carregamento de dados e dashboard

const PAGE_CFG = {
  dashboard:   {title:'Dashboard',              action:'',                    modal:null, roles:['admin','atendente','investidor']},
  carros:      {title:'Estoque — Carros',        action:'+ Cadastrar Carro',   modal:'veiculo', roles:['admin','atendente']},
  motos:       {title:'Estoque — Motos',         action:'+ Cadastrar Moto',    modal:'veiculo', roles:['admin','atendente']},
  historico:   {title:'Histórico & Manutenção',  action:'+ Manutenção',        modal:'manutencao', roles:['admin','atendente']},
  clientes:    {title:'Clientes',                action:'+ Novo cliente',      modal:'cliente', roles:['admin','atendente']},
  contratos:   {title:'Contratos',               action:'',                    modal:null, roles:['admin','atendente']},
  calendario:  {title:'Calendário',              action:'',                    modal:null, roles:['admin','atendente']},
  chat:        {title:'Chat WhatsApp',           action:'',                    modal:null, roles:['admin','atendente']},
  usuarios:    {title:'Usuários & Acessos',      action:'',                    modal:null, roles:['admin']},
  investidores:{title:'Minha Carteira',          action:'',                    modal:null, roles:['admin','investidor']},
  denied:      {title:'Acesso negado',           action:'',                    modal:null, roles:['admin','atendente','investidor']},
};

function goPage(id, navEl){
  const cfg=PAGE_CFG[id];
  if(!cfg) return;
  if(!cfg.roles.includes(currentPerfil?.perfil)) id='denied';
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pageEl=document.getElementById('page-'+id);
  if(pageEl) pageEl.classList.add('active');
  if(navEl) navEl.classList.add('active');
  else { const ni=document.getElementById('nav-'+id); if(ni) ni.classList.add('active'); }
  const c=PAGE_CFG[id];
  document.getElementById('page-title').textContent=c.title;
  const btn=document.getElementById('primary-action');
  btn.style.display=c.action?'':'none';
  btn.textContent=c.action;
  if(c.modal) btn.onclick=()=>openModal(c.modal, id==='motos'?'moto':id==='carros'?'carro':null);
  // Recarrega dados ao trocar de aba
  if(id==='carros'||id==='motos'){
    loadVeiculos().then(()=>preencherSelectInvestidores());
  }
  if(id==='clientes'){
    loadClientes();
  }
  if(id==='contratos'){
    loadVeiculos();loadClientes();
    setTimeout(()=>{previewContrato();populateContratosSelects();},300);
  }
  if(id==='calendario'){
    loadLocacoes().then(()=>renderCal());
  }
  if(id==='chat'){
    renderChatContacts();
    if(activeChatId){
      // Força recarregar mensagens sempre que volta para o chat
      setTimeout(()=>renderChatMsgs(activeChatId), 100);
    }
  }
  if(id==='usuarios'){renderUsuarios();}
  if(id==='investidores'){
    Promise.all([loadVeiculos(),loadLocacoes(),loadManutencoes()]).then(()=>renderInvestidores());
  }
  if(id==='historico'){
    loadVeiculos().then(()=>renderHistVeiculosList());
  }
  if(id==='dashboard'){
    carregarTudo();
  }
}

// ══ DATA LOADING ══
async function carregarTudo(){
  // Limpa dados em memória para forçar reload do banco
  allVeiculos=[]; allClientes=[]; allLocacoes=[]; allManutencoes=[]; allPerfis=[];
  await Promise.all([loadVeiculos(),loadClientes(),loadLocacoes(),loadManutencoes(),loadPerfis()]);
  renderDashboard();
  renderVeiculos();
  renderClientes();
  if(sb){
    const {data} = await sb.from('wpp_mensagens')
      .select('numero').is('cliente_id',null)
      .order('created_at',{ascending:false}).limit(500);
    window._wppNumsDB = [...new Set((data||[]).map(m=>m.numero).filter(Boolean))];
    if(window._wppNumsDB.length > 0) renderChatContacts();
  }
}

async function loadVeiculos(){const {data}=await sb.from('veiculos').select('*').order('created_at',{ascending:false});allVeiculos=data||[];renderVeiculos();}
async function loadClientes(){const {data}=await sb.from('clientes').select('*').order('nome');allClientes=data||[];renderClientes();}
async function loadLocacoes(){const {data}=await sb.from('locacoes').select('*,veiculos(*),clientes(*)').eq('status','ativa').order('data_fim',{ascending:false});allLocacoes=data||[];}
async function loadManutencoes(){const {data}=await sb.from('manutencoes').select('*,veiculos(*)').order('created_at',{ascending:false});allManutencoes=data||[];}
async function loadPerfis(){const {data}=await sb.from('perfis').select('*').order('nome');allPerfis=data||[];}

// ══ BUSCA GLOBAL ══
function initBuscaGlobal(){
  const inp = document.getElementById('busca-global');
  const res = document.getElementById('busca-resultados');
  if(!inp||!res) return;
  inp.addEventListener('input', ()=>{
    const q = inp.value.trim().toLowerCase();
    if(q.length < 2){ res.style.display='none'; return; }
    const resultados = [];
    allClientes.forEach(c=>{
      if(c.nome.toLowerCase().includes(q)||c.telefone?.includes(q)||c.cpf?.includes(q))
        resultados.push({tipo:'Cliente', label:c.nome, sub:c.telefone||c.cpf, action:()=>{ goPage('clientes'); setTimeout(()=>{ document.getElementById('s-clientes').value=c.nome; renderClientes(); },300); }});
    });
    allVeiculos.forEach(v=>{
      if((v.marca+' '+v.modelo).toLowerCase().includes(q)||v.placa.toLowerCase().includes(q))
        resultados.push({tipo:'Veículo', label:v.marca+' '+v.modelo, sub:v.placa, action:()=>{ goPage(v.tipo==='carro'?'carros':'motos'); }});
    });
    if(resultados.length === 0){ res.style.display='none'; return; }
    res.innerHTML = resultados.slice(0,6).map((r,i)=>`
      <div class="search-item" onclick="document.getElementById('busca-resultados').style.display='none';document.getElementById('busca-global').value='';(window._searchActions||[])[${i}]&&window._searchActions[${i}]()">
        <div style="flex:1"><div style="font-size:13px;font-weight:500">${r.label}</div><div style="font-size:11px;color:var(--muted)">${r.sub||''}</div></div>
        <span class="search-tag">${r.tipo}</span>
      </div>`).join('');
    window._searchActions = resultados.slice(0,6).map(r=>r.action);
    res.style.display='block';
  });
  document.addEventListener('click', e=>{ if(!e.target.closest('#busca-wrapper')) res.style.display='none'; });
}

// ══ DASHBOARD ══
function renderDashboard(){
  const isInv = currentPerfil?.perfil === 'investidor';
  const meusVeiculos = isInv ? allVeiculos.filter(v=>v.investidor_id===currentUser?.id) : allVeiculos;
  const meusLocIds = new Set(meusVeiculos.map(v=>v.id));
  const meusLocs = isInv ? allLocacoes.filter(l=>meusLocIds.has(l.veiculo_id)) : allLocacoes;

  const carros=meusVeiculos.filter(v=>v.tipo==='carro');
  const motos=meusVeiculos.filter(v=>v.tipo==='moto');
  const atrasados = meusLocs.filter(l=>Math.ceil((new Date(l.data_fim)-new Date())/86400000) < 0);

  document.getElementById('st-carros').textContent=carros.filter(v=>v.status==='disponivel').length;
  document.getElementById('st-carros-s').textContent=`de ${carros.length} total`;
  document.getElementById('st-motos').textContent=motos.filter(v=>v.status==='disponivel').length;
  document.getElementById('st-motos-s').textContent=`de ${motos.length} total`;
  document.getElementById('st-clientes').textContent=allClientes.length;
  document.getElementById('st-locacoes').textContent=meusLocs.length;

  // Card de alerta
  const alertCard = document.getElementById('st-alert-card');
  const alertVal  = document.getElementById('st-alert-val');
  const alertSub  = document.getElementById('st-alert-sub');
  if(alertCard && alertVal && alertSub){
    alertVal.textContent = atrasados.length;
    alertSub.textContent = atrasados.length === 0 ? 'Tudo em dia ✓' : `veículo${atrasados.length>1?'s':''} com devolução atrasada`;
    alertCard.className = atrasados.length > 0 ? 'stat-card stat-alert' : 'stat-card';
    if(atrasados.length === 0){
      alertCard.style.setProperty('--accent-color','var(--green)');
      alertVal.style.color = 'var(--green)';
    } else {
      alertCard.style.removeProperty('--accent-color');
      alertVal.style.color = '';
    }
  }

  const dl=document.getElementById('dash-loc');
  dl.innerHTML=meusLocs.length?meusLocs.map(l=>{
    const diff=Math.ceil((new Date(l.data_fim)-new Date())/86400000);
    const b=diff<0?'badge-red':diff===0?'badge-yellow':'badge-green';
    const lb=diff<0?'Atrasado':diff===0?'Hoje':'No prazo';
    return `<tr><td><div style="display:flex;align-items:center;gap:8px"><div class="vi ${l.veiculos?.tipo==='carro'?'vi-car':'vi-moto'}">${l.veiculos?.tipo==='carro'?'🚗':'🏍️'}</div><div><div style="font-weight:500">${l.veiculos?.modelo||'—'}</div><div style="font-size:11px;color:var(--muted)">${l.veiculos?.placa||''}</div></div></div></td><td>${l.clientes?.nome||'—'}</td><td>${fmtData(l.data_fim)}</td><td><span class="badge ${b}">${lb}</span></td></tr>`;
  }).join(''):'<tr class="empty-row"><td colspan="4">Nenhuma locação ativa</td></tr>';

  const dm=document.getElementById('dash-man');
  const meusMantIds = new Set(meusVeiculos.map(v=>v.id));
  const mativas = (isInv ? allManutencoes.filter(m=>meusMantIds.has(m.veiculo_id)) : allManutencoes).filter(m=>m.status!=='concluida');
  dm.innerHTML=mativas.length?mativas.map(m=>`<tr><td><div style="font-weight:500">${m.veiculos?.modelo||'—'}</div><div style="font-size:11px;color:var(--muted)">${m.veiculos?.placa||''}</div></td><td>${m.tipo}</td><td><span class="badge ${m.status==='pendente'?'badge-yellow':'badge-blue'}">${m.status==='pendente'?'Pendente':'Em andamento'}</span></td></tr>`).join(''):'<tr class="empty-row"><td colspan="3">Nenhuma</td></tr>';

  // Inicia busca global após carregar dados
  initBuscaGlobal();
}
