// chat.js — Chat WhatsApp, SSE, usuários e investidores

// ══ CHAT ══
// Config WhatsApp
let wppCfg = {};
let wppOk = false;
let sseSource = null;
const BRIDGE_URL_KEY = 'fp_bridge_url';
const BRIDGE_SECRET_KEY = 'fp_bridge_secret';
const EVO_CFG_KEY = 'fp_evo_cfg';

function fmtPhone(tel){
  if(!tel) return '';
  let n=tel.replace(/\D/g,'');
  if(n.startsWith('0')) n=n.slice(1);
  if(!n.startsWith('55')) n='55'+n;
  return n;
}

// ── STATUS WPP ──
function setWppStatus(ok, msg){
  wppOk = ok;
  const dot = document.getElementById('wpp-dot');
  const txt = document.getElementById('wpp-status-txt');
  const badge = document.getElementById('wpp-status-badge');
  if(dot) dot.style.background = ok ? 'var(--green)' : 'var(--red)';
  if(txt){ txt.textContent = ok ? 'WhatsApp conectado' : (msg||'Desconectado'); txt.style.color = ok ? 'var(--green)' : 'var(--red)'; }
  if(badge){ badge.style.background = ok ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)'; badge.style.borderColor = ok ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)'; }
}

// ── SSE ──
function conectarSSE(bridgeUrl, secret){
  if(sseSource){ sseSource.close(); sseSource=null; }
  const url = bridgeUrl.replace(/\/$/,'')+'/events?secret='+encodeURIComponent(secret);
  sseSource = new EventSource(url);
  sseSource.onopen = ()=>{ console.log('[SSE] Conectado'); setWppStatus(true,'Conectado'); };
  sseSource.onmessage = e=>{
    try{
      const msg = JSON.parse(e.data);
      if(msg.tipo==='wpp_msg_recebida') receberMsgSSE(msg);
    }catch(_){}
  };
  sseSource.onerror = ()=>{
    console.warn('[SSE] Desconectado, reconectando em 5s...');
    setWppStatus(false,'Reconectando...');
    sseSource.close(); sseSource=null;
    const cfg = JSON.parse(localStorage.getItem(EVO_CFG_KEY)||'{}');
    if(cfg.bridgeUrl) setTimeout(()=>conectarSSE(cfg.bridgeUrl, cfg.secret||'FleetPro2025'), 5000);
  };
}

function receberMsgSSE(msg){
  console.log('[SSE] Mensagem chegou:', JSON.stringify(msg));
  // Encontra o cliente pelo ID ou pelo número
  const cidPorId     = msg.clienteId||null;
  const cidPorNumero = encontrarClientePorNumero(msg.numero);
  const cid          = cidPorId || cidPorNumero || msg.numero;

  const msgObj = {
    texto:      msg.texto||'',
    tipo:       msg.tipoMsg||'text',
    direcao:    'entrada',
    media_url:  msg.mediaUrl||null,
    created_at: msg.createdAt||new Date().toISOString()
  };

  // Guarda em memória em TODOS os identificadores possíveis
  [cid, cidPorId, cidPorNumero, msg.numero].filter(Boolean).forEach(k=>{
    if(!chatMsgs[k]) chatMsgs[k]=[];
    // Evita duplicatas
    const jatem = chatMsgs[k].some(m=>m.created_at===msgObj.created_at && m.texto===msgObj.texto);
    if(!jatem) chatMsgs[k].push(msgObj);
  });

  // Injeta no DOM se a conversa estiver aberta
  const estaAberta = activeChatId && [cid, cidPorId, cidPorNumero, msg.numero]
    .filter(Boolean).includes(activeChatId);
  if(estaAberta){
    const area = document.getElementById('chat-msgs');
    if(area){
      const ph = area.querySelector('[data-placeholder]');
      if(ph) ph.remove();
      area.insertAdjacentHTML('beforeend', renderMsgItem(msgObj));
      area.scrollTop = area.scrollHeight;
    }
  }

  // Atualiza lista de contatos
  renderChatContacts();

  // Notificação
  const nome = msg.nomeCliente||msg.numero||'Desconhecido';
  const prev = msg.texto ? msg.texto.slice(0,40) : '(mídia)';
  notify('💬 '+nome+': '+prev,'success');
  document.title='(!) FleetPro — '+nome;
  setTimeout(()=>document.title='FleetPro — Sistema de Locadora',8000);
}

function encontrarClientePorNumero(numero){
  if(!numero) return null;
  const numLimpo = numero.replace(/\D/g,'').slice(-11);
  const c = allClientes.find(c=>(c.telefone||'').replace(/\D/g,'').slice(-11)===numLimpo);
  return c ? c.id : numero;
}

