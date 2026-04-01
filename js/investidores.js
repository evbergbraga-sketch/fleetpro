// investidores.js — Painel do investidor

const VALOR_MOTO     = 20000;
const RENDIMENTO_MES = 825;

// ══ PÁGINAS DO INVESTIDOR ══
// inv-dashboard, inv-veiculos, inv-rastreador
let _invPage = 'inv-dashboard';
let _invPagamentos = [];

function goInvPage(page){
  _invPage = page;
  document.querySelectorAll('.inv-nav-item').forEach(el=>{
    el.classList.toggle('active', el.dataset.page===page);
  });
  renderInvestidores();
}

// ══ RENDER PRINCIPAL ══
function renderInvestidores(){
  const el = document.getElementById('page-investidores');
  if(!el) return;
  const isAdmin = currentPerfil?.perfil === 'admin';
  const isInv   = currentPerfil?.perfil === 'investidor';

  // Determinar veículos
  let veiculosFinal;
  if(isAdmin){
    const sel = document.getElementById('inv-selector')?.value || '';
    veiculosFinal = sel ? allVeiculos.filter(v=>v.investidor_id===sel) : allVeiculos.filter(v=>v.tipo==='moto');
  } else {
    veiculosFinal = allVeiculos.filter(v=>v.investidor_id===currentUser?.id);
  }
  const ids = new Set(veiculosFinal.map(v=>v.id));
  const locsFinal  = allLocacoes.filter(l=>ids.has(l.veiculo_id));
  const totalVeic  = veiculosFinal.length;
  const qtdMotos   = veiculosFinal.filter(v=>v.tipo==='moto').length;
  const investimento = qtdMotos * VALOR_MOTO;
  const rendMensal   = qtdMotos * RENDIMENTO_MES;
  const rendAnual    = rendMensal * 12;
  const rentabilidade = investimento > 0 ? ((rendMensal/investimento)*100).toFixed(2) : '0.00';
  const ocupFinal    = totalVeic > 0 ? Math.round(veiculosFinal.filter(v=>v.status==='alugado').length/totalVeic*100) : 0;

  // Selector admin
  const selectorHtml = isAdmin ? `
    <div style="margin-bottom:20px;padding:14px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2);border-radius:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:13px;color:var(--purple);font-weight:600">👑 Visualizando carteira de:</span>
      <select id="inv-selector" onchange="renderInvestidores()" style="font-size:13px;background:var(--bg3);border:1px solid var(--border2);color:var(--text);padding:6px 10px;border-radius:8px">
        <option value="">— Toda a frota</option>
        ${allPerfis.filter(p=>p.perfil==='investidor').map(p=>`<option value="${p.id}">${p.nome}</option>`).join('')}
      </select>
    </div>` : '';

  // Menu lateral interno
  const navHtml = `
    <div style="display:flex;gap:8px;margin-bottom:24px;border-bottom:2px solid var(--border);padding-bottom:0">
      ${[
        {page:'inv-dashboard', icon:'📊', label:'Dashboard'},
        {page:'inv-veiculos',  icon:'🏍️', label:'Meus Veículos'},
        {page:'inv-rastreador',icon:'📍', label:'Rastreador'},
      ].map(m=>`
        <div class="inv-nav-item" data-page="${m.page}" onclick="goInvPage('${m.page}')"
          style="padding:10px 18px;cursor:pointer;font-size:13px;font-weight:600;border-bottom:2px solid transparent;margin-bottom:-2px;color:var(--muted);transition:all .2s;display:flex;align-items:center;gap:6px;${_invPage===m.page?'border-bottom-color:var(--accent);color:var(--accent)':''}">
          ${m.icon} ${m.label}
        </div>`).join('')}
    </div>`;

  if(_invPage === 'inv-dashboard'){
    el.innerHTML = selectorHtml + navHtml + _renderInvDashboard(veiculosFinal, locsFinal, qtdMotos, investimento, rendMensal, rendAnual, rentabilidade, ocupFinal, totalVeic);
    _carregarPagamentos(isAdmin ? (document.getElementById('inv-selector')?.value||'') : currentUser?.id);
  } else if(_invPage === 'inv-veiculos'){
    el.innerHTML = selectorHtml + navHtml + _renderInvVeiculos(veiculosFinal);
  } else if(_invPage === 'inv-rastreador'){
    el.innerHTML = selectorHtml + navHtml + _renderInvRastreador();
  }
}

