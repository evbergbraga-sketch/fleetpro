// nav.js — Navegação, carregamento de dados e dashboard

// ══ NAVIGATION ══
const PAGE_CFG = {
  dashboard:   {title:'Dashboard',              action:'',                    modal:null,        roles:['admin','atendente','investidor']},
  carros:      {title:'Estoque — Carros',        action:'+ Cadastrar Carro',   modal:'veiculo',   roles:['admin','atendente']},
  motos:       {title:'Estoque — Motos',         action:'+ Cadastrar Moto',    modal:'veiculo',   roles:['admin','atendente']},
  historico:   {title:'Histórico & Manutenção',  action:'+ Manutenção',        modal:'manutencao',roles:['admin','atendente']},
  clientes:    {title:'Clientes',                action:'+ Novo cliente',      modal:'cliente',   roles:['admin','atendente']},
  reservas:    {title:'Reservas',                action:'+ Nova reserva',      modal:'reserva',   roles:['admin','atendente']},
  locacoes:    {title:'Locações em andamento',   action:'',                    modal:null,        roles:['admin','atendente']},
  contratos:   {title:'Contratos',               action:'',                    modal:null,        roles:['admin','atendente']},
  calendario:  {title:'Calendário',              action:'',                    modal:null,        roles:['admin','atendente']},
  chat:        {title:'Chat WhatsApp',           action:'',                    modal:null,        roles:['admin','atendente']},
  usuarios:    {title:'Usuários & Acessos',      action:'',                    modal:null,        roles:['admin']},
  investidores:{title:'Minha Carteira',          action:'',                    modal:null,        roles:['admin','investidor']},
  denied:      {title:'Acesso negado',           action:'',                    modal:null,        roles:['admin','atendente','investidor']},
};

function goPage(id, navEl){
  const cfg=PAGE_CFG[id];
  if(!cfg) return;
  if(!cfg.roles.includes(currentPerfil?.perfil)) id='denied';

  if(id !== 'investidores' && window._invLeave) window._invLeave();

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
  if(c.modal){
    if(id==='reservas'){
      btn.onclick = ()=>abrirModalReserva();
    } else {
      btn.onclick = ()=>openModal(c.modal, id==='motos'?'moto':id==='carros'?'carro':null);
    }
  }
  if(id==='contratos'){previewContrato();populateContratosSelects();}
  if(id==='calendario'){renderCal();}
  if(id==='chat'){
    renderChatContacts();
    if(typeof renderRespostasRapidas === "function") renderRespostasRapidas();
    if(activeChatId){
      const _cid = activeChatId;
      activeChatId = null;
      setTimeout(()=>abrirChat(_cid), 150);
    }
  }
  if(id==='usuarios'){renderUsuarios();}
  if(id==='investidores'){renderInvestidores();}
  if(id==='historico'){renderHistVeiculosList();}
  if(id==='carros'||id==='motos'){preencherSelectInvestidores();}
  if(id==='reservas'){renderReservas();}
  if(id==='locacoes'){renderLocacoes();}
}

