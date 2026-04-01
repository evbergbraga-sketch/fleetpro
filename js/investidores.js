// investidores.js — Painel do investidor (Royal Theme)

const VALOR_MOTO     = 20000;
const RENDIMENTO_MES = 825;

// Paleta Royal
const INV_THEME = {
  bg:       '#0a0a0a',
  bgCard:   '#111111',
  bgCard2:  '#161616',
  border:   '#1e1e1e',
  border2:  '#2a2a2a',
  green:    '#2ecc71',
  greenD:   '#27ae60',
  greenL:   '#a8f0c6',
  greenGlow:'rgba(46,204,113,0.15)',
  gold:     '#f0c040',
  white:    '#ffffff',
  gray:     '#888888',
  gray2:    '#555555',
  text:     '#f0f0f0',
};

let _invPage = 'inv-dashboard';
let _invPagamentos = [];

function goInvPage(page){
  _invPage = page;
  document.querySelectorAll('.nav-item[data-inv-page]').forEach(el=>{
    el.classList.toggle('active', el.dataset.invPage===page);
  });
  renderInvestidores();
}

function _atualizarSidebarInv(){
  document.querySelectorAll('.nav-item[data-inv-page]').forEach(el=>{
    el.classList.toggle('active', el.dataset.invPage===_invPage);
  });
}