// ══ DASHBOARD ══
function _renderInvDashboard(veiculosFinal, locsFinal, qtdMotos, investimento, rendMensal, rendAnual, rentabilidade, ocupFinal, totalVeic){
  return `
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
    <div class="stat-card" style="--accent-color:#7c3aed"><div class="stat-icon">💼</div><div class="stat-label">Capital investido</div><div class="stat-val" style="color:#7c3aed;font-size:22px">R$ ${investimento.toLocaleString('pt-BR')}</div><div class="stat-sub">${qtdMotos} moto${qtdMotos!==1?'s':''} × R$ ${VALOR_MOTO.toLocaleString('pt-BR')}</div></div>
    <div class="stat-card" style="--accent-color:#16a34a"><div class="stat-icon">💰</div><div class="stat-label">Rendimento mensal</div><div class="stat-val" style="color:#16a34a;font-size:22px">R$ ${rendMensal.toLocaleString('pt-BR')}</div><div class="stat-sub">${qtdMotos} moto${qtdMotos!==1?'s':''} × R$ ${RENDIMENTO_MES}/mês</div></div>
    <div class="stat-card" style="--accent-color:#2563EB"><div class="stat-icon">📅</div><div class="stat-label">Rendimento anual</div><div class="stat-val" style="color:#2563EB;font-size:22px">R$ ${rendAnual.toLocaleString('pt-BR')}</div><div class="stat-sub">R$ ${rendMensal.toLocaleString('pt-BR')}/mês × 12</div></div>
    <div class="stat-card" style="--accent-color:#0891b2"><div class="stat-icon">📈</div><div class="stat-label">Rentabilidade</div><div class="stat-val" style="color:#0891b2;font-size:22px">${rentabilidade}%</div><div class="stat-sub">ao mês sobre o capital</div></div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:20px">
    <div class="stat-card" style="--accent-color:#7c3aed"><div class="stat-icon">🏍️</div><div class="stat-label">Motos na carteira</div><div class="stat-val" style="color:#7c3aed">${qtdMotos}</div><div class="stat-sub">${veiculosFinal.filter(v=>v.tipo==='moto'&&v.status==='alugado').length} alugadas · ${veiculosFinal.filter(v=>v.tipo==='moto'&&v.status==='disponivel').length} disponíveis</div></div>
    <div class="stat-card" style="--accent-color:#2563EB"><div class="stat-icon">📊</div><div class="stat-label">Taxa de ocupação</div><div class="stat-val" style="color:#2563EB">${ocupFinal}%</div><div class="stat-sub">${veiculosFinal.filter(v=>v.status==='alugado').length} de ${totalVeic} veículos alugados</div></div>
  </div>

  <div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,rgba(37,99,235,.06),rgba(124,58,237,.06));border:1px solid rgba(37,99,235,.15)">
    <div class="card-header"><span class="card-title">📊 Projeção de rendimentos</span></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:4px">
      ${[1,3,6,12].map(m=>`<div style="text-align:center;padding:12px;background:rgba(255,255,255,0.6);border-radius:10px;border:1px solid rgba(37,99,235,.1)"><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">${m} ${m===1?'mês':'meses'}</div><div style="font-size:18px;font-weight:800;color:#2563EB;margin:6px 0">R$ ${(rendMensal*m).toLocaleString('pt-BR')}</div><div style="font-size:10px;color:var(--muted2)">${investimento>0?((rendMensal*m/investimento)*100).toFixed(1):0}% do capital</div></div>`).join('')}
    </div>
  </div>

  <div class="card" style="margin-bottom:20px">
    <div class="card-header">
      <span class="card-title">💳 Histórico de pagamentos</span>
      ${currentPerfil?.perfil==='admin'?`<button class="btn btn-primary" style="font-size:12px;padding:6px 14px" onclick="abrirModalPagamento()">+ Registrar pagamento</button>`:''}
    </div>
    <div id="inv-pagamentos-lista"><div style="text-align:center;padding:20px;color:var(--muted2);font-size:13px">⏳ Carregando...</div></div>
  </div>

  <div class="card">
    <div class="card-header"><span class="card-title">📋 Histórico de locações</span></div>
    <table><thead><tr><th>Veículo</th><th>Cliente</th><th>Período</th><th>Total</th><th>Status</th></tr></thead>
    <tbody>${locsFinal.length?locsFinal.map(l=>`<tr><td>${l.veiculos?.marca||''} ${l.veiculos?.modelo||''}<div style="font-size:11px;color:var(--muted)">${l.veiculos?.placa||''}</div></td><td>${l.clientes?.nome||'—'}</td><td style="font-size:12px">${fmtData(l.data_inicio)} a ${fmtData(l.data_fim)}</td><td style="color:var(--green);font-weight:600">R$ ${(l.total||0).toFixed(2)}</td><td>${l.status==='ativa'?'<span class="badge badge-green">Ativa</span>':l.status==='encerrada'?'<span class="badge badge-blue">Encerrada</span>':'<span class="badge badge-red">Cancelada</span>'}</td></tr>`).join(''):'<tr class="empty-row"><td colspan="5">Nenhuma locação</td></tr>'}</tbody></table>
  </div>`;
}

// ══ PAGAMENTOS ══
async function _carregarPagamentos(invId){
  if(!sb || !invId) {
    _renderPagamentosVazio();
    return;
  }
  const {data} = await sb.from('pagamentos_investidor')
    .select('*').eq('investidor_id', invId)
    .order('data_pagamento',{ascending:false}).limit(24);
  _invPagamentos = data||[];
  _renderPagamentosLista();
}

function _renderPagamentosVazio(){
  const el = document.getElementById('inv-pagamentos-lista');
  if(el) el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted2);font-size:13px">Nenhum pagamento registrado.</div>';
}

function _renderPagamentosLista(){
  const el = document.getElementById('inv-pagamentos-lista');
  if(!el) return;
  if(!_invPagamentos.length){ _renderPagamentosVazio(); return; }
  el.innerHTML = `<table><thead><tr><th>Referência</th><th>Data</th><th>Valor</th><th>Observação</th>${currentPerfil?.perfil==='admin'?'<th></th>':''}</tr></thead>
  <tbody>${_invPagamentos.map(p=>`<tr>
    <td style="font-weight:600">${p.referencia||'—'}</td>
    <td>${fmtData(p.data_pagamento)}</td>
    <td style="color:var(--green);font-weight:700">R$ ${(p.valor||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
    <td style="font-size:12px;color:var(--muted)">${p.observacao||'—'}</td>
    ${currentPerfil?.perfil==='admin'?`<td><button onclick="excluirPagamento('${p.id}')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:13px">🗑️</button></td>`:''}
  </tr>`).join('')}</tbody></table>`;
}

function abrirModalPagamento(){
  document.getElementById('m-pagamento-inv').classList.add('show');
}

async function salvarPagamento(){
  const invId = currentPerfil?.perfil==='admin'
    ? (document.getElementById('inv-selector')?.value||'')
    : currentUser?.id;
  if(!invId){ notify('Selecione o investidor','error'); return; }
  const valor = parseFloat((document.getElementById('pag-valor')?.value||'0').replace(',','.'));
  const data  = document.getElementById('pag-data')?.value;
  const ref   = document.getElementById('pag-ref')?.value||'';
  const obs   = document.getElementById('pag-obs')?.value||'';
  if(!valor||!data){ notify('Preencha valor e data','error'); return; }
  const {error} = await sb.from('pagamentos_investidor').insert({
    investidor_id:invId, valor, data_pagamento:data, referencia:ref, observacao:obs
  });
  if(error){ notify('Erro: '+error.message,'error'); return; }
  notify('Pagamento registrado!','success');
  closeModal('pagamento-inv');
  document.getElementById('pag-valor').value='';
  document.getElementById('pag-data').value='';
  document.getElementById('pag-ref').value='';
  document.getElementById('pag-obs').value='';
  _carregarPagamentos(invId);
}

async function excluirPagamento(id){
  if(!confirm('Excluir este pagamento?')) return;
  await sb.from('pagamentos_investidor').delete().eq('id',id);
  notify('Excluído!','success');
  const invId = document.getElementById('inv-selector')?.value||currentUser?.id;
  _carregarPagamentos(invId);
}

// ══ MEUS VEÍCULOS ══
function _renderInvVeiculos(veiculosFinal){
  return `
  <div class="card">
    <div class="card-header"><span class="card-title">🏍️ Meus veículos</span></div>
    <table><thead><tr><th>Veículo</th><th>Placa</th><th>Tipo</th><th>Status</th><th>Seguradora</th><th>Apólice</th></tr></thead>
    <tbody>${veiculosFinal.length ? veiculosFinal.map(v=>`
      <tr>
        <td><div style="font-weight:500">${v.marca} ${v.modelo}</div><div style="font-size:11px;color:var(--muted)">${v.ano||''} · ${v.cor||''}</div></td>
        <td>${v.placa}</td>
        <td>${v.tipo==='moto'?'🏍️ Moto':'🚗 Carro'}</td>
        <td>${statusBadge(v.status)}</td>
        <td style="font-size:13px">${v.seguradora||'<span style="color:var(--muted2)">—</span>'}</td>
        <td style="font-size:13px">${v.apolice||'<span style="color:var(--muted2)">—</span>'}</td>
      </tr>`).join('') : '<tr class="empty-row"><td colspan="6">Nenhum veículo</td></tr>'}
    </tbody></table>
  </div>`;
}

// ══ RASTREADOR ══
function _renderInvRastreador(){
  const link = currentPerfil?.link_rastreador || '';
  const isAdmin = currentPerfil?.perfil === 'admin';
  return `
  <div class="card" style="max-width:600px">
    <div class="card-header"><span class="card-title">📍 Rastreador</span></div>
    <div style="padding:20px">
      ${link ? `
        <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Acesse o sistema de rastreamento dos seus veículos:</p>
        <a href="${link}" target="_blank" rel="noopener" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
          📍 Abrir Rastreador <span style="font-size:11px;opacity:.8">↗</span>
        </a>
        <div style="margin-top:12px;font-size:11px;color:var(--muted2)">${link}</div>
      ` : `
        <div style="text-align:center;padding:30px;color:var(--muted2)">
          <div style="font-size:32px;margin-bottom:10px">📍</div>
          <div style="font-size:13px">Link do rastreador não configurado.</div>
          ${isAdmin ? `<button class="btn btn-ghost" style="margin-top:12px;font-size:12px" onclick="configurarRastreador()">⚙️ Configurar link</button>` : '<div style="font-size:12px;margin-top:8px">Entre em contato com o administrador.</div>'}
        </div>
      `}
    </div>
  </div>`;
}

async function configurarRastreador(){
  const link = prompt('Cole o link do sistema de rastreamento:', currentPerfil?.link_rastreador||'');
  if(link===null) return;
  const {error} = await sb.from('perfis').update({link_rastreador:link.trim()}).eq('id',currentUser.id);
  if(error){ notify('Erro: '+error.message,'error'); return; }
  currentPerfil.link_rastreador = link.trim();
  notify('Link salvo!','success');
  renderInvestidores();
}

function calcReceitaMes(){
  return allLocacoes.reduce((acc,l)=>{
    const dias = Math.min(30,Math.ceil((new Date(l.data_fim)-new Date(l.data_inicio))/86400000));
    return acc+(l.diaria||0)*dias;
  },0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function calcOcupacao(){
  if(!allVeiculos.length) return 0;
  return Math.round(allLocacoes.length/allVeiculos.length*100);
}
