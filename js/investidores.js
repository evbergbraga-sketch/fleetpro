// investidores.js — Painel do investidor

// ══ INVESTIDORES ══
const VALOR_MOTO     = 20000;
const RENDIMENTO_MES = 825;

function renderInvestidores(){
  const el = document.getElementById('page-investidores');
  if(!el) return;
  const isAdmin = currentPerfil?.perfil === 'admin';
  const isInv   = currentPerfil?.perfil === 'investidor';

  const selectorHtml = isAdmin ? `
    <div style="margin-bottom:20px;padding:14px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2);border-radius:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:13px;color:var(--purple);font-weight:600">👑 Visualizando carteira de:</span>
      <select id="inv-selector" onchange="renderInvestidores()" style="font-size:13px;background:var(--bg3);border:1px solid var(--border2);color:var(--text);padding:6px 10px;border-radius:8px">
        <option value="">— Toda a frota</option>
        ${allPerfis.filter(p=>p.perfil==='investidor').map(p=>`<option value="${p.id}">${p.nome}</option>`).join('')}
      </select>
    </div>` : '';

  let veiculosFinal;
  if(isAdmin){
    const sel = document.getElementById('inv-selector')?.value || '';
    veiculosFinal = sel ? allVeiculos.filter(v=>v.investidor_id===sel) : allVeiculos;
  } else {
    veiculosFinal = allVeiculos.filter(v=>v.investidor_id===currentUser?.id);
  }
  const ids = new Set(veiculosFinal.map(v=>v.id));
  const locsFinal  = allLocacoes.filter(l=>ids.has(l.veiculo_id));
  const manutFinal = allManutencoes.filter(m=>ids.has(m.veiculo_id));

  const qtdMotos    = veiculosFinal.filter(v=>v.tipo==='moto').length;
  const investimento = qtdMotos * VALOR_MOTO;
  const rendMensal  = qtdMotos * RENDIMENTO_MES;
  const rendAnual   = rendMensal * 12;
  const rentabilidade = investimento > 0 ? ((rendMensal/investimento)*100).toFixed(2) : '0.00';
  const custoManut  = manutFinal.reduce((acc,m)=>acc+(m.custo||0),0);
  const totalVeic   = veiculosFinal.length;
  const ocupFinal   = totalVeic > 0 ? Math.round(veiculosFinal.filter(v=>v.status==='alugado').length/totalVeic*100) : 0;

  el.innerHTML = selectorHtml + `
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
    <div class="stat-card" style="--accent-color:#7c3aed"><div class="stat-icon">💼</div><div class="stat-label">Capital investido</div><div class="stat-val" style="color:#7c3aed;font-size:22px">R$ ${investimento.toLocaleString('pt-BR')}</div><div class="stat-sub">${qtdMotos} moto${qtdMotos!==1?'s':''} × R$ ${VALOR_MOTO.toLocaleString('pt-BR')}</div></div>
    <div class="stat-card" style="--accent-color:#16a34a"><div class="stat-icon">💰</div><div class="stat-label">Rendimento mensal</div><div class="stat-val" style="color:#16a34a;font-size:22px">R$ ${rendMensal.toLocaleString('pt-BR')}</div><div class="stat-sub">${qtdMotos} moto${qtdMotos!==1?'s':''} × R$ ${RENDIMENTO_MES}/mês</div></div>
    <div class="stat-card" style="--accent-color:#2563EB"><div class="stat-icon">📅</div><div class="stat-label">Rendimento anual</div><div class="stat-val" style="color:#2563EB;font-size:22px">R$ ${rendAnual.toLocaleString('pt-BR')}</div><div class="stat-sub">R$ ${rendMensal.toLocaleString('pt-BR')}/mês × 12</div></div>
    <div class="stat-card" style="--accent-color:#0891b2"><div class="stat-icon">📈</div><div class="stat-label">Rentabilidade</div><div class="stat-val" style="color:#0891b2;font-size:22px">${rentabilidade}%</div><div class="stat-sub">ao mês sobre o capital</div></div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px">
    <div class="stat-card" style="--accent-color:#7c3aed"><div class="stat-icon">🏍️</div><div class="stat-label">Motos na carteira</div><div class="stat-val" style="color:#7c3aed">${qtdMotos}</div><div class="stat-sub">${veiculosFinal.filter(v=>v.tipo==='moto'&&v.status==='alugado').length} alugadas · ${veiculosFinal.filter(v=>v.tipo==='moto'&&v.status==='disponivel').length} disponíveis</div></div>
    <div class="stat-card" style="--accent-color:#2563EB"><div class="stat-icon">📊</div><div class="stat-label">Taxa de ocupação</div><div class="stat-val" style="color:#2563EB">${ocupFinal}%</div><div class="stat-sub">${veiculosFinal.filter(v=>v.status==='alugado').length} de ${totalVeic} veículos alugados</div></div>
    <div class="stat-card" style="--accent-color:#dc2626"><div class="stat-icon">🔧</div><div class="stat-label">Custo manutenções</div><div class="stat-val" style="color:#dc2626;font-size:22px">R$ ${custoManut.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div><div class="stat-sub">${manutFinal.length} registro${manutFinal.length!==1?'s':''}</div></div>
  </div>

  <div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,rgba(37,99,235,.06),rgba(124,58,237,.06));border:1px solid rgba(37,99,235,.15)">
    <div class="card-header"><span class="card-title">📊 Projeção de rendimentos</span></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:4px">
      ${[1,3,6,12].map(m=>`<div style="text-align:center;padding:12px;background:rgba(255,255,255,0.6);border-radius:10px;border:1px solid rgba(37,99,235,.1)"><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">${m} ${m===1?'mês':'meses'}</div><div style="font-size:18px;font-weight:800;color:#2563EB;margin:6px 0">R$ ${(rendMensal*m).toLocaleString('pt-BR')}</div><div style="font-size:10px;color:var(--muted2)">${investimento>0?((rendMensal*m/investimento)*100).toFixed(1):0}% do capital</div></div>`).join('')}
    </div>
  </div>

  <div class="card" style="margin-bottom:20px">
    <div class="card-header"><span class="card-title">🏍️ Meus veículos</span></div>
    <table><thead><tr><th>Veículo</th><th>Placa</th><th>Tipo</th><th>Diária</th><th>Status</th></tr></thead>
    <tbody>${veiculosFinal.length?veiculosFinal.map(v=>`<tr><td><div style="font-weight:500">${v.marca} ${v.modelo}</div><div style="font-size:11px;color:var(--muted)">${v.ano||''} · ${v.cor||''}</div></td><td>${v.placa}</td><td>${v.tipo==='moto'?'🏍️ Moto':'🚗 Carro'}</td><td style="color:var(--accent);font-weight:600">R$ ${(v.diaria||0).toFixed(2)}</td><td>${statusBadge(v.status)}</td></tr>`).join(''):'<tr class="empty-row"><td colspan="5">Nenhum veículo</td></tr>'}</tbody></table>
  </div>

  <div class="card" style="margin-bottom:20px">
    <div class="card-header"><span class="card-title">📋 Histórico de locações</span></div>
    <table><thead><tr><th>Veículo</th><th>Cliente</th><th>Período</th><th>Total</th><th>Status</th></tr></thead>
    <tbody>${locsFinal.length?locsFinal.map(l=>`<tr><td>${l.veiculos?.marca||''} ${l.veiculos?.modelo||''}<div style="font-size:11px;color:var(--muted)">${l.veiculos?.placa||''}</div></td><td>${l.clientes?.nome||'—'}</td><td style="font-size:12px">${fmtData(l.data_inicio)} a ${fmtData(l.data_fim)}</td><td style="color:var(--green);font-weight:600">R$ ${(l.total||0).toFixed(2)}</td><td>${l.status==='ativa'?'<span class="badge badge-green">Ativa</span>':l.status==='encerrada'?'<span class="badge badge-blue">Encerrada</span>':'<span class="badge badge-red">Cancelada</span>'}</td></tr>`).join(''):'<tr class="empty-row"><td colspan="5">Nenhuma locação</td></tr>'}</tbody></table>
  </div>

  <div class="card">
    <div class="card-header"><span class="card-title">🔧 Manutenções</span></div>
    <table><thead><tr><th>Veículo</th><th>Serviço</th><th>Custo</th><th>Status</th></tr></thead>
    <tbody>${manutFinal.length?manutFinal.map(m=>`<tr><td>${m.veiculos?.marca||''} ${m.veiculos?.modelo||''}<div style="font-size:11px;color:var(--muted)">${m.veiculos?.placa||''}</div></td><td>${m.tipo}<div style="font-size:11px;color:var(--muted)">${m.descricao||''}</div></td><td style="color:var(--red)">R$ ${(m.custo||0).toFixed(2)}</td><td>${m.status==='concluida'?'<span class="badge badge-green">Concluída</span>':m.status==='em_andamento'?'<span class="badge badge-blue">Em andamento</span>':'<span class="badge badge-yellow">Pendente</span>'}</td></tr>`).join(''):'<tr class="empty-row"><td colspan="4">Nenhuma manutenção</td></tr>'}</tbody></table>
  </div>`;
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