// ── CONECTAR TUDO ──
async function conectarWpp(){
  const evoUrl   = (document.getElementById('wpp-url')?.value||'').trim().replace(/\/$/,'');
  const apiKey   = (document.getElementById('wpp-apikey')?.value||'').trim();
  const inst     = (document.getElementById('wpp-inst')?.value||'royalevo').trim();
  const bridge   = (document.getElementById('wpp-bridge')?.value||'').trim().replace(/\/$/,'');
  const secret   = (document.getElementById('wpp-secret')?.value||'FleetPro2025').trim();

  if(!bridge){ notify('Preencha a URL do Bridge Server','error'); return; }

  // Testa o bridge
  try{
    const r = await fetch(bridge+'/health', {signal: AbortSignal.timeout(5000)});
    if(!r.ok) throw new Error('Bridge retornou '+r.status);
  }catch(e){ notify('Bridge indisponível: '+e.message,'error'); return; }

  // Salva config
  const cfg = {apiUrl:evoUrl, apiKey, instancia:inst, bridgeUrl:bridge, secret};
  localStorage.setItem(EVO_CFG_KEY, JSON.stringify(cfg));

  // Conecta SSE
  conectarSSE(bridge, secret);
  setWppStatus(true,'Conectado');
  notify('WhatsApp conectado! SSE ativo.','success');

  // Mostra URL do webhook
  const el = document.getElementById('webhook-url-display');
  if(el) el.textContent = bridge+'/webhook/wpp  (header x-secret: '+secret+')';
}

// Preenche campos com config salva
function preencherCamposWpp(){
  const cfg = JSON.parse(localStorage.getItem(EVO_CFG_KEY)||'{}');
  if(cfg.apiUrl)   { const e=document.getElementById('wpp-url');    if(e) e.value=cfg.apiUrl; }
  if(cfg.apiKey)   { const e=document.getElementById('wpp-apikey'); if(e) e.value=cfg.apiKey; }
  if(cfg.instancia){ const e=document.getElementById('wpp-inst');   if(e) e.value=cfg.instancia; }
  if(cfg.bridgeUrl){ const e=document.getElementById('wpp-bridge'); if(e) e.value=cfg.bridgeUrl; }
  if(cfg.secret)   { const e=document.getElementById('wpp-secret'); if(e) e.value=cfg.secret; }
  if(cfg.bridgeUrl){
    const el=document.getElementById('webhook-url-display');
    if(el) el.textContent=cfg.bridgeUrl+'/webhook/wpp  (header x-secret: '+(cfg.secret||'FleetPro2025')+')';
  }
}

// ── CARREGAR MENSAGENS DO SUPABASE ──
async function carregarMsgsDB(clienteId){
  if(!sb) return [];

  // Se for número (contato desconhecido), busca por número diretamente
  const isNumero = clienteId && !clienteId.includes('-');
  if(isNumero){
    const numLimpo = clienteId.replace(/\D/g,'').slice(-11);
    const {data} = await sb.from('wpp_mensagens')
      .select('*').ilike('numero','%'+numLimpo)
      .order('created_at',{ascending:true}).limit(200);
    return data||[];
  }

  // Busca por cliente_id
  const {data:byId} = await sb.from('wpp_mensagens')
    .select('*').eq('cliente_id',clienteId)
    .order('created_at',{ascending:true}).limit(200);

  // Busca por número do cliente (msgs chegaram antes de cadastrar)
  const cliente = allClientes.find(c=>c.id===clienteId);
  let byNumero = [];
  if(cliente?.telefone){
    const numLimpo = cliente.telefone.replace(/\D/g,'').slice(-11);
    const {data:d} = await sb.from('wpp_mensagens')
      .select('*').ilike('numero','%'+numLimpo)
      .order('created_at',{ascending:true}).limit(200);
    byNumero = (d||[]).filter(m=>!m.cliente_id || m.cliente_id!==clienteId);
    // Vincula msgs órfãs ao cliente em background
    const semCliente = byNumero.filter(m=>!m.cliente_id).map(m=>m.id);
    if(semCliente.length>0)
      sb.from('wpp_mensagens').update({cliente_id:clienteId}).in('id',semCliente).then(()=>{});
  }

  const vistos = new Set();
  return [...(byId||[]),...byNumero]
    .filter(m=>{ if(vistos.has(m.id)) return false; vistos.add(m.id); return true; })
    .sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
}

// ── SALVAR MSG NO SUPABASE ──
async function salvarMsgDB(clienteId, numero, texto, tipo, direcao, mediaUrl){
  if(!sb) return;
  await sb.from('wpp_mensagens').insert({
    cliente_id:clienteId||null, numero, texto, tipo, direcao,
    media_url:mediaUrl||null, created_at:new Date().toISOString()
  }).catch(e=>console.warn('salvarMsgDB:',e.message));
}