// ══ DATA LOADING ══
async function carregarTudo(){
  await Promise.all([
    loadVeiculos(),
    loadClientes(),
    loadLocacoes(),
    loadManutencoes(),
    loadPerfis(),
    loadReservas(),
    loadLocacoesCompletas(),
  ]);
  expirarReservas();
  renderDashboard();
  const loading = document.getElementById('app-loading');
  if(loading) loading.style.display='none';
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
async function loadLocacoes(){const {data}=await sb.from('locacoes').select('*,veiculos(*),clientes(*)').eq('status','ativa').order('data_fim',{ascending:false});if(data) allLocacoes=data;}
async function loadManutencoes(){const {data}=await sb.from('manutencoes').select('*,veiculos(*)').order('created_at',{ascending:false});allManutencoes=data||[];}
async function loadPerfis(){const {data}=await sb.from('perfis').select('*').order('nome');allPerfis=data||[];}

function renderUsuarios(){
  const el = document.getElementById('usuarios-list');
  if(!el) return;
  const LABELS = {'admin':'👑 Admin','atendente':'🧑‍💼 Atendente','investidor':'📈 Investidor'};
  const CORES  = {'admin':'badge-red','atendente':'badge-blue','investidor':'badge-green'};
  if(!allPerfis.length){
    el.innerHTML='<div style="text-align:center;padding:40px;color:var(--muted2)">Nenhum usuário encontrado.</div>';
    return;
  }
  el.innerHTML = allPerfis.map(p=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;margin-bottom:8px;flex-wrap:wrap;gap:10px">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="avatar" style="width:38px;height:38px;font-size:13px;flex-shrink:0">${(p.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
        <div>
          <div style="font-weight:600;font-size:14px">${p.nome||'—'}</div>
          <div style="font-size:11px;color:var(--muted)">${p.empresa?p.empresa+' · ':''}${p.cnpj_cpf||p.telefone||''}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="badge ${CORES[p.perfil]||'badge-gray'}">${LABELS[p.perfil]||p.perfil}</span>
        <button class="btn btn-ghost" style="font-size:11px;padding:5px 12px" onclick="editarUsuario('${p.id}')">✏️ Editar</button>
      </div>
    </div>`).join('');
}

async function editarUsuario(id){
  const p = allPerfis.find(x=>x.id===id);
  if(!p) return;
  const isInv = p.perfil==='investidor';
  document.getElementById('eu-id').value        = id;
  document.getElementById('eu-nome').value      = p.nome||'';
  document.getElementById('eu-perfil').value    = p.perfil||'atendente';
  document.getElementById('eu-empresa').value   = p.empresa||'';
  document.getElementById('eu-razao').value     = p.razao_social||'';
  document.getElementById('eu-cnpj').value      = p.cnpj_cpf||'';
  document.getElementById('eu-resp').value      = p.responsavel||'';
  document.getElementById('eu-tel').value       = p.telefone||'';
  document.getElementById('eu-email-emp').value = p.email_empresa||'';
  const invEl = document.getElementById('eu-campos-inv');
  if(invEl) invEl.style.display = isInv ? '' : 'none';
  const errEl=document.getElementById('eu-err'); if(errEl) errEl.style.display='none';
  const okEl =document.getElementById('eu-ok');  if(okEl)  okEl.style.display='none';
  document.getElementById('m-editar-usuario').classList.add('show');
}

function _toggleEuInvestidor(){
  const p = document.getElementById('eu-perfil')?.value;
  const el = document.getElementById('eu-campos-inv');
  if(el) el.style.display = p==='investidor' ? '' : 'none';
}

async function salvarEdicaoUsuario(){
  const id   = document.getElementById('eu-id').value;
  const nome = document.getElementById('eu-nome').value.trim();
  const perfil = document.getElementById('eu-perfil').value;
  if(!nome){ notify('Nome obrigatório','error'); return; }
  const btn=document.getElementById('eu-btn-salvar');
  const errEl=document.getElementById('eu-err');
  const okEl =document.getElementById('eu-ok');
  if(errEl) errEl.style.display='none';
  if(okEl)  okEl.style.display='none';
  if(btn){ btn.disabled=true; btn.textContent='Salvando...'; }
  const obj = {
    nome, perfil,
    empresa:       document.getElementById('eu-empresa').value.trim()||null,
    razao_social:  document.getElementById('eu-razao').value.trim()||null,
    cnpj_cpf:      document.getElementById('eu-cnpj').value.trim()||null,
    responsavel:   document.getElementById('eu-resp').value.trim()||null,
    telefone:      document.getElementById('eu-tel').value.trim()||null,
    email_empresa: document.getElementById('eu-email-emp').value.trim()||null,
  };
  try{
    const {error} = await sb.from('perfis').update(obj).eq('id',id);
    if(error) throw error;
    notify('Usuário atualizado!','success');
    closeModal('editar-usuario');
    await loadPerfis();
    renderUsuarios();
  }catch(e){
    if(errEl){ errEl.textContent='Erro: '+e.message; errEl.style.display='block'; }
    notify('Erro: '+e.message,'error');
  }finally{
    if(btn){ btn.disabled=false; btn.textContent='✓ Salvar alterações'; }
  }
}

async function loadReservas(){
  const {data}=await sb.from('reservas')
    .select('*')
    .order('created_at',{ascending:false})
    .limit(100);
  allReservas=data||[];
}

// ══ DASHBOARD ══
function renderDashboard(){
  const isInv = currentPerfil?.perfil === 'investidor';
  const meusVeiculos = isInv
    ? allVeiculos.filter(v=>v.investidor_id===currentUser?.id)
    : allVeiculos;

  const carros = meusVeiculos.filter(v=>v.tipo==='carro');
  const motos  = meusVeiculos.filter(v=>v.tipo==='moto');

  document.getElementById('st-carros').textContent = carros.filter(v=>v.status==='disponivel').length;
  document.getElementById('st-carros-s').textContent = `de ${carros.length} total`;
  document.getElementById('st-motos').textContent = motos.filter(v=>v.status==='disponivel').length;
  document.getElementById('st-motos-s').textContent = `de ${motos.length} total`;
  document.getElementById('st-clientes').textContent = allClientes.length;

  const meusLocIds = new Set(meusVeiculos.map(v=>v.id));
  const meusLocs = isInv
    ? allLocacoes.filter(l=>meusLocIds.has(l.veiculo_id))
    : allLocacoes;

  document.getElementById('st-locacoes').textContent = meusLocs.filter(l=>l.status==='ativa'||!l.status).length;

  const atrasados = meusLocs.filter(l=>Math.ceil((new Date(l.data_fim)-new Date())/86400000) < 0);
  const alertVal  = document.getElementById('st-alert-val');
  const alertSub  = document.getElementById('st-alert-sub');
  const alertCard = document.getElementById('st-alert-card');
  if(alertVal){
    alertVal.textContent = atrasados.length;
    if(alertSub) alertSub.textContent = atrasados.length === 0 ? 'Tudo em dia ✓' : `veículo${atrasados.length>1?'s':''} com devolução atrasada`;
    if(alertCard){
      if(atrasados.length > 0){ alertCard.classList.add('stat-alert'); alertVal.style.color=''; }
      else { alertCard.classList.remove('stat-alert'); alertVal.style.color='#4ade80'; }
    }
  }

  const dl = document.getElementById('dash-loc');
  if(dl){
    dl.innerHTML = meusLocs.length ? meusLocs.slice(0,5).map(l=>{
      const diff = Math.ceil((new Date(l.data_fim)-new Date())/86400000);
      const b  = diff<0 ? 'badge-red' : diff===0 ? 'badge-yellow' : 'badge-green';
      const lb = diff<0 ? 'Atrasado'  : diff===0 ? 'Hoje'         : 'No prazo';
      return `<tr style="cursor:pointer" onclick="goPage('locacoes')" title="Ver locações">
        <td><div style="display:flex;align-items:center;gap:8px">
          <div class="vi ${l.veiculos?.tipo==='carro'?'vi-car':'vi-moto'}">${l.veiculos?.tipo==='carro'?'🚗':'🏍️'}</div>
          <div><div style="font-weight:500">${l.veiculos?.modelo||'—'}</div><div style="font-size:11px;color:var(--muted)">${l.veiculos?.placa||''}</div></div>
        </div></td>
        <td>${l.clientes?.nome||'—'}</td>
        <td>${fmtData(l.data_fim)}</td>
        <td><span class="badge ${b}">${lb}</span></td>
      </tr>`;
    }).join('') : '<tr class="empty-row"><td colspan="4">Nenhuma locação ativa</td></tr>';
  }

  const dr = document.getElementById('dash-reservas');
  if(dr){
    const reservasAtivas = allReservas.filter(r=>r.status==='ativa');
    dr.innerHTML = reservasAtivas.length ? reservasAtivas.slice(0,4).map(r=>{
      const cli  = allClientes.find(c=>c.id===r.cliente_id);
      const veic = allVeiculos.find(v=>v.id===r.veiculo_id);
      const diff = Math.ceil((new Date(r.data_inicio)-new Date())/86400000);
      const lblDiff = diff<=0 ? 'Hoje' : `em ${diff} dia${diff>1?'s':''}`;
      return `<tr style="cursor:pointer" onclick="goPage('reservas')" title="Ver reservas">
        <td><div style="display:flex;align-items:center;gap:8px">
          <div class="vi ${veic?.tipo==='carro'?'vi-car':'vi-moto'}">${veic?.tipo==='carro'?'🚗':'🏍️'}</div>
          <div><div style="font-weight:500">${veic?.marca||'—'} ${veic?.modelo||''}</div>
          <div style="font-size:11px;color:var(--muted)">${veic?.placa||''}</div></div>
        </div></td>
        <td>${cli?.nome||'—'}</td>
        <td>${fmtDt(r.data_inicio)}</td>
        <td><span class="badge badge-blue">${lblDiff}</span></td>
      </tr>`;
    }).join('') : '<tr class="empty-row"><td colspan="4">Nenhuma reserva ativa</td></tr>';
  }

  const dm = document.getElementById('dash-man');
  if(dm){
    const meusMantIds = new Set(meusVeiculos.map(v=>v.id));
    const mativas = (isInv
      ? allManutencoes.filter(m=>meusMantIds.has(m.veiculo_id))
      : allManutencoes).filter(m=>m.status!=='concluida');
    dm.innerHTML = mativas.length ? mativas.slice(0,5).map(m=>`
      <tr>
        <td><div style="font-weight:500">${m.veiculos?.modelo||'—'}</div><div style="font-size:11px;color:var(--muted)">${m.veiculos?.placa||''}</div></td>
        <td>${m.tipo}</td>
        <td><span class="badge ${m.status==='pendente'?'badge-yellow':'badge-blue'}">${m.status==='pendente'?'Pendente':'Em andamento'}</span></td>
      </tr>`).join('') : '<tr class="empty-row"><td colspan="3">Nenhuma</td></tr>';
  }

  _renderAgendaSemanal(meusLocs, allReservas, allManutencoes);
  _renderFrotaStatus(meusVeiculos, meusLocs);
  _renderAtividade(meusLocs, allManutencoes, allReservas);
}

// ── AGENDA SEMANAL COM PAINEL DE DETALHES ──
let _agendaDiaAtivo = null;
let _agendaLocsRef = [];
let _agendaResRef  = [];
let _agendaManRef  = [];

function _renderAgendaSemanal(locacoes, reservas, manutencoes){
  const grid  = document.getElementById('dash-agenda-grid');
  const label = document.getElementById('dash-semana-label');
  if(!grid) return;

  _agendaLocsRef = locacoes;
  _agendaResRef  = reservas;
  _agendaManRef  = manutencoes || [];

  const hoje = new Date();
  const diaSem = hoje.getDay();
  const diffSeg = diaSem === 0 ? -6 : 1 - diaSem;
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() + diffSeg);
  seg.setHours(0,0,0,0);

  const dias = [];
  for(let i=0; i<7; i++){
    const d = new Date(seg);
    d.setDate(seg.getDate() + i);
    dias.push(d);
  }

  if(label){
    const fmt = d => d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
    label.textContent = `${fmt(dias[0])} – ${fmt(dias[6])}`;
  }

  grid.innerHTML = dias.map((d,idx)=>{
    const isHoje = d.toDateString() === hoje.toDateString();

    const locsNoDia = locacoes.filter(l=>{
      const ini = new Date(l.data_inicio); ini.setHours(0,0,0,0);
      const fim = new Date(l.data_fim);    fim.setHours(23,59,59,999);
      return d >= ini && d <= fim;
    });
    const atrasosNoDia = locsNoDia.filter(l=>Math.ceil((new Date(l.data_fim)-new Date())/86400000) < 0);
    const resNoDia = reservas.filter(r=>{
      if(r.status !== 'ativa') return false;
      const ini = new Date(r.data_inicio); ini.setHours(0,0,0,0);
      const fim = new Date(r.data_fim);    fim.setHours(23,59,59,999);
      return d >= ini && d <= fim;
    });
    const manNoDia = (manutencoes||[]).filter(m=>{
      if(m.status==='concluida') return false;
      const ini = m.data_inicio ? new Date(m.data_inicio) : null;
      const fim = m.data_fim    ? new Date(m.data_fim)    : null;
      if(!ini) return false;
      ini.setHours(0,0,0,0);
      if(fim) fim.setHours(23,59,59,999);
      return fim ? (d >= ini && d <= fim) : d.toDateString() === ini.toDateString();
    });

    const total     = locsNoDia.length;
    const temAtraso = atrasosNoDia.length > 0;
    const temRes    = resNoDia.length > 0;
    const temMan    = manNoDia.length > 0;
    const temAlgo   = total > 0 || temRes || temMan;

    let bg = 'rgba(79,70,229,0.06)';
    let cor = 'var(--muted2)';
    let borderColor = 'transparent';

    if(temAtraso){
      bg = 'rgba(220,38,38,0.2)'; cor = '#F87171'; borderColor = 'rgba(220,38,38,0.3)';
    } else if(total > 0){
      const intensity = Math.min(0.15 + total * 0.12, 0.55);
      bg = `rgba(79,70,229,${intensity})`; cor = '#C7D2FE'; borderColor = 'rgba(79,70,229,0.3)';
    } else if(temRes){
      bg = 'rgba(217,119,6,0.18)'; cor = '#FCD34D'; borderColor = 'rgba(217,119,6,0.3)';
    } else if(temMan){
      bg = 'rgba(239,68,68,0.12)'; cor = '#F87171'; borderColor = 'rgba(239,68,68,0.2)';
    }

    const borda = isHoje ? '2px solid #4F46E5' : `1px solid ${borderColor}`;
    const peso  = isHoje ? '700' : '400';
    const dStr  = d.toISOString().slice(0,10);

    // Indicadores de ponto no fundo do dia
    const dots = [
      total > 0   ? `<div style="width:5px;height:5px;border-radius:50%;background:#818CF8"></div>` : '',
      temRes      ? `<div style="width:5px;height:5px;border-radius:50%;background:#FCD34D"></div>` : '',
      temMan      ? `<div style="width:5px;height:5px;border-radius:50%;background:#F87171"></div>` : '',
    ].filter(Boolean).join('');

    return `<div
      data-dia="${dStr}"
      onclick="_agendaAbrirDia('${dStr}', this)"
      style="height:50px;background:${bg};border-radius:8px;border:${borda};display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:${temAlgo||isHoje?'pointer':'default'};transition:all .15s;gap:2px;position:relative;"
      onmouseover="this.style.filter='brightness(1.2)'"
      onmouseout="this.style.filter=''">
      <div style="font-size:12px;color:${isHoje?'#818CF8':cor};font-weight:${peso}">${d.getDate()}</div>
      <div style="display:flex;gap:3px">${dots}</div>
    </div>`;
  }).join('');

  // Garante que o painel de detalhes existe logo após o grid
  let painel = document.getElementById('dash-agenda-painel');
  if(!painel){
    painel = document.createElement('div');
    painel.id = 'dash-agenda-painel';
    grid.parentElement.appendChild(painel);
  }
  painel.innerHTML = '';
  _agendaDiaAtivo = null;
}

function _agendaAbrirDia(dStr, el){
  const painel = document.getElementById('dash-agenda-painel');
  if(!painel) return;

  // Toggle — clicou no mesmo dia, fecha
  if(_agendaDiaAtivo === dStr){
    painel.innerHTML = '';
    _agendaDiaAtivo = null;
    document.querySelectorAll('[data-dia]').forEach(d=>d.style.outline='');
    return;
  }
  _agendaDiaAtivo = dStr;

  // Destaca o dia selecionado
  document.querySelectorAll('[data-dia]').forEach(d=>d.style.outline='');
  if(el) el.style.outline = '2px solid #4F46E5';

  const d = new Date(dStr+'T00:00:00');
  const dFim = new Date(dStr+'T23:59:59');

  const locsNoDia = _agendaLocsRef.filter(l=>{
    const ini = new Date(l.data_inicio); ini.setHours(0,0,0,0);
    const fim = new Date(l.data_fim);    fim.setHours(23,59,59,999);
    return d >= ini && dFim <= fim || (d >= ini && d <= fim);
  });

  const resNoDia = _agendaResRef.filter(r=>{
    if(r.status !== 'ativa') return false;
    const ini = new Date(r.data_inicio); ini.setHours(0,0,0,0);
    const fim = new Date(r.data_fim);    fim.setHours(23,59,59,999);
    return d >= ini && d <= fim;
  });

  const manNoDia = _agendaManRef.filter(m=>{
    if(m.status==='concluida') return false;
    const ini = m.data_inicio ? new Date(m.data_inicio) : null;
    const fim = m.data_fim    ? new Date(m.data_fim)    : null;
    if(!ini) return false;
    ini.setHours(0,0,0,0);
    if(fim) fim.setHours(23,59,59,999);
    return fim ? (d >= ini && d <= fim) : d.toDateString() === ini.toDateString();
  });

  const labelDia = d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});
  const temAlgo  = locsNoDia.length || resNoDia.length || manNoDia.length;

  let html = `<div style="margin-top:12px;background:rgba(79,70,229,0.06);border:1px solid rgba(79,70,229,0.15);border-radius:10px;padding:14px;animation:fadeIn .2s ease">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:#C7D2FE;text-transform:capitalize">${labelDia}</div>
      <button onclick="_agendaFecharPainel()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;line-height:1">✕</button>
    </div>`;

  if(!temAlgo){
    html += `<div style="font-size:12px;color:var(--muted2);text-align:center;padding:12px 0">Nenhum evento neste dia.</div>`;
  }

  // Locações
  if(locsNoDia.length){
    html += `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#818CF8;margin-bottom:6px">Locações (${locsNoDia.length})</div>`;
    locsNoDia.forEach(l=>{
      const diff = Math.ceil((new Date(l.data_fim)-new Date())/86400000);
      const isAtraso = diff < 0;
      const cor = isAtraso ? '#F87171' : '#4ade80';
      const status = isAtraso ? `${Math.abs(diff)}d atrasado` : diff === 0 ? 'Devolução hoje' : `Devolve em ${diff}d`;
      html += `<div onclick="goPage('locacoes')" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.12);border-radius:8px;margin-bottom:5px;cursor:pointer" onmouseover="this.style.background='rgba(79,70,229,0.15)'" onmouseout="this.style.background='rgba(79,70,229,0.08)'">
        <div style="font-size:16px">${l.veiculos?.tipo==='carro'?'🚗':'🏍️'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;color:var(--text)">${l.veiculos?.modelo||'—'} <span style="font-size:10px;color:var(--muted);font-weight:400">${l.veiculos?.placa||''}</span></div>
          <div style="font-size:11px;color:var(--muted)">${l.clientes?.nome||'—'}</div>
        </div>
        <div style="font-size:10px;font-weight:600;color:${cor};text-align:right;flex-shrink:0">${status}<br><span style="font-size:9px;color:var(--muted);font-weight:400">até ${fmtData(l.data_fim)}</span></div>
      </div>`;
    });
  }

  // Reservas
  if(resNoDia.length){
    html += `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#FCD34D;margin:10px 0 6px">Reservas (${resNoDia.length})</div>`;
    resNoDia.forEach(r=>{
      const cli  = allClientes.find(c=>c.id===r.cliente_id);
      const veic = allVeiculos.find(v=>v.id===r.veiculo_id);
      html += `<div onclick="goPage('reservas')" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(217,119,6,0.08);border:1px solid rgba(217,119,6,0.2);border-radius:8px;margin-bottom:5px;cursor:pointer" onmouseover="this.style.background='rgba(217,119,6,0.15)'" onmouseout="this.style.background='rgba(217,119,6,0.08)'">
        <div style="font-size:16px">${veic?.tipo==='carro'?'🚗':'🏍️'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;color:var(--text)">${veic?.modelo||'—'} <span style="font-size:10px;color:var(--muted);font-weight:400">${veic?.placa||''}</span></div>
          <div style="font-size:11px;color:var(--muted)">${cli?.nome||'—'}</div>
        </div>
        <div style="font-size:10px;font-weight:600;color:#FCD34D;text-align:right;flex-shrink:0">Reservado<br><span style="font-size:9px;color:var(--muted);font-weight:400">${fmtData(r.data_inicio?.slice(0,10)||'')} – ${fmtData(r.data_fim?.slice(0,10)||'')}</span></div>
      </div>`;
    });
  }

  // Manutenções
  if(manNoDia.length){
    html += `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#F87171;margin:10px 0 6px">Manutenções (${manNoDia.length})</div>`;
    manNoDia.forEach(m=>{
      html += `<div onclick="goPage('historico')" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.2);border-radius:8px;margin-bottom:5px;cursor:pointer" onmouseover="this.style.background='rgba(220,38,38,0.15)'" onmouseout="this.style.background='rgba(220,38,38,0.08)'">
        <div style="font-size:16px">🔧</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;color:var(--text)">${m.veiculos?.modelo||'—'} <span style="font-size:10px;color:var(--muted);font-weight:400">${m.veiculos?.placa||''}</span></div>
          <div style="font-size:11px;color:var(--muted)">${m.tipo||'—'}${m.oficina?' · '+m.oficina:''}</div>
        </div>
        <div style="font-size:10px;font-weight:600;color:#F87171;text-align:right;flex-shrink:0">${m.status==='pendente'?'Pendente':'Em andamento'}<br><span style="font-size:9px;color:var(--muted);font-weight:400">${fmtData(m.data_inicio||'')}${m.data_fim?' – '+fmtData(m.data_fim):''}</span></div>
      </div>`;
    });
  }

  html += '</div>';
  painel.innerHTML = html;
}

function _agendaFecharPainel(){
  const painel = document.getElementById('dash-agenda-painel');
  if(painel) painel.innerHTML = '';
  _agendaDiaAtivo = null;
  document.querySelectorAll('[data-dia]').forEach(d=>d.style.outline='');
}

function _renderFrotaStatus(veiculos, locacoes){
  const el = document.getElementById('dash-frota-list');
  if(!el) return;

  if(!veiculos.length){
    el.innerHTML = '<div style="color:var(--muted2);font-size:13px;text-align:center;padding:20px 0">Nenhum veículo cadastrado</div>';
    return;
  }

  const relevantes = veiculos
    .filter(v=>v.status !== 'disponivel' || locacoes.some(l=>l.veiculo_id===v.id))
    .slice(0, 5);

  const todos = relevantes.length ? relevantes : veiculos.slice(0, 5);

  const STATUS_CFG = {
    disponivel:  { label:'Disponível', bg:'rgba(22,163,74,0.10)',  border:'rgba(22,163,74,0.25)',  cor:'#4ade80' },
    alugado:     { label:'Locado',     bg:'rgba(79,70,229,0.12)',  border:'rgba(79,70,229,0.3)',   cor:'#818CF8' },
    reservado:   { label:'Reservado',  bg:'rgba(217,119,6,0.12)',  border:'rgba(217,119,6,0.25)',  cor:'#FCD34D' },
    manutencao:  { label:'Manutenção', bg:'rgba(220,38,38,0.10)',  border:'rgba(220,38,38,0.25)',  cor:'#F87171' },
    preparacao:  { label:'Preparação', bg:'rgba(107,114,128,0.10)',border:'rgba(107,114,128,0.2)', cor:'var(--muted)' },
  };

  el.innerHTML = todos.map(v=>{
    const cfg = STATUS_CFG[v.status] || STATUS_CFG.disponivel;
    const locAtiva = locacoes.find(l=>l.veiculo_id===v.id && (l.status==='ativa'||!l.status));
    const clienteNome = locAtiva?.clientes?.nome || '';
    const diff = locAtiva ? Math.ceil((new Date(locAtiva.data_fim)-new Date())/86400000) : null;
    const diffLabel = diff !== null ? (diff < 0 ? `${Math.abs(diff)}d atrasado` : diff === 0 ? 'Hoje' : `${diff}d restantes`) : '';
    const isAtrasado = diff !== null && diff < 0;

    return `<div onclick="goPage('${v.tipo==='carro'?'carros':'motos'}')" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:${cfg.bg};border:1px solid ${cfg.border};border-radius:8px;cursor:pointer;transition:all .15s;" onmouseover="this.style.filter='brightness(1.15)'" onmouseout="this.style.filter=''">
      <div style="font-size:16px">${v.tipo==='carro'?'🚗':'🏍️'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v.marca} ${v.modelo}</div>
        <div style="font-size:10px;color:var(--muted)">${v.placa}${clienteNome?' · '+clienteNome:''}</div>
      </div>
      <div style="flex-shrink:0;text-align:right">
        <div style="font-size:10px;font-weight:600;color:${isAtrasado?'#F87171':cfg.cor}">${cfg.label}</div>
        ${diffLabel ? `<div style="font-size:9px;color:${isAtrasado?'#F87171':'var(--muted)'}">${diffLabel}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function _renderAtividade(locacoes, manutencoes, reservas){
  const el = document.getElementById('dash-atividade');
  if(!el) return;

  const eventos = [];

  locacoes.slice(0,4).forEach(l=>{
    const diff = Math.ceil((new Date(l.data_fim)-new Date())/86400000);
    const atrasada = diff < 0;
    eventos.push({
      cor:   atrasada ? '#F87171' : '#818CF8',
      texto: atrasada
        ? `Devolução atrasada — ${l.veiculos?.modelo||'?'} / ${l.clientes?.nome||'?'}`
        : `Locação ativa — ${l.veiculos?.modelo||'?'} / ${l.clientes?.nome||'?'}`,
      tempo: l.created_at,
      page:  'locacoes',
    });
  });

  reservas.filter(r=>r.status==='ativa').slice(0,2).forEach(r=>{
    const cli  = allClientes.find(c=>c.id===r.cliente_id);
    const veic = allVeiculos.find(v=>v.id===r.veiculo_id);
    eventos.push({
      cor:   '#FCD34D',
      texto: `Reserva — ${veic?.modelo||'?'} / ${cli?.nome||'?'}`,
      tempo: r.created_at,
      page:  'reservas',
    });
  });

  manutencoes.filter(m=>m.status!=='concluida').slice(0,2).forEach(m=>{
    eventos.push({
      cor:   '#F87171',
      texto: `Manutenção — ${m.veiculos?.modelo||'?'} (${m.tipo})`,
      tempo: m.created_at,
      page:  'historico',
    });
  });

  eventos.sort((a,b)=>new Date(b.tempo||0)-new Date(a.tempo||0));

  if(!eventos.length){
    el.innerHTML = '<div style="color:var(--muted2);font-size:13px;text-align:center;padding:20px 0">Sem atividade recente</div>';
    return;
  }

  el.innerHTML = eventos.slice(0,6).map((ev,i,arr)=>`
    <div onclick="goPage('${ev.page}')" style="display:flex;gap:10px;padding:8px 0;border-bottom:${i < arr.length-1 ? '1px solid var(--border)' : 'none'};cursor:pointer;transition:background .1s;" onmouseover="this.style.background='rgba(79,70,229,0.05)'" onmouseout="this.style.background=''">
      <div style="width:7px;height:7px;border-radius:50%;background:${ev.cor};margin-top:4px;flex-shrink:0"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ev.texto}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:1px">${_tempoRelativo(ev.tempo)}</div>
      </div>
    </div>`).join('');
}

function _tempoRelativo(isoStr){
  if(!isoStr) return '—';
  const diff = Date.now() - new Date(isoStr).getTime();
  const min  = Math.floor(diff/60000);
  const h    = Math.floor(diff/3600000);
  const d    = Math.floor(diff/86400000);
  if(min < 1)  return 'agora';
  if(min < 60) return `há ${min}min`;
  if(h   < 24) return `há ${h}h`;
  if(d   < 7)  return `há ${d} dia${d>1?'s':''}`;
  return new Date(isoStr).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
}

// ══ VEÍCULOS (render chamado de veiculos.js) ══
