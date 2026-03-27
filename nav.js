// nav.js — Navegação, carregamento de dados e dashboard

// ══ NAVIGATION ══
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
  investidores:{title:'Métricas & Investidores', action:'',                    modal:null, roles:['admin','investidor']},
  denied:      {title:'Acesso negado',           action:'',                    modal:null, roles:['admin','atendente','investidor']},
};

function goPage(id, navEl){
  const cfg=PAGE_CFG[id];
  if(!cfg) return;
  // Check permission
  if(!cfg.roles.includes(currentPerfil?.perfil)){
    id='denied';
  }
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

  // Page-specific init
  if(id==='contratos'){previewContrato();populateContratosSelects();}
  if(id==='calendario'){renderCal();}
  if(id==='chat'){
    renderChatContacts();
    if(activeChatId){
      const area=document.getElementById('chat-msgs');
      if(area && area.innerHTML.includes('Carregando')) renderChatMsgs(activeChatId);
      else if(activeChatId) renderChatMsgs(activeChatId);
    }
  }
  if(id==='usuarios'){renderUsuarios();}
  if(id==='investidores'){renderInvestidores();}
  if(id==='historico'){renderHistVeiculosList();}
}

// ══ DATA LOADING ══
async function carregarTudo(){
  await Promise.all([loadVeiculos(),loadClientes(),loadLocacoes(),loadManutencoes()]);
  renderDashboard();
  // Carrega números desconhecidos do banco
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
async function loadLocacoes(){const {data}=await sb.from('locacoes').select('*,veiculos(*),clientes(*)').order('data_fim',{ascending:false});allLocacoes=data||[];}
async function loadManutencoes(){const {data}=await sb.from('manutencoes').select('*,veiculos(*)').order('created_at',{ascending:false});allManutencoes=data||[];}

// ══ DASHBOARD ══
function renderDashboard(){
  const carros=allVeiculos.filter(v=>v.tipo==='carro');
  const motos=allVeiculos.filter(v=>v.tipo==='moto');
  document.getElementById('st-carros').textContent=carros.filter(v=>v.status==='disponivel').length;
  document.getElementById('st-carros-s').textContent=`de ${carros.length} total`;
  document.getElementById('st-motos').textContent=motos.filter(v=>v.status==='disponivel').length;
  document.getElementById('st-motos-s').textContent=`de ${motos.length} total`;
  document.getElementById('st-clientes').textContent=allClientes.length;
  document.getElementById('st-locacoes').textContent=allLocacoes.length;

  const dl=document.getElementById('dash-loc');
  dl.innerHTML=allLocacoes.length?allLocacoes.map(l=>{
    const diff=Math.ceil((new Date(l.data_fim)-new Date())/86400000);
    const b=diff<0?'badge-red':diff===0?'badge-yellow':'badge-green';
    const lb=diff<0?'Atrasado':diff===0?'Hoje':'No prazo';
    return `<tr><td><div style="display:flex;align-items:center;gap:8px"><div class="vi ${l.veiculos?.tipo==='carro'?'vi-car':'vi-moto'}">${l.veiculos?.tipo==='carro'?'🚗':'🏍️'}</div><div><div style="font-weight:500">${l.veiculos?.modelo||'—'}</div><div style="font-size:11px;color:var(--muted)">${l.veiculos?.placa||''}</div></div></div></td><td>${l.clientes?.nome||'—'}</td><td>${fmtData(l.data_fim)}</td><td><span class="badge ${b}">${lb}</span></td></tr>`;
  }).join(''):'<tr class="empty-row"><td colspan="4">Nenhuma locação ativa</td></tr>';

  const dm=document.getElementById('dash-man');
  const mativas=allManutencoes.filter(m=>m.status!=='concluida');
  dm.innerHTML=mativas.length?mativas.map(m=>`<tr><td><div style="font-weight:500">${m.veiculos?.modelo||'—'}</div><div style="font-size:11px;color:var(--muted)">${m.veiculos?.placa||''}</div></td><td>${m.tipo}</td><td><span class="badge ${m.status==='pendente'?'badge-yellow':'badge-blue'}">${m.status==='pendente'?'Pendente':'Em andamento'}</span></td></tr>`).join(''):'<tr class="empty-row"><td colspan="3">Nenhuma</td></tr>';
}

// ══ VEÍCULOS ══