// ── ENVIO DE TEXTO ──
async function evoSendText(telefone, texto){
  const cfg = JSON.parse(localStorage.getItem(EVO_CFG_KEY)||'{}');
  if(!cfg.apiUrl||!cfg.apiKey) throw new Error('Evolution API não configurada');
  const num = fmtPhone(telefone);
  const r = await fetch(cfg.apiUrl+'/message/sendText/'+cfg.instancia,{
    method:'POST',
    headers:{'apikey':cfg.apiKey,'Content-Type':'application/json'},
    body:JSON.stringify({number:num, text:texto, delay:1000})
  });
  if(!r.ok){ const t=await r.text(); throw new Error(t); }
  return await r.json();
}

// ── RENDER DE MENSAGENS ──
function renderMsgItem(m){
  const out = m.direcao==='saida' || m.out===true;
  const t = m.created_at
    ? new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    : (m.time||'');
  let corpo = '';
  if(m.tipo==='image' && m.media_url){
    corpo = '<img src="'+m.media_url+'" style="max-width:220px;border-radius:8px;display:block;margin-bottom:4px">';
    if(m.texto) corpo += '<div style="font-size:12px">'+m.texto+'</div>';
  } else if(m.tipo==='audio' && m.media_url){
    corpo = '<audio controls style="max-width:220px"><source src="'+m.media_url+'"></audio>';
  } else {
    const txt = (m.texto||m.text||'').replace(/</g,'&lt;').replace(/\n/g,'<br>');
    corpo = '<div style="white-space:pre-wrap">'+txt+'</div>';
  }
  return '<div class="msg '+(out?'msg-out':'msg-in')+'">'+corpo+'<div class="msg-time">'+t+'</div></div>';
}

async function renderChatMsgs(cid){
  const area = document.getElementById('chat-msgs');
  if(!area) return;
  // Mostra mensagens da memória imediatamente (sem spinner)
  const memMsgs = chatMsgs[cid]||[];
  if(memMsgs.length){
    area.innerHTML = memMsgs.map(renderMsgItem).join('');
    area.scrollTop = area.scrollHeight;
  } else {
    area.innerHTML = '<div style="text-align:center;font-size:12px;color:var(--muted2);padding:20px">⏳ Carregando...</div>';
  }
  // Busca do banco em paralelo
  try{
    const dbMsgs = await carregarMsgsDB(cid);
    const visto = new Set(dbMsgs.map(m=>m.created_at+'|'+(m.texto||'')));
    const extras = memMsgs.filter(m=>!visto.has((m.created_at||'')+'|'+(m.texto||m.text||'')));
    const todas = [...dbMsgs,...extras].sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0));
    if(todas.length){
      area.innerHTML = todas.map(renderMsgItem).join('');
    } else {
      area.innerHTML = '<div data-placeholder style="text-align:center;font-size:12px;color:var(--muted2);padding:30px">Sem mensagens ainda.</div>';
    }
  }catch(e){
    console.error('renderChatMsgs:', e);
    if(!memMsgs.length)
      area.innerHTML = '<div style="text-align:center;font-size:12px;color:var(--muted2);padding:30px">Sem mensagens ainda.</div>';
  }
  area.scrollTop = area.scrollHeight;
}

