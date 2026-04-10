// ui.js — Camadas, modais, notificações, utilitários
// ══ LAYERS ══
function goLayer(id){
  document.querySelectorAll('.layer').forEach(l=>l.classList.remove('active'));
  document.getElementById('layer-'+id).classList.add('active');
}
// ══ MODALS ══
function openModal(type, subtipo){
  if(type==='veiculo'){
    document.getElementById('mv-title').textContent = subtipo==='moto' ? 'Cadastrar Moto' : 'Cadastrar Carro';
    if(subtipo) document.getElementById('mv-tipo').value = subtipo;
    document.getElementById('m-veiculo').classList.add('show');
    preencherSelectInvestidores();
  } else if(type==='cliente'){
    document.getElementById('m-cliente').classList.add('show');
  } else if(type==='manutencao'){
    document.getElementById('mm-vei').innerHTML = allVeiculos.map(v=>`<option value="${v.id}">${v.marca} ${v.modelo} — ${v.placa}</option>`).join('');
    document.getElementById('mm-ini').value = new Date().toISOString().split('T')[0];
    document.getElementById('m-manutencao').classList.add('show');
  } else if(type==='criar-usuario'){
    ['r-nome','r-email','r-senha'].forEach(id=>{
      const el = document.getElementById(id); if(el) el.value='';
    });
    const err = document.getElementById('register-err');
    const ok  = document.getElementById('register-ok');
    if(err) err.style.display='none';
    if(ok)  ok.style.display='none';
    document.getElementById('m-criar-usuario').classList.add('show');
  }
}
function closeModal(t){
  const el = document.getElementById('m-'+t);
  if(el) el.classList.remove('show');
}
// Fecha modal clicando fora
document.querySelectorAll('.modal-overlay').forEach(el=>
  el.addEventListener('click', e=>{ if(e.target===el) el.classList.remove('show'); })
);
// ══ UTILS ══
function fmtData(d){ return d ? d.split('-').reverse().join('/') : '—'; }
function fmtDt(dt){
  if(!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}
function fmtPhone(tel){
  const n = (tel||'').replace(/\D/g,'');
  return n.length <= 11 ? '55'+n : n;
}
function notify(msg, type='success'){
  const el = document.getElementById('notify');
  el.textContent = (type==='success' ? '✓ ' : '✕ ') + msg;
  el.className = 'notify ' + type;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(()=> el.style.display='none', 3500);
}
function setMsg(txt){
  const inp = document.getElementById('chat-msg-input');
  if(inp){ inp.value = txt; inp.focus(); }
}

// ══ BUSCA GLOBAL ══
(function(){
  let _buscaTimer = null;

  function _highlight(txt, q){
    if(!q) return txt;
    const re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')', 'gi');
    return txt.replace(re, '<mark style="background:rgba(79,70,229,.3);color:#C7D2FE;border-radius:3px;padding:0 2px">$1</mark>');
  }

  function _fechar(){
    const res = document.getElementById('busca-resultados');
    if(res) res.style.display = 'none';
  }

  function _renderResultados(q){
    const res = document.getElementById('busca-resultados');
    if(!res) return;
    if(!q || q.length < 2){ _fechar(); return; }

    const ql = q.toLowerCase();
    const itens = [];

    // Clientes
    (allClientes||[]).forEach(c=>{
      const match = (c.nome||'').toLowerCase().includes(ql)
        || (c.cpf||'').replace(/\D/g,'').includes(ql.replace(/\D/g,''))
        || (c.telefone||'').replace(/\D/g,'').includes(ql.replace(/\D/g,''));
      if(match) itens.push({
        tipo: 'cliente',
        tag: 'Cliente',
        titulo: c.nome,
        sub: c.cpf ? 'CPF '+c.cpf : (c.telefone||''),
        acao: ()=>{ goPage('clientes'); setTimeout(()=>{ const s=document.getElementById('s-clientes'); if(s){s.value=c.nome;renderClientes();} },400); }
      });
    });

    // Veículos — carros e motos
    (allVeiculos||[]).forEach(v=>{
      const match = (v.modelo||'').toLowerCase().includes(ql)
        || (v.marca||'').toLowerCase().includes(ql)
        || (v.placa||'').toLowerCase().includes(ql);
      if(match) itens.push({
        tipo: v.tipo,
        tag: v.tipo === 'carro' ? 'Carro' : 'Moto',
        titulo: v.marca+' '+v.modelo,
        sub: v.placa + (v.status ? ' · '+_statusLabel(v.status) : ''),
        acao: ()=>{ goPage(v.tipo==='carro'?'carros':'motos'); setTimeout(()=>{ const s=document.getElementById('s-'+(v.tipo==='carro'?'carros':'motos')); if(s){s.value=v.placa;renderVeiculos();} },400); }
      });
    });

    // Locações ativas
    (allLocacoes||[]).forEach(l=>{
      const nomeCliente = l.clientes?.nome||'';
      const placa = l.veiculos?.placa||'';
      const modelo = l.veiculos?.modelo||'';
      const match = nomeCliente.toLowerCase().includes(ql)
        || placa.toLowerCase().includes(ql)
        || modelo.toLowerCase().includes(ql);
      if(match) itens.push({
        tipo: 'locacao',
        tag: 'Locação',
        titulo: modelo+' · '+placa,
        sub: nomeCliente + (l.data_fim ? ' · devolução '+fmtData(l.data_fim) : ''),
        acao: ()=>goPage('locacoes')
      });
    });

    if(!itens.length){
      res.innerHTML = '<div style="padding:14px 16px;font-size:13px;color:var(--muted2);text-align:center">Nenhum resultado para "<strong style="color:var(--text2)">'+q+'</strong>"</div>';
      res.style.display = 'block';
      return;
    }

    const TAG_CFG = {
      cliente:  { bg:'rgba(79,70,229,.15)',  cor:'#818CF8' },
      carro:    { bg:'rgba(22,163,74,.12)',  cor:'#4ade80' },
      moto:     { bg:'rgba(217,119,6,.12)',  cor:'#FCD34D' },
      locacao:  { bg:'rgba(220,38,38,.12)',  cor:'#F87171' },
    };

    res.innerHTML = itens.slice(0,8).map((item,i)=>{
      const cfg = TAG_CFG[item.tipo] || TAG_CFG.cliente;
      return `<div class="search-item" onclick="_buscaAcao(${i})" style="gap:10px">
        <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;background:${cfg.bg};color:${cfg.cor};white-space:nowrap;flex-shrink:0">${item.tag}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_highlight(item.titulo, q)}</div>
          <div style="font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_highlight(item.sub, q)}</div>
        </div>
      </div>`;
    }).join('');

    // Guarda ações para chamar por índice (evita injeção via onclick string)
    window._buscaAcoes = itens.slice(0,8).map(i=>i.acao);
    res.style.display = 'block';
  }

  window._buscaAcao = function(i){
    const acao = (window._buscaAcoes||[])[i];
    if(typeof acao === 'function') acao();
    _fechar();
    const inp = document.getElementById('busca-global');
    if(inp) inp.value = '';
  };

  function _statusLabel(s){
    return {disponivel:'Disponível', alugado:'Alugado', manutencao:'Manutenção', reservado:'Reservado', preparacao:'Preparação'}[s] || s;
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const inp = document.getElementById('busca-global');
    const res = document.getElementById('busca-resultados');
    if(!inp || !res) return;

    inp.addEventListener('input', ()=>{
      clearTimeout(_buscaTimer);
      _buscaTimer = setTimeout(()=>_renderResultados(inp.value.trim()), 180);
    });

    inp.addEventListener('keydown', e=>{
      if(e.key === 'Escape'){ _fechar(); inp.value=''; }
    });

    // Fecha ao clicar fora
    document.addEventListener('click', e=>{
      if(!inp.contains(e.target) && !res.contains(e.target)) _fechar();
    });
  });
})();

// ══ BOTÃO ATUALIZAR — reload completo voltando para a página atual ══
(function(){
  document.addEventListener('DOMContentLoaded', ()=>{
    const btn = [...document.querySelectorAll('.topbar-btn')].find(b=>b.textContent.trim()==='↻');
    if(!btn) return;
    btn.onclick = function(){
      // Salva a página ativa antes do reload
      const pageAtiva = document.querySelector('.page.active')?.id?.replace('page-','');
      const chatAtivo = window.activeChatId || null;
      if(pageAtiva) sessionStorage.setItem('fp_last_page', pageAtiva);
      if(chatAtivo) sessionStorage.setItem('fp_last_chat', chatAtivo);
      btn.style.transform = 'rotate(360deg)';
      btn.style.transition = 'transform .5s ease';
      setTimeout(()=>window.location.reload(), 400);
    };
  });
})();