// ══ INJECT ROYAL CSS ══
function _injectInvCss(){
  if(document.getElementById('inv-royal-css')) return;
  const style = document.createElement('style');
  style.id = 'inv-royal-css';
  style.textContent = `
    #page-investidores {
      background: ${INV_THEME.bg};
      min-height: 100%;
      padding: 28px 32px;
      font-family: 'Segoe UI', sans-serif;
    }
    .inv-hero {
      background: linear-gradient(135deg, #0a1a0f 0%, #0d2b15 50%, #0a1a0f 100%);
      border: 1px solid ${INV_THEME.border2};
      border-radius: 16px;
      padding: 28px 32px;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
    }
    .inv-hero::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(46,204,113,0.12) 0%, transparent 70%);
      border-radius: 50%;
    }
    .inv-stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 20px;
    }
    .inv-stat {
      background: ${INV_THEME.bgCard};
      border: 1px solid ${INV_THEME.border};
      border-radius: 12px;
      padding: 20px;
      position: relative;
      overflow: hidden;
      transition: border-color .2s, transform .2s;
    }
    .inv-stat:hover {
      border-color: ${INV_THEME.green};
      transform: translateY(-2px);
    }
    .inv-stat::after {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 3px;
      background: linear-gradient(90deg, ${INV_THEME.green}, ${INV_THEME.greenD});
    }
    .inv-stat-icon {
      font-size: 20px;
      margin-bottom: 10px;
      opacity: .8;
    }
    .inv-stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${INV_THEME.gray};
      margin-bottom: 6px;
      font-weight: 600;
    }
    .inv-stat-val {
      font-size: 22px;
      font-weight: 800;
      color: ${INV_THEME.green};
      line-height: 1.1;
    }
    .inv-stat-sub {
      font-size: 11px;
      color: ${INV_THEME.gray2};
      margin-top: 4px;
    }
    .inv-card {
      background: ${INV_THEME.bgCard};
      border: 1px solid ${INV_THEME.border};
      border-radius: 12px;
      margin-bottom: 18px;
      overflow: hidden;
    }
    .inv-card-header {
      padding: 16px 20px;
      border-bottom: 1px solid ${INV_THEME.border};
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .inv-card-title {
      font-size: 13px;
      font-weight: 700;
      color: ${INV_THEME.text};
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .inv-card table {
      width: 100%;
      border-collapse: collapse;
    }
    .inv-card thead th {
      padding: 10px 20px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${INV_THEME.gray};
      text-align: left;
      border-bottom: 1px solid ${INV_THEME.border};
      background: ${INV_THEME.bgCard2};
    }
    .inv-card tbody td {
      padding: 13px 20px;
      font-size: 13px;
      color: ${INV_THEME.text};
      border-bottom: 1px solid ${INV_THEME.border};
    }
    .inv-card tbody tr:last-child td { border-bottom: none; }
    .inv-card tbody tr:hover td { background: ${INV_THEME.bgCard2}; }
    .inv-badge-green {
      background: rgba(46,204,113,.12);
      color: ${INV_THEME.green};
      border: 1px solid rgba(46,204,113,.25);
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 600;
    }
    .inv-badge-gray {
      background: rgba(255,255,255,.06);
      color: ${INV_THEME.gray};
      border: 1px solid ${INV_THEME.border2};
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 600;
    }
    .inv-proj-grid {
      display: grid;
      grid-template-columns: repeat(4,1fr);
      gap: 12px;
      padding: 16px 20px;
    }
    .inv-proj-item {
      text-align: center;
      padding: 16px 12px;
      background: #0d1f12;
      border: 1px solid ${INV_THEME.border2};
      border-radius: 10px;
      transition: border-color .2s;
    }
    .inv-proj-item:hover { border-color: ${INV_THEME.green}; }
    .inv-proj-mes { font-size: 10px; color: ${INV_THEME.gray}; text-transform: uppercase; letter-spacing: 1px; }
    .inv-proj-val { font-size: 20px; font-weight: 800; color: ${INV_THEME.green}; margin: 8px 0 4px; }
    .inv-proj-pct { font-size: 10px; color: ${INV_THEME.gray2}; }
    .inv-btn-green {
      background: ${INV_THEME.green};
      color: #000;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: background .2s;
    }
    .inv-btn-green:hover { background: ${INV_THEME.greenD}; }
    .inv-empty {
      text-align: center;
      padding: 30px;
      color: ${INV_THEME.gray};
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);
}

// ══ RENDER PRINCIPAL ══
function renderInvestidores(){
  const el = document.getElementById('page-investidores');
  if(!el) return;
  _injectInvCss();
  const isAdmin = currentPerfil?.perfil === 'admin';

  let veiculosFinal;
  if(isAdmin){
    const sel = document.getElementById('inv-selector')?.value || '';
    veiculosFinal = sel ? allVeiculos.filter(v=>v.investidor_id===sel) : allVeiculos.filter(v=>v.tipo==='moto');
  } else {
    veiculosFinal = allVeiculos.filter(v=>v.investidor_id===currentUser?.id);
  }
  const ids         = new Set(veiculosFinal.map(v=>v.id));
  const locsFinal   = allLocacoes.filter(l=>ids.has(l.veiculo_id));
  const qtdMotos    = veiculosFinal.filter(v=>v.tipo==='moto').length;
  const investimento = qtdMotos * VALOR_MOTO;
  const rendMensal  = qtdMotos * RENDIMENTO_MES;
  const rendAnual   = rendMensal * 12;
  const rentabilidade = investimento > 0 ? ((rendMensal/investimento)*100).toFixed(2) : '0.00';
  const totalVeic   = veiculosFinal.length;
  const ocupFinal   = totalVeic > 0 ? Math.round(veiculosFinal.filter(v=>v.status==='alugado').length/totalVeic*100) : 0;

  const selectorHtml = isAdmin ? `
    <div style="background:#111;border:1px solid #2a2a2a;border-radius:10px;padding:14px 20px;margin-bottom:20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:12px;color:#2ecc71;font-weight:700;text-transform:uppercase;letter-spacing:1px">👑 Carteira de:</span>
      <select id="inv-selector" onchange="renderInvestidores()" style="font-size:13px;background:#1a1a1a;border:1px solid #333;color:#f0f0f0;padding:6px 12px;border-radius:8px">
        <option value="">— Toda a frota</option>
        ${allPerfis.filter(p=>p.perfil==='investidor').map(p=>`<option value="${p.id}">${p.nome}</option>`).join('')}
      </select>
    </div>` : '';

  if(_invPage === 'inv-dashboard'){
    el.innerHTML = selectorHtml + _renderInvDashboard(veiculosFinal, locsFinal, qtdMotos, investimento, rendMensal, rendAnual, rentabilidade, ocupFinal, totalVeic);
    _carregarPagamentos(isAdmin ? (document.getElementById('inv-selector')?.value||'') : currentUser?.id);
  } else if(_invPage === 'inv-veiculos'){
    el.innerHTML = selectorHtml + _renderInvVeiculos(veiculosFinal);
  } else if(_invPage === 'inv-rastreador'){
    el.innerHTML = selectorHtml + _renderInvRastreador();
  }
  _atualizarSidebarInv();
}

// ══ DASHBOARD ══
function _renderInvDashboard(veiculosFinal, locsFinal, qtdMotos, investimento, rendMensal, rendAnual, rentabilidade, ocupFinal, totalVeic){
  const nomeInv = currentPerfil?.nome || 'Investidor';
  const alugadas = veiculosFinal.filter(v=>v.status==='alugado').length;
  const disponiveis = veiculosFinal.filter(v=>v.status==='disponivel').length;

  return `
  <!-- HERO -->
  <div class="inv-hero">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <div style="font-size:11px;color:#2ecc71;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px">Painel do Investidor</div>
        <div style="font-size:26px;font-weight:800;color:#fff;margin-bottom:4px">Olá, ${nomeInv.split(' ')[0]}! 👋</div>
        <div style="font-size:13px;color:#666">Sua carteira está rendendo <strong style="color:#2ecc71">R$ ${rendMensal.toLocaleString('pt-BR')}/mês</strong></div>
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Locadora Royal</div>
        <div style="font-size:11px;color:#333">© FleetPro Platform</div>
      </div>
    </div>
  </div>

  <!-- STATS FINANCEIROS -->
  <div class="inv-stat-grid">
    <div class="inv-stat">
      <div class="inv-stat-icon">💼</div>
      <div class="inv-stat-label">Capital investido</div>
      <div class="inv-stat-val">R$ ${investimento.toLocaleString('pt-BR')}</div>
      <div class="inv-stat-sub">${qtdMotos} moto${qtdMotos!==1?'s':''} × R$ ${VALOR_MOTO.toLocaleString('pt-BR')}</div>
    </div>
    <div class="inv-stat">
      <div class="inv-stat-icon">💰</div>
      <div class="inv-stat-label">Rendimento mensal</div>
      <div class="inv-stat-val">R$ ${rendMensal.toLocaleString('pt-BR')}</div>
      <div class="inv-stat-sub">${qtdMotos} × R$ ${RENDIMENTO_MES}/mês</div>
    </div>
    <div class="inv-stat">
      <div class="inv-stat-icon">📅</div>
      <div class="inv-stat-label">Rendimento anual</div>
      <div class="inv-stat-val">R$ ${rendAnual.toLocaleString('pt-BR')}</div>
      <div class="inv-stat-sub">R$ ${rendMensal.toLocaleString('pt-BR')}/mês × 12</div>
    </div>
    <div class="inv-stat">
      <div class="inv-stat-icon">📈</div>
      <div class="inv-stat-label">Rentabilidade</div>
      <div class="inv-stat-val">${rentabilidade}%</div>
      <div class="inv-stat-sub">ao mês sobre o capital</div>
    </div>
  </div>

  <!-- STATS OPERACIONAIS -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px">
    <div class="inv-stat">
      <div class="inv-stat-icon">🏍️</div>
      <div class="inv-stat-label">Motos na carteira</div>
      <div class="inv-stat-val">${qtdMotos}</div>
      <div class="inv-stat-sub">${alugadas} alugadas · ${disponiveis} disponíveis</div>
    </div>
    <div class="inv-stat">
      <div class="inv-stat-icon">📊</div>
      <div class="inv-stat-label">Taxa de ocupação</div>
      <div class="inv-stat-val" style="color:${ocupFinal>=70?'#2ecc71':ocupFinal>=40?'#f0c040':'#e74c3c'}">${ocupFinal}%</div>
      <div class="inv-stat-sub">${alugadas} de ${totalVeic} veículos alugados</div>
    </div>
    <div class="inv-stat" style="cursor:pointer" onclick="goInvPage('inv-veiculos')">
      <div class="inv-stat-icon">🏍️</div>
      <div class="inv-stat-label">Meus veículos</div>
      <div class="inv-stat-val" style="font-size:16px;color:#888">Ver detalhes →</div>
      <div class="inv-stat-sub">clique para acessar</div>
    </div>
  </div>

  <!-- PROJEÇÃO -->
  <div class="inv-card">
    <div class="inv-card-header">
      <span class="inv-card-title">📊 Projeção de rendimentos</span>
    </div>
    <div class="inv-proj-grid">
      ${[1,3,6,12].map(m=>`
        <div class="inv-proj-item">
          <div class="inv-proj-mes">${m} ${m===1?'mês':'meses'}</div>
          <div class="inv-proj-val">R$ ${(rendMensal*m).toLocaleString('pt-BR')}</div>
          <div class="inv-proj-pct">${investimento>0?((rendMensal*m/investimento)*100).toFixed(1):0}% do capital</div>
        </div>`).join('')}
    </div>
  </div>

  <!-- PAGAMENTOS -->
  <div class="inv-card">
    <div class="inv-card-header">
      <span class="inv-card-title">💳 Histórico de pagamentos</span>
      ${currentPerfil?.perfil==='admin'?`<button class="inv-btn-green" onclick="abrirModalPagamento()">+ Registrar</button>`:''}
    </div>
    <div id="inv-pagamentos-lista">
      <div class="inv-empty">⏳ Carregando...</div>
    </div>
  </div>

  <!-- LOCAÇÕES -->
  <div class="inv-card">
    <div class="inv-card-header">
      <span class="inv-card-title">📋 Histórico de locações</span>
    </div>
    <table>
      <thead><tr><th>Veículo</th><th>Cliente</th><th>Período</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${locsFinal.length ? locsFinal.map(l=>`
        <tr>
          <td><div style="font-weight:600;color:#fff">${l.veiculos?.marca||''} ${l.veiculos?.modelo||''}</div><div style="font-size:11px;color:#555">${l.veiculos?.placa||''}</div></td>
          <td style="color:#aaa">${l.clientes?.nome||'—'}</td>
          <td style="font-size:12px;color:#666">${fmtData(l.data_inicio)} → ${fmtData(l.data_fim)}</td>
          <td style="color:#2ecc71;font-weight:700">R$ ${(l.total||0).toFixed(2)}</td>
          <td>${l.status==='ativa'?'<span class="inv-badge-green">Ativa</span>':'<span class="inv-badge-gray">Encerrada</span>'}</td>
        </tr>`).join('') : `<tr><td colspan="5" class="inv-empty">Nenhuma locação registrada.</td></tr>`}
      </tbody>
    </table>
  </div>`;
}

// ══ PAGAMENTOS ══
async function _carregarPagamentos(invId){
  if(!sb||!invId){ _renderPagamentosVazio(); return; }
  const {data} = await sb.from('pagamentos_investidor')
    .select('*').eq('investidor_id',invId)
    .order('data_pagamento',{ascending:false}).limit(24);
  _invPagamentos = data||[];
  _renderPagamentosLista();
}

function _renderPagamentosVazio(){
  const el = document.getElementById('inv-pagamentos-lista');
  if(el) el.innerHTML = '<div class="inv-empty">Nenhum pagamento registrado.</div>';
}

function _renderPagamentosLista(){
  const el = document.getElementById('inv-pagamentos-lista');
  if(!el) return;
  if(!_invPagamentos.length){ _renderPagamentosVazio(); return; }
  el.innerHTML = `<table>
    <thead><tr><th>Referência</th><th>Data</th><th>Valor</th><th>Observação</th>${currentPerfil?.perfil==='admin'?'<th></th>':''}</tr></thead>
    <tbody>${_invPagamentos.map(p=>`<tr>
      <td style="font-weight:600;color:#fff">${p.referencia||'—'}</td>
      <td style="color:#666">${fmtData(p.data_pagamento)}</td>
      <td style="color:#2ecc71;font-weight:700">R$ ${(p.valor||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
      <td style="color:#555;font-size:12px">${p.observacao||'—'}</td>
      ${currentPerfil?.perfil==='admin'?`<td><button onclick="excluirPagamento('${p.id}')" style="background:none;border:none;color:#e74c3c;cursor:pointer">🗑️</button></td>`:''}
    </tr>`).join('')}</tbody>
  </table>`;
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
  const {error} = await sb.from('pagamentos_investidor').insert({investidor_id:invId,valor,data_pagamento:data,referencia:ref,observacao:obs});
  if(error){ notify('Erro: '+error.message,'error'); return; }
  notify('Pagamento registrado!','success');
  closeModal('pagamento-inv');
  ['pag-valor','pag-data','pag-ref','pag-obs'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
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
  <div class="inv-card">
    <div class="inv-card-header">
      <span class="inv-card-title">🏍️ Meus veículos</span>
      <span style="font-size:12px;color:#555">${veiculosFinal.length} veículo${veiculosFinal.length!==1?'s':''}</span>
    </div>
    <table>
      <thead><tr><th>Veículo</th><th>Placa</th><th>Tipo</th><th>Status</th><th>Seguradora</th><th>Apólice</th></tr></thead>
      <tbody>${veiculosFinal.length ? veiculosFinal.map(v=>`
        <tr>
          <td><div style="font-weight:600;color:#fff">${v.marca} ${v.modelo}</div><div style="font-size:11px;color:#555">${v.ano||''} · ${v.cor||''}</div></td>
          <td style="font-family:monospace;color:#2ecc71;font-weight:600">${v.placa}</td>
          <td style="color:#888">${v.tipo==='moto'?'🏍️ Moto':'🚗 Carro'}</td>
          <td>${v.status==='alugado'?'<span class="inv-badge-green">Alugado</span>':'<span class="inv-badge-gray">Disponível</span>'}</td>
          <td style="color:#aaa">${v.seguradora||'<span style="color:#333">—</span>'}</td>
          <td style="color:#aaa">${v.apolice||'<span style="color:#333">—</span>'}</td>
        </tr>`).join('') : `<tr><td colspan="6" class="inv-empty">Nenhum veículo na carteira.</td></tr>`}
      </tbody>
    </table>
  </div>`;
}