function renderChatContacts(){
  const s = (document.getElementById('chat-search')?.value||'').toLowerCase();

  // Coleta números desconhecidos (de memória)
  const numsCadastrados = new Set(allClientes.map(c=>(c.telefone||'').replace(/\D/g,'').slice(-11)));
  const desconhecidosMap = {};
  Object.keys(chatMsgs).forEach(k=>{
    const isUuid = k.includes('-');
    if(!isUuid){
      const num = k.replace(/\D/g,'').slice(-11);
      if(!numsCadastrados.has(num) && chatMsgs[k]?.length > 0 && !desconhecidosMap[num]){
        desconhecidosMap[num] = {id:k, nome:'📱 '+k, telefone:k, _desconhecido:true};
      }
    }
  });
  // Também de numeros que vieram do DB (wppNumsDB é preenchido no boot)
  (window._wppNumsDB||[]).forEach(num=>{
    const numL = num.replace(/\D/g,'').slice(-11);
    if(!numsCadastrados.has(numL) && !desconhecidosMap[numL]){
      desconhecidosMap[numL] = {id:num, nome:'📱 '+num, telefone:num, _desconhecido:true};
    }
  });

  const desconhecidos = Object.values(desconhecidosMap);
  const clientes = [...allClientes, ...desconhecidos].filter(c=>!s||c.nome.toLowerCase().includes(s)||(c.telefone||'').includes(s));
  document.getElementById('chat-contacts').innerHTML = clientes.map(c=>{
    const ini=(c.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const lastLocal = (chatMsgs[c.id]||[]).slice(-1)[0];
    const preview = lastLocal?.texto||lastLocal?.text||'Toque para abrir';
    return '<div class="chat-item '+(activeChatId===c.id?'active':'')+'" onclick="abrirChat(\''+c.id+'\')">'
      +'<div class="cavatar">'+ini+'</div>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:13px;font-weight:500">'+c.nome+'</div>'
        +'<div style="font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px">'+preview+'</div>'
      +'</div>'
    +'</div>';
  }).join('')||'<div style="padding:16px;font-size:12px;color:var(--muted)">Sem clientes</div>';
}

function filtrarContatos(){ renderChatContacts(); }

function abrirChat(cid){
  activeChatId = cid;
  const c = allClientes.find(x=>x.id===cid);

  // Número desconhecido — não é cliente cadastrado
  if(!c){
    document.getElementById('chat-av').textContent = '?';
    document.getElementById('chat-av').style.background = 'rgba(139,139,139,0.2)';
    document.getElementById('chat-av').style.color = 'var(--muted)';
    document.getElementById('chat-name').textContent = 'Desconhecido';
    document.getElementById('chat-info').textContent = cid + ' · Clique em Perfil para cadastrar';
    const area = document.getElementById('chat-msgs');
    const msgs = chatMsgs[cid]||[];
    area.innerHTML = msgs.length
      ? msgs.map(renderMsgItem).join('')
      : '<div data-placeholder style="text-align:center;font-size:12px;color:var(--muted2);padding:30px">Sem mensagens.</div>';
    area.scrollTop = area.scrollHeight;
    renderChatContacts();
    return;
  }
  const ini=(c.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  document.getElementById('chat-av').textContent = ini;
  document.getElementById('chat-name').textContent = c.nome;
  document.getElementById('chat-info').textContent = c.telefone ? '📱 '+c.telefone : 'Sem telefone';
  renderChatMsgs(cid);
  renderChatContacts();
  if(!document.getElementById('page-chat').classList.contains('active')) goPage('chat');
}



async function enviarContrato(){
  if(!activeChatId){ notify('Selecione um contato','error'); return; }
  const c = allClientes.find(x=>x.id===activeChatId);
  if(!c?.telefone){ notify('Cliente sem telefone','error'); return; }
  const texto = '📄 *CONTRATO FLEETPRO*\n\nCliente: '+c.nome+'\nCPF: '+c.cpf+'\n\nAcesse o sistema para ver e assinar o contrato.\n\n_Equipe FleetPro 🚗🏍️_';
  try{
    await evoSendText(c.telefone, texto);
    await salvarMsgDB(activeChatId, c.telefone, texto, 'text', 'saida', null);
    notify('Contrato enviado pelo WhatsApp!','success');
    renderChatMsgs(activeChatId);
  }catch(e){
    notify('Erro: '+e.message,'error');
  }
}

// Envia contrato do cliente ativo no chat
async function verPerfilCliente(cid){
  if(!cid) return;
  const c = allClientes.find(x=>x.id===cid);
  if(!c){ notify('Cadastre o cliente primeiro','error'); return; }
  document.getElementById('perfil-cli-titulo').textContent = '👤 '+c.nome;
  const body = document.getElementById('perfil-cli-body');
  body.innerHTML = '<div style="padding:16px;color:var(--muted2);font-size:13px">⏳ Carregando...</div>';
  document.getElementById('m-perfil-cliente').classList.add('show');
  // Busca locações do cliente
  const {data:locs} = await sb.from('locacoes')
    .select('*,veiculos(marca,modelo,placa)')
    .eq('cliente_id',c.id)
    .order('created_at',{ascending:false});
  const fone = c.telefone||'—';
  const locsHtml = (locs||[]).length ? (locs||[]).map(l=>{
    const dias = l.data_inicio&&l.data_fim ? Math.ceil((new Date(l.data_fim)-new Date(l.data_inicio))/86400000) : '?';
    const badge = l.status==='ativa'?'<span class="badge badge-green">Ativa</span>':l.status==='encerrada'?'<span class="badge badge-blue">Encerrada</span>':'<span class="badge badge-red">Cancelada</span>';
    return `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-weight:600;font-size:13px">🚗 ${l.veiculos?.marca||''} ${l.veiculos?.modelo||''} — ${l.veiculos?.placa||''}</span>${badge}
      </div>
      <div style="font-size:12px;color:var(--muted)">📅 ${fmtData(l.data_inicio)} a ${fmtData(l.data_fim)} · ${dias} dias</div>
      <div style="font-size:12px;color:var(--muted)">💰 R$ ${(l.diaria||0).toFixed(2)}/dia · Total: R$ ${(l.total||0).toFixed(2)}</div>
      ${l.km_inicial?`<div style="font-size:12px;color:var(--muted)">🔑 Km inicial: ${l.km_inicial}${l.km_final?' · Km final: '+l.km_final:''}</div>`:''}
      <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px;margin-top:8px" onclick="enviarContratoEspecifico('${c.id}','${l.id}')">📤 Enviar pelo WhatsApp</button>
    </div>`;
  }).join('') : '<div style="color:var(--muted2);font-size:13px;padding:8px 0">Nenhum contrato registrado ainda.</div>';

  body.innerHTML = `
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><div style="font-size:11px;color:var(--muted2)">TELEFONE</div><div style="font-size:13px">${fone}</div></div>
      <div><div style="font-size:11px;color:var(--muted2)">CPF</div><div style="font-size:13px">${c.cpf||'—'}</div></div>
      <div><div style="font-size:11px;color:var(--muted2)">EMAIL</div><div style="font-size:13px">${c.email||'—'}</div></div>
      <div><div style="font-size:11px;color:var(--muted2)">CNH</div><div style="font-size:13px">${c.cnh||'—'} ${cnhBadge(c.cnh_validade)}</div></div>
      ${c.endereco?`<div style="grid-column:1/-1"><div style="font-size:11px;color:var(--muted2)">ENDEREÇO</div><div style="font-size:13px">${c.endereco}</div></div>`:''}
    </div>
    <div style="padding:16px 20px">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:12px">HISTÓRICO DE LOCAÇÕES (${(locs||[]).length})</div>
      ${locsHtml}
    </div>
    <div style="padding:0 20px 4px;display:flex;gap:8px">
      <button class="btn btn-ghost" style="flex:1" onclick="editarCliente('${c.id}');closeModal('perfil-cliente')">✏️ Editar cadastro</button>
      <button class="btn btn-primary" style="flex:1" onclick="abrirChat('${c.id}');closeModal('perfil-cliente')">💬 Abrir chat</button>
    </div>`;
}

async function enviarContratoEspecifico(clienteId, locacaoId){
  const c = allClientes.find(x=>x.id===clienteId);
  if(!c?.telefone){ notify('Cliente sem telefone','error'); return; }
  const {data:locs} = await sb.from('locacoes').select('*,veiculos(marca,modelo,placa)').eq('id',locacaoId).single();
  const l = locs;
  if(!l){ notify('Locação não encontrada','error'); return; }
  const dias = Math.ceil((new Date(l.data_fim)-new Date(l.data_inicio))/86400000);
  const txt = '📄 *CONTRATO DE LOCAÇÃO — FleetPro*\n\n'
    + '👤 Cliente: '+c.nome+'\n📋 CPF: '+c.cpf+'\n'
    + '\n🚗 '+l.veiculos?.marca+' '+l.veiculos?.modelo+' — '+l.veiculos?.placa+'\n'
    + '📅 '+fmtData(l.data_inicio)+' a '+fmtData(l.data_fim)+' ('+dias+' dias)\n'
    + '💰 R$ '+((l.diaria||0).toFixed(2))+'/dia · Total: R$ '+((l.total||0).toFixed(2))+'\n'
    + '\n✅ Contrato registrado no sistema FleetPro.\n_Equipe FleetPro 🚗🏍️_';
  try{
    await evoSendText(c.telefone, txt);
    await salvarMsgDB(clienteId, c.telefone, txt, 'text', 'saida', null);
    notify('Contrato enviado pelo WhatsApp! ✓','success');
  }catch(e){ notify('Erro: '+e.message,'error'); }
}

async function enviarContratoChat(){
  if(!activeChatId){ notify('Selecione um contato primeiro','error'); return; }
  const c = allClientes.find(x=>x.id===activeChatId);
  if(!c){ notify('Contato sem cadastro — cadastre o cliente primeiro','error'); return; }
  if(!c.telefone){ notify('Cliente sem telefone cadastrado','error'); return; }
  // Busca última locação desse cliente
  const {data:locs} = await sb.from('locacoes')
    .select('*,veiculos(marca,modelo,placa)')
    .eq('cliente_id',c.id)
    .order('created_at',{ascending:false})
    .limit(1);
  const loc = locs?.[0];
  let texto = '📄 *CONTRATO DE LOCAÇÃO — FleetPro*\n\n';
  texto += `👤 Cliente: ${c.nome}\n`;
  texto += `📋 CPF: ${c.cpf}\n`;
  if(loc){
    texto += `\n🚗 Veículo: ${loc.veiculos?.marca} ${loc.veiculos?.modelo} — ${loc.veiculos?.placa}\n`;
    texto += `📅 Período: ${fmtData(loc.data_inicio)} a ${fmtData(loc.data_fim)}\n`;
    texto += `💰 Diária: R$ ${(loc.diaria||0).toFixed(2)} · Total: R$ ${(loc.total||0).toFixed(2)}\n`;
  }
  texto += `\n✅ Contrato registrado no sistema FleetPro.\n_Equipe FleetPro 🚗🏍️_`;
  try{
    await evoSendText(c.telefone, texto);
    await salvarMsgDB(activeChatId, c.telefone, texto, 'text', 'saida', null);
    notify('Contrato enviado pelo WhatsApp! ✓','success');
    renderChatMsgs(activeChatId);
  }catch(e){
    notify('Erro ao enviar: '+e.message,'error');
  }
}


// Envia contrato resumido pelo WhatsApp direto do chat
async function enviarContratoWpp(){
  if(!activeChatId){ notify('Selecione um contato primeiro','error'); return; }
  const c = allClientes.find(x=>x.id===activeChatId);
  if(!c){ notify('Cliente não encontrado','error'); return; }
  if(!c.telefone){ notify('Cliente sem telefone cadastrado','error'); return; }

  // Busca última locação ativa do cliente
  const {data:locs} = await sb.from('locacoes')
    .select('*,veiculos(marca,modelo,placa)')
    .eq('cliente_id', c.id)
    .eq('status','ativa')
    .order('created_at',{ascending:false})
    .limit(1);

  let texto = '';
  if(locs && locs.length > 0){
    const l = locs[0];
    const dias = Math.ceil((new Date(l.data_fim)-new Date(l.data_inicio))/86400000);
    texto = `📄 *CONTRATO DE LOCAÇÃO*

`
      +`👤 *Cliente:* ${c.nome}
`
      +`📋 *CPF:* ${c.cpf}
`
      +`🚗 *Veículo:* ${l.veiculos?.marca} ${l.veiculos?.modelo} — ${l.veiculos?.placa}
`
      +`📅 *Período:* ${fmtData(l.data_inicio)} a ${fmtData(l.data_fim)} (${dias} dias)
`
      +`💰 *Diária:* R$ ${(l.diaria||0).toFixed(2)}
`
      +`💳 *Total:* R$ ${(l.total||0).toFixed(2)}

`
      +`✅ Ao retirar o veículo, o cliente declara estar ciente dos termos.

`
      +`_FleetPro Locadora 🚗🏍️_`;
  } else {
    texto = `📄 *PROPOSTA FLEETPRO*

`
      +`Olá, ${c.nome}! Temos veículos disponíveis para você.
`
      +`Carros a partir de R$ 120/dia 🚗
`
      +`Motos a partir de R$ 60/dia 🏍️

`
      +`_FleetPro Locadora_`;
  }

  try{
    await evoSendText(c.telefone, texto);
    await salvarMsgDB(activeChatId, c.telefone, texto, 'text', 'saida', null);
    // Exibe no chat local
    if(!chatMsgs[activeChatId]) chatMsgs[activeChatId]=[];
    chatMsgs[activeChatId].push({texto, tipo:'text', direcao:'saida', out:true, created_at:new Date().toISOString()});
    renderChatMsgs(activeChatId);
    notify('Contrato enviado pelo WhatsApp! ✓','success');
  }catch(e){
    notify('Erro ao enviar: '+e.message,'error');
  }
}

// Enviar arquivo (imagem, áudio, documento)
let _mediaFile = null, _mediaType = '';
function enviarArquivo(input, tipo){
  const file = input.files[0]; if(!file) return;
  _mediaFile = file; _mediaType = tipo;
  const prev = document.getElementById('media-preview');
  const txt  = document.getElementById('media-preview-txt');
  if(prev && txt){
    prev.style.display = 'flex';
    txt.textContent = (tipo==='image'?'🖼️':tipo==='audio'?'🎵':'📎')+' '+file.name+' ('+Math.round(file.size/1024)+'KB) — clique Enviar';
  }
  input.value = '';
}

function cancelarMidia(){
  _mediaFile = null; _mediaType = '';
  const prev = document.getElementById('media-preview');
  if(prev) prev.style.display = 'none';
}

async function sendMsg(){
  if(!activeChatId){ notify('Selecione um contato','error'); return; }
  const c = allClientes.find(x=>x.id===activeChatId);

  // Se tem mídia na fila, envia arquivo
  if(_mediaFile){
    await _enviarMidiaWpp(c);
    return;
  }

  if(!c?.telefone){ notify('Cliente sem telefone cadastrado','error'); return; }
  const inp = document.getElementById('chat-msg-input');
  const texto = inp.value.trim();
  if(!texto) return;

  if(!chatMsgs[activeChatId]) chatMsgs[activeChatId]=[];
  chatMsgs[activeChatId].push({texto, tipo:'text', direcao:'saida', out:true,
    created_at:new Date().toISOString(), time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})});
  inp.value='';
  renderChatMsgs(activeChatId);
  renderChatContacts();

  try{
    await evoSendText(c.telefone, texto);
    await salvarMsgDB(activeChatId, c.telefone, texto, 'text', 'saida', null);
    notify('Mensagem enviada ✓','success');
  }catch(e){
    notify('Erro ao enviar: '+e.message,'error');
  }
}

