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
    /* ── Cobre container pai quando investidor ativo ── */
    body.inv-active .content {
      background: ${INV_THEME.bg} !important;
      padding: 0 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch;
    }
    body.inv-active #page-investidores {
      display: block;
    }

    /* ── Mobile: esconde sidebar e topbar, expande main ── */
    @media (max-width: 768px) {
      body.inv-active .sidebar { display: none !important; }
      body.inv-active .main { margin-left: 0 !important; width: 100% !important; }
      body.inv-active .topbar { display: none !important; }
    }

    /* ── Área principal ── */
    #page-investidores {
      background: ${INV_THEME.bg};
      min-height: 100vh;
      padding: 20px 16px 80px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      color: ${INV_THEME.text};
      box-sizing: border-box;
    }
    @media (min-width: 769px) {
      #page-investidores { padding: 28px 32px 48px; }
    }

    /* ── Nav mobile (barra de abas embaixo na tela) ── */
    .inv-mobile-nav { display: none; }
    @media (max-width: 768px) {
      .inv-mobile-nav {
        display: flex;
        position: fixed;
        bottom: 0; left: 0; right: 0;
        background: #111;
        border-top: 1px solid ${INV_THEME.border2};
        z-index: 999;
      }
      .inv-mobile-nav-btn {
        flex: 1; padding: 10px 6px 14px;
        background: none; border: none;
        color: ${INV_THEME.gray};
        font-size: 10px; font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.5px;
        cursor: pointer; transition: all .2s; text-align: center;
        border-right: 1px solid ${INV_THEME.border};
      }
      .inv-mobile-nav-btn:last-child { border-right: none; }
      .inv-mobile-nav-btn.active { color: ${INV_THEME.green}; background: rgba(46,204,113,0.06); }
      .inv-mobile-nav-icon { font-size: 18px; display: block; margin-bottom: 3px; }
    }

    /* ── Hero ── */
    .inv-hero {
      background: linear-gradient(135deg, #0a1a0f 0%, #0d2b15 50%, #0a1a0f 100%);
      border: 1px solid ${INV_THEME.border2};
      border-radius: 14px;
      padding: 22px 18px;
      margin-bottom: 16px;
      position: relative;
      overflow: visible;
    }
    @media (min-width: 769px) {
      .inv-hero { padding: 32px 36px; margin-bottom: 24px; border-radius: 16px; }
    }
    .inv-hero-tag {
      font-size: 10px; color: ${INV_THEME.green};
      font-weight: 700; text-transform: uppercase;
      letter-spacing: 2px; margin-bottom: 6px;
    }
    .inv-hero-nome {
      font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 4px;
    }
    @media (min-width: 769px) {
      .inv-hero-nome { font-size: 30px; white-space: nowrap; }
    }
    .inv-hero-sub { font-size: 13px; color: #666; }
    .inv-hero-sub strong { color: ${INV_THEME.green}; }
    .inv-hero-brand { text-align: right; flex-shrink: 0; }
    .inv-hero-brand-name { font-size: 10px; color: #444; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
    .inv-hero-brand-copy { font-size: 10px; color: #2a2a2a; }

    /* ── Grids stats — 2 cols mobile, 4/3 desktop ── */
    .inv-stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px; margin-bottom: 12px;
    }
    .inv-stat-grid-3 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px; margin-bottom: 12px;
    }
    @media (min-width: 769px) {
      .inv-stat-grid   { grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
      .inv-stat-grid-3 { grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
    }
    /* Último card do grid-3 ocupa 2 colunas no mobile */
    @media (max-width: 768px) {
      .inv-stat-grid-3 .inv-stat:last-child { grid-column: span 2; }
    }

    /* ── Card stat ── */
    .inv-stat {
      background: ${INV_THEME.bgCard};
      border: 1px solid ${INV_THEME.border};
      border-radius: 12px;
      padding: 14px 13px 12px;
      position: relative; overflow: hidden;
      transition: border-color .2s, transform .2s;
      box-sizing: border-box;
    }
    @media (min-width: 769px) {
      .inv-stat { padding: 22px 20px 18px; }
    }
    .inv-stat:hover { border-color: ${INV_THEME.green}; transform: translateY(-2px); }
    .inv-stat::after {
      content: ''; position: absolute; top: 0; left: 0;
      width: 100%; height: 3px;
      background: linear-gradient(90deg, ${INV_THEME.green}, ${INV_THEME.greenD});
    }
    .inv-stat-icon { font-size: 16px; margin-bottom: 8px; opacity: .8; display: block; }
    @media (min-width: 769px) { .inv-stat-icon { font-size: 20px; margin-bottom: 10px; } }
    .inv-stat-label {
      font-size: 9px; text-transform: uppercase;
      letter-spacing: 1px; color: ${INV_THEME.gray};
      margin-bottom: 4px; font-weight: 600;
    }
    @media (min-width: 769px) { .inv-stat-label { font-size: 10px; letter-spacing: 1.5px; margin-bottom: 6px; } }
    .inv-stat-val { font-size: 17px; font-weight: 800; color: ${INV_THEME.green}; line-height: 1.1; }
    @media (min-width: 769px) { .inv-stat-val { font-size: 24px; } }
    .inv-stat-sub { font-size: 10px; color: ${INV_THEME.gray2}; margin-top: 4px; }

    /* ── Card genérico ── */
    .inv-card {
      background: ${INV_THEME.bgCard};
      border: 1px solid ${INV_THEME.border};
      border-radius: 12px; margin-bottom: 14px; overflow: hidden;
    }
    .inv-card-header {
      padding: 13px 16px;
      border-bottom: 1px solid ${INV_THEME.border};
      display: flex; align-items: center; justify-content: space-between;
    }
    @media (min-width: 769px) { .inv-card-header { padding: 16px 20px; } }
    .inv-card-title {
      font-size: 11px; font-weight: 700; color: ${INV_THEME.text};
      text-transform: uppercase; letter-spacing: 1px;
    }
    @media (min-width: 769px) { .inv-card-title { font-size: 13px; } }

    /* ── Tabelas com scroll horizontal no mobile ── */
    .inv-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .inv-card table { width: 100%; border-collapse: collapse; min-width: 440px; }
    .inv-card thead th {
      padding: 9px 14px; font-size: 10px; text-transform: uppercase;
      letter-spacing: 1px; color: ${INV_THEME.gray}; text-align: left;
      border-bottom: 1px solid ${INV_THEME.border};
      background: ${INV_THEME.bgCard2}; white-space: nowrap;
    }
    .inv-card tbody td {
      padding: 11px 14px; font-size: 13px;
      color: ${INV_THEME.text}; border-bottom: 1px solid ${INV_THEME.border};
    }
    .inv-card tbody tr:last-child td { border-bottom: none; }
    .inv-card tbody tr:hover td { background: ${INV_THEME.bgCard2}; }

    /* ── Badges ── */
    .inv-badge-green {
      background: rgba(46,204,113,.12); color: ${INV_THEME.green};
      border: 1px solid rgba(46,204,113,.25);
      padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; white-space: nowrap;
    }
    .inv-badge-gray {
      background: rgba(255,255,255,.06); color: ${INV_THEME.gray};
      border: 1px solid ${INV_THEME.border2};
      padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; white-space: nowrap;
    }

    /* ── Projeção 2x2 mobile, 4x1 desktop ── */
    .inv-proj-grid {
      display: grid; grid-template-columns: repeat(2, 1fr);
      gap: 10px; padding: 14px 16px;
    }
    @media (min-width: 769px) {
      .inv-proj-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px 20px; }
    }
    .inv-proj-item {
      text-align: center; padding: 14px 10px;
      background: #0d1f12; border: 1px solid ${INV_THEME.border2};
      border-radius: 10px; transition: border-color .2s;
    }
    .inv-proj-item:hover { border-color: ${INV_THEME.green}; }
    .inv-proj-mes { font-size: 10px; color: ${INV_THEME.gray}; text-transform: uppercase; letter-spacing: 1px; }
    .inv-proj-val { font-size: 16px; font-weight: 800; color: ${INV_THEME.green}; margin: 8px 0 4px; }
    @media (min-width: 769px) { .inv-proj-val { font-size: 22px; margin: 10px 0 4px; } }
    .inv-proj-pct { font-size: 10px; color: ${INV_THEME.gray2}; }

    /* ── Botão ── */
    .inv-btn-green {
      background: ${INV_THEME.green}; color: #000; border: none;
      padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;
      cursor: pointer; transition: background .2s; text-decoration: none;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .inv-btn-green:hover { background: ${INV_THEME.greenD}; }

    /* ── Selector admin ── */
    .inv-selector-bar {
      background: ${INV_THEME.bgCard}; border: 1px solid ${INV_THEME.border2};
      border-radius: 10px; padding: 12px 16px; margin-bottom: 14px;
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    .inv-selector-bar select {
      font-size: 13px; background: #1a1a1a; border: 1px solid #333;
      color: #f0f0f0; padding: 6px 12px; border-radius: 8px;
      outline: none; cursor: pointer; flex: 1; min-width: 160px;
    }

    /* ── Empty ── */
    .inv-empty { text-align: center; padding: 28px; color: ${INV_THEME.gray}; font-size: 13px; }

    /* ── Stat link ── */
    .inv-stat-link { cursor: pointer; }
    .inv-stat-link .inv-stat-val { font-size: 15px; color: #666; transition: color .2s; }
    @media (min-width: 769px) { .inv-stat-link .inv-stat-val { font-size: 17px; } }
    .inv-stat-link:hover .inv-stat-val { color: ${INV_THEME.green}; }
  `;
  document.head.appendChild(style);
}

// ══ Ativa / desativa classe Royal no body ══
function _setInvBodyClass(active){
  document.body.classList.toggle('inv-active', active);
}

// ══ RENDER PRINCIPAL ══
function renderInvestidores(){
  const el = document.getElementById('page-investidores');
  if(!el) return;
  _injectInvCss();
  _setInvBodyClass(true);

  const isAdmin = currentPerfil?.perfil === 'admin';

  let veiculosFinal;
  if(isAdmin){
    const sel = document.getElementById('inv-selector')?.value || '';
    veiculosFinal = sel ? allVeiculos.filter(v=>v.investidor_id===sel) : allVeiculos.filter(v=>v.tipo==='moto');
  } else {
    veiculosFinal = allVeiculos.filter(v=>v.investidor_id===currentUser?.id);
  }

  const ids           = new Set(veiculosFinal.map(v=>v.id));
  const locsFinal     = allLocacoes.filter(l=>ids.has(l.veiculo_id));
  const hoje          = new Date();
  const qtdMotos      = veiculosFinal.filter(v=>v.tipo==='moto').length;
  // Veículos "em preparação": ainda dentro do buffer de 30 dias
  const emPrepLista   = veiculosFinal.filter(v=>v.status==='preparacao'&&
    Math.ceil((hoje-new Date(v.data_entrada||v.created_at))/86400000)<30);
  // Rendimento fixo: TODAS as motos rendem R$ 825/mês
  // Única exceção: motos nos primeiros 30 dias de preparação
  const qtdEmPrepAtiva = emPrepLista.length;
  const qtdAtivos      = qtdMotos - qtdEmPrepAtiva;
  const investimento   = qtdMotos * VALOR_MOTO;
  window._invInvestimento = investimento;
  window._invEmPrep   = emPrepLista;
  const rendMensal    = qtdAtivos * RENDIMENTO_MES; // ex: 2 motos - 1 prep = 1 × 825 = 825 até liberar
  const rendAnual     = rendMensal * 12;
  const investimentoAtivo = qtdAtivos * VALOR_MOTO; // só motos que já rendem
  const rentabilidade = investimentoAtivo > 0 ? ((rendMensal/investimentoAtivo)*100).toFixed(2) : '0.00';
  const totalVeic     = veiculosFinal.length;
  const ocupFinal     = totalVeic > 0 ? Math.round(veiculosFinal.filter(v=>v.status==='alugado').length/totalVeic*100) : 0;
  const invSel        = isAdmin ? (document.getElementById('inv-selector')?.value || '') : '';

  const selectorHtml = isAdmin ? `
    <div class="inv-selector-bar">
      <span style="font-size:12px;color:${INV_THEME.green};font-weight:700;text-transform:uppercase;letter-spacing:1px">👑 Carteira de:</span>
      <select id="inv-selector" onchange="renderInvestidores()">
        <option value="">— Toda a frota</option>
        ${allPerfis.filter(p=>p.perfil==='investidor').map(p=>`<option value="${p.id}" ${p.id===invSel?'selected':''}>${p.nome}</option>`).join('')}
      </select>
    </div>` : '';

  // Nav mobile fixa na parte inferior (visível só em mobile via CSS)
  const mobileNav = `
    <div class="inv-mobile-nav">
      <button class="inv-mobile-nav-btn ${_invPage==='inv-dashboard'?'active':''}" onclick="goInvPage('inv-dashboard')">
        <span class="inv-mobile-nav-icon">📊</span>Dashboard
      </button>
      <button class="inv-mobile-nav-btn ${_invPage==='inv-veiculos'?'active':''}" onclick="goInvPage('inv-veiculos')">
        <span class="inv-mobile-nav-icon">🏍️</span>Veículos
      </button>
      <button class="inv-mobile-nav-btn ${_invPage==='inv-rastreador'?'active':''}" onclick="goInvPage('inv-rastreador')">
        <span class="inv-mobile-nav-icon">📍</span>Rastreador
      </button>
    </div>`;

  if(_invPage === 'inv-dashboard'){
    el.innerHTML = selectorHtml + mobileNav + _renderInvDashboard(veiculosFinal, locsFinal, qtdMotos, investimento, rendMensal, rendAnual, rentabilidade, ocupFinal, totalVeic, qtdEmPrepAtiva, qtdAtivos);
    _carregarPagamentos(isAdmin ? (document.getElementById('inv-selector')?.value||'') : currentUser?.id);
  } else if(_invPage === 'inv-veiculos'){
    el.innerHTML = selectorHtml + mobileNav + _renderInvVeiculos(veiculosFinal);
  } else if(_invPage === 'inv-rastreador'){
    el.innerHTML = selectorHtml + mobileNav + _renderInvRastreador();
  }
  _atualizarSidebarInv();
}

// ══ DASHBOARD ══
function _renderInvDashboard(veiculosFinal, locsFinal, qtdMotos, investimento, rendMensal, rendAnual, rentabilidade, ocupFinal, totalVeic, qtdEmPrepAtiva=0, qtdAtivos=qtdMotos){
  const nomeInv     = currentPerfil?.nome || 'Investidor';
  const alugadas    = veiculosFinal.filter(v=>v.status==='alugado').length;
  const disponiveis = veiculosFinal.filter(v=>v.status==='disponivel').length;
  const ocupColor   = ocupFinal>=70 ? INV_THEME.green : ocupFinal>=40 ? INV_THEME.gold : '#e74c3c';

  return `
  <!-- HERO -->
  <div class="inv-hero">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
      <div style="min-width:0">
        <div class="inv-hero-tag">Painel do Investidor</div>
        <div class="inv-hero-nome">Olá, ${nomeInv.split(' ')[0]}! 👋</div>
        <div class="inv-hero-sub">Carteira rendendo <strong>R$ ${rendMensal.toLocaleString('pt-BR')}/mês</strong></div>
      </div>
      <div class="inv-hero-brand">
        <div class="inv-hero-brand-name">Locadora Royal</div>
        <div class="inv-hero-brand-copy">© FleetPro</div>
      </div>
    </div>
  </div>

  <!-- STATS FINANCEIROS (2x2 mobile / 4x1 desktop) -->
  <div class="inv-stat-grid">
    <div class="inv-stat">
      <span class="inv-stat-icon">💼</span>
      <div class="inv-stat-label">Capital investido</div>
      <div class="inv-stat-val">R$ ${investimento.toLocaleString('pt-BR')}</div>
      <div class="inv-stat-sub">${qtdMotos} moto${qtdMotos!==1?'s':''} × R$ ${VALOR_MOTO.toLocaleString('pt-BR')}</div>
      ${qtdEmPrepAtiva>0?`<div style="font-size:9px;color:#f0c040;margin-top:4px">⚙️ ${qtdEmPrepAtiva} em preparação (30d)</div>`:''}
    </div>
    <div class="inv-stat">
      <span class="inv-stat-icon">💰</span>
      <div class="inv-stat-label">Rendimento mensal</div>
      <div class="inv-stat-val">R$ ${rendMensal.toLocaleString('pt-BR')}</div>
      <div class="inv-stat-sub">${qtdAtivos} moto${qtdAtivos!==1?'s':''} ativas × R$ ${RENDIMENTO_MES}/mês</div>
      ${qtdEmPrepAtiva>0?`<div style="font-size:9px;color:#f0c040;margin-top:4px">⏳ +R$ ${(qtdEmPrepAtiva*RENDIMENTO_MES).toLocaleString('pt-BR')}/mês após 30d</div>`:''}
    </div>
    <div class="inv-stat">
      <span class="inv-stat-icon">📅</span>
      <div class="inv-stat-label">Rendimento anual</div>
      <div class="inv-stat-val">R$ ${rendAnual.toLocaleString('pt-BR')}</div>
      <div class="inv-stat-sub">${qtdEmPrepAtiva>0?`R$ ${((qtdAtivos+qtdEmPrepAtiva)*RENDIMENTO_MES).toLocaleString('pt-BR')}/mês após 30d × 12`:`R$ ${rendMensal.toLocaleString('pt-BR')}/mês × 12`}</div>
    </div>
    <div class="inv-stat">
      <span class="inv-stat-icon">📈</span>
      <div class="inv-stat-label">Rentabilidade</div>
      <div class="inv-stat-val">${rentabilidade}%</div>
      <div class="inv-stat-sub">ao mês sobre motos ativas</div>
    </div>
  </div>

  <!-- STATS OPERACIONAIS (2x2 mobile / 3x1 desktop — último span 2 no mobile) -->
  <div class="inv-stat-grid-3">
    <div class="inv-stat">
      <span class="inv-stat-icon">🏍️</span>
      <div class="inv-stat-label">Motos na carteira</div>
      <div class="inv-stat-val">${qtdMotos}</div>
      <div class="inv-stat-sub">${alugadas} alug. · ${disponiveis} disp.</div>
    </div>
    <div class="inv-stat">
      <span class="inv-stat-icon">📊</span>
      <div class="inv-stat-label">Taxa de ocupação</div>
      <div class="inv-stat-val" style="color:${ocupColor}">${ocupFinal}%</div>
      <div class="inv-stat-sub">${alugadas} de ${totalVeic} alugados</div>
    </div>
    <div class="inv-stat inv-stat-link" onclick="goInvPage('inv-veiculos')">
      <span class="inv-stat-icon">🏍️</span>
      <div class="inv-stat-label">Meus veículos</div>
      <div class="inv-stat-val">Ver detalhes →</div>
      <div class="inv-stat-sub">toque para acessar</div>
    </div>
  </div>

  <!-- EM PREPARAÇÃO -->
  ${_renderEmPreparacao(veiculosFinal)}

  <!-- RENDIMENTO ACUMULADO -->
  <div class="inv-card" id="inv-card-acumulado">
    <div class="inv-card-header">
      <span class="inv-card-title">🏆 Rendimento acumulado</span>
      <span style="font-size:11px;color:${INV_THEME.gray}" id="inv-acumulado-periodo">carregando...</span>
    </div>
    <div id="inv-acumulado-body">
      <div class="inv-empty">⏳ Carregando pagamentos...</div>
    </div>
  </div>

  <!-- PROJEÇÃO (2x2 mobile / 4x1 desktop) -->
  <div class="inv-card">
    <div class="inv-card-header">
      <span class="inv-card-title">📊 Projeção de rendimentos</span>
      <span style="font-size:10px;color:${INV_THEME.gray}">inclui veículos em preparação após 30d</span>
    </div>
    <div class="inv-proj-grid">
      ${[1,3,6,12].map(m=>{
        // Regra: moto em prep leva 1 mês inteiro para ficar pronta
        // Só entra no rendimento a partir do 2º mês em diante
        let rendPrep = 0;
        let prepCount = 0;
        (window._invEmPrep||[]).forEach(v=>{
          // Meses que vai render = período total - 1 mês de preparação
          const mesesAtivos = Math.max(0, m - 1);
          if(mesesAtivos > 0){
            rendPrep += RENDIMENTO_MES * mesesAtivos;
            prepCount++;
          }
        });
        const rendProj = rendMensal*m + rendPrep;
        const extra = prepCount>0
          ? `<div style="font-size:9px;color:${INV_THEME.green};margin-top:2px">${m===1?'⏳ aguardando prep.':'+'+prepCount+' moto'+(prepCount!==1?'s':'')+' (+30d)'}</div>`
          : '';
        return `
        <div class="inv-proj-item">
          <div class="inv-proj-mes">${m} ${m===1?'mês':'meses'}</div>
          <div class="inv-proj-val">R$ ${rendProj.toLocaleString('pt-BR')}</div>
          <div class="inv-proj-pct">${investimento>0?((rendProj/investimento)*100).toFixed(1):0}% do capital</div>
          ${extra}
        </div>`;
      }).join('')}
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
    <div class="inv-table-wrap">
      <table>
        <thead>
          <tr><th>Veículo</th><th>Cliente</th><th>Período</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${locsFinal.length ? locsFinal.map(l=>`
          <tr>
            <td>
              <div style="font-weight:600;color:#fff">${l.veiculos?.marca||''} ${l.veiculos?.modelo||''}</div>
              <div style="font-size:11px;color:#555">${l.veiculos?.placa||''}</div>
            </td>
            <td style="color:#aaa">${l.clientes?.nome||'—'}</td>
            <td style="font-size:12px;color:#666;white-space:nowrap">${fmtData(l.data_inicio)} → ${fmtData(l.data_fim)}</td>
            <td style="color:${INV_THEME.green};font-weight:700;white-space:nowrap">R$ ${(l.total||0).toFixed(2)}</td>
            <td>${l.status==='ativa'?'<span class="inv-badge-green">Ativa</span>':'<span class="inv-badge-gray">Encerrada</span>'}</td>
          </tr>`).join('') : `<tr><td colspan="5" class="inv-empty">Nenhuma locação registrada.</td></tr>`}
        </tbody>
      </table>
    </div>
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
  _renderAcumulado(_invPagamentos);
}

// ══ EM PREPARAÇÃO ══
function _renderEmPreparacao(veiculosFinal){
  const hoje = new Date();
  const emPrep = veiculosFinal.filter(v=>v.status==='preparacao');
  if(!emPrep.length) return '';

  const rows = emPrep.map(v=>{
    const entrada   = new Date(v.data_entrada||v.created_at);
    const diasPassados = Math.ceil((hoje - entrada)/86400000);
    const diasRestantes = Math.max(0, 30 - diasPassados);
    const pct = Math.min(100, Math.round((diasPassados/30)*100));
    const pronto = diasRestantes === 0;
    const dataLiber = new Date(entrada.getTime() + 30*86400000);
    const dataLiberStr = dataLiber.toLocaleDateString('pt-BR');
    const barColor = pronto ? '#f0c040' : pct >= 70 ? INV_THEME.green : '#2980b9';

    return `
    <div style="background:${INV_THEME.bgCard2};border:1px solid ${INV_THEME.border2};border-radius:10px;padding:14px 16px;margin-bottom:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">🏍️</span>
          <div>
            <div style="font-weight:700;color:#fff;font-size:14px">${v.marca} ${v.modelo}</div>
            <div style="font-size:11px;color:#555;font-family:monospace">${v.placa}</div>
          </div>
        </div>
        <div style="text-align:right">
          ${pronto
            ? `<span style="background:rgba(240,192,64,.15);color:#f0c040;border:1px solid rgba(240,192,64,.3);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">✓ Pronto para locar</span>`
            : `<span style="background:rgba(41,128,185,.12);color:#2980b9;border:1px solid rgba(41,128,185,.25);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">⚙️ Em preparação</span>`
          }
        </div>
      </div>
      <!-- Barra de progresso -->
      <div style="background:#1a1a1a;border-radius:99px;height:8px;margin-bottom:8px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#1a5276,${barColor});border-radius:99px;transition:width .6s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#555">
        <span>Entrada: ${entrada.toLocaleDateString('pt-BR')}</span>
        ${pronto
          ? `<span style="color:#f0c040;font-weight:700">Disponível desde ${dataLiberStr}</span>`
          : `<span>${diasPassados}d de 30 · <span style="color:${INV_THEME.green}">libera em ${diasRestantes}d (${dataLiberStr})</span></span>`
        }
      </div>
      ${pronto ? `
      <div style="margin-top:10px;padding:8px 12px;background:rgba(240,192,64,.06);border:1px solid rgba(240,192,64,.15);border-radius:8px;font-size:11px;color:#f0c040">
        🎉 Período de preparação concluído! Este veículo já está incluído no rendimento mensal.
      </div>` : `
      <div style="margin-top:8px;font-size:11px;color:#444">
        📈 Rendimento a partir de ${dataLiberStr}: <strong style="color:${INV_THEME.green}">R$ ${RENDIMENTO_MES.toLocaleString('pt-BR')}/mês</strong>
      </div>`}
    </div>`;
  }).join('');

  return `
  <div class="inv-card" style="border-color:rgba(41,128,185,.3)">
    <div class="inv-card-header" style="border-bottom-color:rgba(41,128,185,.2)">
      <span class="inv-card-title">⚙️ Em preparação</span>
      <span style="font-size:11px;color:#2980b9;font-weight:600">${emPrep.length} veículo${emPrep.length!==1?'s':''}</span>
    </div>
    <div style="padding:14px 16px">${rows}</div>
  </div>`;
}

function _renderPagamentosVazio(){
  const el = document.getElementById('inv-pagamentos-lista');
  if(el) el.innerHTML = '<div class="inv-empty">Nenhum pagamento registrado.</div>';
  _renderAcumulado([]);
}

function _renderAcumulado(pagamentos){
  const body    = document.getElementById('inv-acumulado-body');
  const periodo = document.getElementById('inv-acumulado-periodo');
  if(!body) return;

  const total = pagamentos.reduce((acc,p)=>acc+(p.valor||0), 0);

  // Meses pagos (únicos por referência ou mês)
  const mesesPagos = new Set(pagamentos.map(p=>p.referencia||p.data_pagamento?.slice(0,7)||'')).size;

  // Percentual recuperado do investimento
  const investimento = window._invInvestimento||0;
  const pctRecuperado = investimento>0 ? ((total/investimento)*100).toFixed(1) : '0.0';

  // Diferença para recuperar 100% do capital
  const faltam = Math.max(0, (window._invInvestimento||0) - total);

  // Progresso da barra (cap em 100%)
  const pctBarra = Math.min(100, parseFloat(pctRecuperado));

  // Cor da barra
  const barColor = pctBarra >= 100 ? '#f0c040' : pctBarra >= 50 ? INV_THEME.green : INV_THEME.greenD;

  if(periodo) periodo.textContent = mesesPagos > 0 ? `${mesesPagos} pagamento${mesesPagos!==1?'s':''}` : 'Sem pagamentos';

  body.innerHTML = `
    <div style="padding:16px 20px 20px">
      <!-- Valor principal -->
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${INV_THEME.gray};margin-bottom:6px">Total recebido</div>
          <div style="font-size:32px;font-weight:900;color:${INV_THEME.green};line-height:1">
            R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}
          </div>
          <div style="font-size:12px;color:${INV_THEME.gray2};margin-top:4px">
            de R$ ${(investimento||0).toLocaleString('pt-BR')} investidos
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:28px;font-weight:900;color:${barColor}">${pctRecuperado}%</div>
          <div style="font-size:11px;color:${INV_THEME.gray2}">recuperado</div>
        </div>
      </div>

      <!-- Barra de progresso -->
      <div style="background:#1a1a1a;border-radius:99px;height:10px;margin-bottom:14px;overflow:hidden">
        <div style="height:100%;width:${pctBarra}%;background:linear-gradient(90deg,${INV_THEME.greenD},${barColor});border-radius:99px;transition:width .6s ease;position:relative">
          ${pctBarra>10?`<div style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:8px;font-weight:700;color:#000">${pctRecuperado}%</div>`:''}
        </div>
      </div>

      <!-- 3 cards abaixo -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        <div style="background:#0d1f12;border:1px solid ${INV_THEME.border2};border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:10px;color:${INV_THEME.gray};text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Rendimento<br>médio/mês</div>
          <div style="font-size:15px;font-weight:800;color:${INV_THEME.green}">
            R$ ${mesesPagos>0?(total/mesesPagos).toLocaleString('pt-BR',{minimumFractionDigits:2}):'0,00'}
          </div>
        </div>
        <div style="background:#0d1f12;border:1px solid ${INV_THEME.border2};border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:10px;color:${INV_THEME.gray};text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Pagamentos<br>realizados</div>
          <div style="font-size:15px;font-weight:800;color:${INV_THEME.green}">${pagamentos.length}</div>
        </div>
        <div style="background:${faltam>0?'#1a0d0d':'#0d1a0d'};border:1px solid ${faltam>0?'rgba(231,76,60,.2)':'rgba(46,204,113,.2)'};border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:10px;color:${INV_THEME.gray};text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${faltam>0?'Falta<br>recuperar':'Capital<br>recuperado'}</div>
          <div style="font-size:13px;font-weight:800;color:${faltam>0?'#e74c3c':INV_THEME.gold}">
            ${faltam>0?'R$ '+faltam.toLocaleString('pt-BR',{minimumFractionDigits:2}):'✓ 100%'}
          </div>
        </div>
      </div>
    </div>`;
}

function _renderPagamentosLista(){
  const el = document.getElementById('inv-pagamentos-lista');
  if(!el) return;
  if(!_invPagamentos.length){ _renderPagamentosVazio(); return; }
  const isAdmin = currentPerfil?.perfil==='admin';
  el.innerHTML = `
    <div class="inv-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Referência</th><th>Data</th><th>Valor</th><th>Observação</th>
            ${isAdmin?'<th></th>':''}
          </tr>
        </thead>
        <tbody>
          ${_invPagamentos.map(p=>`
          <tr>
            <td style="font-weight:600;color:#fff">${p.referencia||'—'}</td>
            <td style="color:#666;white-space:nowrap">${fmtData(p.data_pagamento)}</td>
            <td style="color:${INV_THEME.green};font-weight:700;white-space:nowrap">R$ ${(p.valor||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
            <td style="color:#555;font-size:12px">${p.observacao||'—'}</td>
            ${isAdmin?`<td><button onclick="excluirPagamento('${p.id}')" style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:14px">🗑️</button></td>`:''}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
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
  // Cache global para o modal acessar sem JSON inline
  window._invVCache = veiculosFinal;

  const rows = veiculosFinal.length
    ? veiculosFinal.map((v,i)=>`
          <tr style="cursor:pointer" onclick="_abrirModalVeiculoInv(${i})" title="Ver detalhes">
            <td>
              <div style="font-weight:600;color:#fff">${v.marca} ${v.modelo}</div>
              <div style="font-size:11px;color:#555">${v.ano||''} · ${v.cor||''}</div>
            </td>
            <td style="font-family:monospace;color:${INV_THEME.green};font-weight:600;white-space:nowrap">${v.placa}</td>
            <td>${
              v.status==='alugado' ? '<span class="inv-badge-green">Alugado</span>'
              : v.status==='preparacao' ? '<span style="background:rgba(41,128,185,.12);color:#2980b9;border:1px solid rgba(41,128,185,.25);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">⚙️ Em preparação</span>'
              : v.status==='reservado' ? '<span style="background:rgba(37,99,235,.12);color:#2563eb;border:1px solid rgba(37,99,235,.25);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">Reservado</span>'
              : v.status==='manutencao' ? '<span style="background:rgba(240,192,64,.12);color:#f0c040;border:1px solid rgba(240,192,64,.25);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">Manutenção</span>'
              : '<span class="inv-badge-gray">Disponível</span>'
            }</td>
            <td style="color:#aaa">${v.seguradora||'<span style="color:#333">—</span>'}</td>
            <td style="color:#aaa">${v.apolice||'<span style="color:#333">—</span>'}</td>
          </tr>`).join('')
    : `<tr><td colspan="5" class="inv-empty">Nenhum veículo na carteira.</td></tr>`;

  return `
  <div class="inv-card">
    <div class="inv-card-header">
      <span class="inv-card-title">🏍️ Meus veículos</span>
      <span style="font-size:12px;color:#555">${veiculosFinal.length} veículo${veiculosFinal.length!==1?'s':''}</span>
    </div>
    <div class="inv-table-wrap">
      <table>
        <thead>
          <tr><th>Veículo</th><th>Placa</th><th>Status</th><th>Seguradora</th><th>Apólice</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>

  <!-- MODAL VEÍCULO ROYAL -->
  <div id="inv-modal-veiculo" onclick="if(event.target===this)_fecharModalVeiculoInv()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);">
    <div id="inv-modal-veiculo-body" style="background:#111;border:1px solid #2a2a2a;border-radius:16px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch;"></div>
  </div>`;
}


// ══ RASTREADOR ══
function _renderInvRastreador(){
  const link    = currentPerfil?.link_rastreador || '';
  const isAdmin = currentPerfil?.perfil === 'admin';
  return `
  <div class="inv-card">
    <div class="inv-card-header">
      <span class="inv-card-title">📍 Rastreador</span>
    </div>
    <div style="padding:40px 20px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">📍</div>
      ${link ? `
        <p style="font-size:13px;color:#666;margin-bottom:20px">Acesse o rastreamento em tempo real dos seus veículos:</p>
        <a href="${link}" target="_blank" rel="noopener" class="inv-btn-green" style="font-size:14px;padding:12px 24px">
          📍 Abrir Rastreador ↗
        </a>
        <div style="margin-top:14px;font-size:11px;color:#333;word-break:break-all">${link}</div>
      ` : `
        <p style="font-size:13px;color:#555;margin-bottom:18px">Link do rastreador não configurado.</p>
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

// ══ HOOK: remove classe Royal ao sair do painel ══
window._invLeave = function(){ _setInvBodyClass(false); };

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

// ══ MODAL VEÍCULO ROYAL ══
window._abrirModalVeiculoInv = function(idx){
  const v = (window._invVCache||[])[idx];
  if(!v) return;

  const G = '#2ecc71';
  const statusBadge = v.status==='alugado'
    ? `<span style="background:rgba(46,204,113,.12);color:#2ecc71;border:1px solid rgba(46,204,113,.25);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">Alugado</span>`
    : v.status==='preparacao'
    ? `<span style="background:rgba(41,128,185,.12);color:#2980b9;border:1px solid rgba(41,128,185,.25);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">⚙️ Em preparação</span>`
    : v.status==='reservado'
    ? `<span style="background:rgba(37,99,235,.12);color:#2563eb;border:1px solid rgba(37,99,235,.25);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">Reservado</span>`
    : v.status==='manutencao'
    ? `<span style="background:rgba(240,192,64,.12);color:#f0c040;border:1px solid rgba(240,192,64,.25);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">Manutenção</span>`
    : `<span style="background:rgba(255,255,255,.06);color:#888;border:1px solid #2a2a2a;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">Disponível</span>`;

  const campos = [
    {l:'Tipo',       v: v.tipo==='moto'?'🏍️ Moto':'🚗 Carro'},
    {l:'Marca',      v: v.marca||'—'},
    {l:'Modelo',     v: v.modelo||'—'},
    {l:'Placa',      v: v.placa||'—', mono:true},
    {l:'Ano',        v: v.ano||'—'},
    {l:'Cor',        v: v.cor||'—'},
    {l:'Câmbio',     v: v.cambio||'—'},
    {l:'Km atual',   v: v.km_atual!=null ? Number(v.km_atual).toLocaleString('pt-BR')+' km' : '—'},
    {l:'Diária',     v: v.diaria!=null ? 'R$ '+Number(v.diaria).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '—'},
    {l:'Seguradora', v: v.seguradora||'—'},
    {l:'Apólice',    v: v.apolice||'—'},
    {l:'Observações',v: v.observacoes||'—'},
  ];

  // Cria o overlay se não existir
  let modal = document.getElementById('inv-modal-veiculo');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'inv-modal-veiculo';
    modal.onclick = e => { if(e.target===modal) window._fecharModalVeiculoInv(); };
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
    const body = document.createElement('div');
    body.id = 'inv-modal-veiculo-body';
    body.style.cssText = 'background:#111;border:1px solid #2a2a2a;border-radius:16px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch;';
    modal.appendChild(body);
    document.body.appendChild(modal);
  }

  document.getElementById('inv-modal-veiculo-body').innerHTML = `
    <div style="background:linear-gradient(135deg,#0a1a0f 0%,#0d2b15 100%);border-radius:16px 16px 0 0;padding:24px 24px 20px;position:relative">
      <button onclick="window._fecharModalVeiculoInv()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,.06);border:1px solid #333;color:#888;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;line-height:1">✕</button>
      <div style="font-size:11px;color:${G};font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">${v.tipo==='moto'?'🏍️':'🚗'} Ficha do veículo</div>
      <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:8px">${v.marca} ${v.modelo}</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="font-family:monospace;font-size:13px;font-weight:700;color:${G};background:rgba(46,204,113,.08);border:1px solid rgba(46,204,113,.2);padding:4px 12px;border-radius:8px">${v.placa}</span>
        ${statusBadge}
      </div>
    </div>
    <div style="padding:4px 24px 8px">
      ${campos.map(c=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #1a1a1a">
          <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#555;font-weight:600;flex-shrink:0">${c.l}</span>
          <span style="font-size:13px;color:${c.mono?G:'#ccc'};font-family:${c.mono?'monospace':'inherit'};font-weight:${c.mono?'700':'400'};text-align:right;max-width:65%;word-break:break-word">${c.v}</span>
        </div>`).join('')}
    </div>
    <div style="padding:16px 24px 24px">
      <button onclick="window._fecharModalVeiculoInv()" style="background:#2ecc71;color:#000;border:none;width:100%;padding:13px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">Fechar</button>
    </div>
  `;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window._fecharModalVeiculoInv = function(){
  const modal = document.getElementById('inv-modal-veiculo');
  if(modal) modal.style.display = 'none';
  document.body.style.overflow = '';
};