// ══ RASTREADOR ══
function _renderInvRastreador(){
  const link = currentPerfil?.link_rastreador || '';
  const isAdmin = currentPerfil?.perfil === 'admin';
  return `
  <div class="inv-card" style="max-width:560px">
    <div class="inv-card-header">
      <span class="inv-card-title">📍 Rastreador</span>
    </div>
    <div style="padding:32px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">📍</div>
      ${link ? `
        <p style="font-size:13px;color:#666;margin-bottom:20px">Acesse o sistema de rastreamento em tempo real dos seus veículos:</p>
        <a href="${link}" target="_blank" rel="noopener" class="inv-btn-green" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-size:14px;padding:12px 24px">
          📍 Abrir Rastreador ↗
        </a>
        <div style="margin-top:12px;font-size:11px;color:#333">${link}</div>
      ` : `
        <p style="font-size:13px;color:#555;margin-bottom:16px">Link do rastreador não configurado.</p>
        ${isAdmin
          ? `<button class="inv-btn-green" onclick="configurarRastreador()">⚙️ Configurar link</button>`
          : `<span style="font-size:12px;color:#444">Entre em contato com o administrador.</span>`}
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
    const dias=Math.min(30,Math.ceil((new Date(l.data_fim)-new Date(l.data_inicio))/86400000));
    return acc+(l.diaria||0)*dias;
  },0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function calcOcupacao(){
  if(!allVeiculos.length) return 0;
  return Math.round(allLocacoes.length/allVeiculos.length*100);
}