async function _enviarMidiaWpp(c){
  if(!c?.telefone){ notify('Cliente sem telefone','error'); return; }
  notify('Enviando arquivo...','success');
  try{
    const cfg = JSON.parse(localStorage.getItem('EVO_WPP_CFG')||localStorage.getItem(EVO_CFG_KEY)||'{}');
    if(!cfg.apiUrl||!cfg.apiKey) throw new Error('Evolution API não configurada');
    const num = fmtPhone(c.telefone);
    const reader = new FileReader();
    reader.onload = async(e)=>{
      const base64 = e.target.result.split(',')[1];
      const mediaType = _mediaType;
      const fileName  = _mediaFile.name;
      const mimeType  = _mediaFile.type;
      let endpoint='', body={};
      if(mediaType==='image'){
        endpoint='sendMedia'; body={number:num,mediatype:'image',media:base64,caption:''};
      } else if(mediaType==='audio'){
        endpoint='sendWhatsAppAudio'; body={number:num,audio:base64,encoding:true};
      } else {
        endpoint='sendMedia'; body={number:num,mediatype:'document',media:base64,fileName,caption:''};
      }
      const r = await fetch(cfg.apiUrl+'/message/'+endpoint+'/'+cfg.instancia,{
        method:'POST',
        headers:{'apikey':cfg.apiKey,'Content-Type':'application/json'},
        body:JSON.stringify(body)
      });
      if(!r.ok){ const t=await r.text(); throw new Error(t); }
      // Salva no chat local
      if(!chatMsgs[activeChatId]) chatMsgs[activeChatId]=[];
      chatMsgs[activeChatId].push({texto:fileName||'Arquivo', tipo:mediaType, direcao:'saida', out:true, created_at:new Date().toISOString()});
      await salvarMsgDB(activeChatId, c.telefone, fileName||'Arquivo', mediaType, 'saida', null);
      cancelarMidia();
      renderChatMsgs(activeChatId);
      notify('Arquivo enviado ✓','success');
    };
    reader.readAsDataURL(_mediaFile);
  }catch(err){
    notify('Erro: '+err.message,'error');
  }
}

// Upload de arquivo
// ── GRAVAÇÃO DE ÁUDIO ──
let mediaRecorder = null, audioChunks = [], gravando = false;

async function toggleGravarAudio(){
  const btn = document.getElementById('btn-mic');
  if(!gravando){
    // Inicia gravação
    try{
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e=>{ if(e.data.size>0) audioChunks.push(e.data); };
      mediaRecorder.onstop = async ()=>{
        const blob = new Blob(audioChunks,{type:'audio/ogg;codecs=opus'});
        const file = new File([blob],'audio.ogg',{type:'audio/ogg'});
        // Para o stream
        stream.getTracks().forEach(t=>t.stop());
        // Envia
        const reader = new FileReader();
        reader.onload = e=>{
          mediaQueue = {file, tipo:'audio', base64:e.target.result.split(',')[1]};
          const prev = document.getElementById('media-preview');
          const prevTxt = document.getElementById('media-preview-txt');
          if(prev) prev.style.display='flex';
          if(prevTxt) prevTxt.textContent='🎙️ Áudio gravado ('+Math.round(blob.size/1024)+'kb) — clique Enviar';
        };
        reader.readAsDataURL(blob);
        btn.textContent='🎙️';
        btn.style.background='var(--bg3)';
        btn.style.borderColor='var(--border2)';
        gravando = false;
      };
      mediaRecorder.start();
      gravando = true;
      btn.textContent='⏹️';
      btn.style.background='rgba(239,68,68,.15)';
      btn.style.borderColor='var(--red)';
      notify('Gravando... Clique ⏹️ para parar','success');
    }catch(e){
      notify('Erro ao acessar microfone: '+e.message,'error');
    }
  } else {
    // Para gravação
    if(mediaRecorder && mediaRecorder.state!=='inactive') mediaRecorder.stop();
    gravando = false;
  }
}

function selecionarArquivo(input, tipo){
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    mediaQueue = {file, tipo, base64:e.target.result.split(',')[1]};
    const prev = document.getElementById('file-preview');
    if(prev){ document.getElementById('file-preview-name').textContent=(tipo==='image'?'🖼 ':'🎵 ')+file.name; prev.style.display='flex'; }
  };
  reader.readAsDataURL(file);
}
function cancelarArquivo(){
  mediaQueue=null;
  const prev=document.getElementById('file-preview'); if(prev) prev.style.display='none';
  const fi=document.getElementById('file-img'); if(fi) fi.value='';
  const fa=document.getElementById('file-audio'); if(fa) fa.value='';
}
function toggleRecord(){ notify('Gravação em breve','success'); }
function setMsg(t){ document.getElementById('chat-msg-input').value=t; }

// ══ USUÁRIOS (admin only) ══
async function renderUsuarios(){
  const {data}=await sb.from('perfis').select('*').order('created_at');
  allPerfis=data||[];
  document.getElementById('usuarios-list').innerHTML=allPerfis.map(u=>{
    const isMe=u.id===currentUser?.id;
    const rBadge=u.perfil==='admin'?'badge-yellow':u.perfil==='atendente'?'badge-blue':'badge-purple';
    const rLabel=ROLE_LABELS[u.perfil];
    return `<div class="user-card">
      <div class="cavatar" style="width:42px;height:42px;font-size:14px;background:rgba(245,166,35,.12);color:var(--accent)">${(u.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
      <div class="uc-info"><div class="uc-name">${u.nome}${isMe?' <span style="font-size:10px;color:var(--muted)">(você)</span>':''}</div><div class="uc-email">${u.email}</div></div>
      <div class="uc-actions">
        <span class="badge ${rBadge}">${rLabel}</span>
        ${!isMe?`<select onchange="alterarPerfil('${u.id}',this.value)" style="font-size:12px;padding:5px 8px;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:6px;cursor:pointer">
          <option value="atendente" ${u.perfil==='atendente'?'selected':''}>Atendente</option>
          <option value="admin" ${u.perfil==='admin'?'selected':''}>Admin</option>
          <option value="investidor" ${u.perfil==='investidor'?'selected':''}>Investidor</option>
        </select>`:'<span style="font-size:11px;color:var(--muted2)">seu perfil</span>'}
      </div>
    </div>`;
  }).join('')||'<p style="color:var(--muted2)">Nenhum usuário encontrado.</p>';
}
async function alterarPerfil(uid,novoPerfil){
  const {error}=await sb.from('perfis').update({perfil:novoPerfil}).eq('id',uid);
  if(error){notify('Erro: '+error.message,'error');return;}
  notify('Perfil atualizado!','success'); renderUsuarios();
}

// ══ INVESTIDORES ══
function renderInvestidores(){
  const el=document.getElementById('page-investidores');
  const stats=`<div class="stats-grid">
    <div class="stat-card" style="--accent-color:var(--green)"><div class="stat-icon">💰</div><div class="stat-label">Receita estimada/mês</div><div class="stat-val" style="color:var(--green)">R$ ${calcReceitaMes()}</div><div class="stat-sub">locações ativas</div></div>
    <div class="stat-card" style="--accent-color:var(--blue)"><div class="stat-icon">🚗</div><div class="stat-label">Total veículos</div><div class="stat-val" style="color:var(--blue)">${allVeiculos.length}</div><div class="stat-sub">${allVeiculos.filter(v=>v.status==='disponivel').length} disponíveis</div></div>
    <div class="stat-card" style="--accent-color:var(--accent)"><div class="stat-icon">📋</div><div class="stat-label">Locações ativas</div><div class="stat-val" style="color:var(--accent)">${allLocacoes.length}</div><div class="stat-sub">ocupação: ${calcOcupacao()}%</div></div>
    <div class="stat-card" style="--accent-color:var(--purple)"><div class="stat-icon">👥</div><div class="stat-label">Clientes</div><div class="stat-val" style="color:var(--purple)">${allClientes.length}</div><div class="stat-sub">cadastrados</div></div>
  </div>`;
  const nota=currentPerfil?.perfil==='admin'?`<div style="margin-bottom:20px;padding:14px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2);border-radius:10px;font-size:13px;color:var(--purple)">📊 Investidores com login próprio veem apenas esta área.</div>`:'';
  el.innerHTML=nota+stats+`<div class="card"><div class="card-header"><span class="card-title">Relatório de frota</span></div>
    <table><thead><tr><th>Veículo</th><th>Tipo</th><th>Status</th><th>Diária</th></tr></thead>
    <tbody>${allVeiculos.map(v=>`<tr><td><div style="font-weight:500">${v.marca} ${v.modelo}</div><div style="font-size:11px;color:var(--muted)">${v.placa}</div></td><td>${v.tipo==='carro'?'🚗 Carro':'🏍️ Moto'}</td><td>${statusBadge(v.status)}</td><td style="color:var(--accent);font-weight:600">R$ ${(v.diaria||0).toFixed(2)}</td></tr>`).join('')}</tbody></table>
  </div>`;
}
function calcReceitaMes(){return allLocacoes.reduce((acc,l)=>{const dias=Math.min(30,Math.ceil((new Date(l.data_fim)-new Date(l.data_inicio))/86400000));return acc+(l.diaria||0)*dias;},0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
function calcOcupacao(){if(!allVeiculos.length) return 0;return Math.round(allLocacoes.length/allVeiculos.length*100);}

