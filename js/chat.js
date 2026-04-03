// ══ CONFIG ══
let wppCfg = {};
let wppOk = false;
let sseSource = null;
const EVO_CFG_KEY = 'fp_evo_cfg';

// ══ MENSAGENS NÃO LIDAS ══
const UNREAD_KEY = 'fp_unread';
function getUnread(){ try{ return JSON.parse(localStorage.getItem(UNREAD_KEY)||'{}'); }catch(_){ return {}; } }
function incrementUnread(cid){ const u=getUnread(); u[cid]=(u[cid]||0)+1; localStorage.setItem(UNREAD_KEY,JSON.stringify(u)); }
function clearUnread(cid){ const u=getUnread(); delete u[cid]; localStorage.setItem(UNREAD_KEY,JSON.stringify(u)); }
function totalUnread(){ return Object.values(getUnread()).reduce((a,b)=>a+b,0); }
function atualizarBadgeNotif(){
  const total=totalUnread();
  const dot=document.querySelector('.notif-dot');
  if(dot) dot.style.display=total>0?'block':'none';
  document.title=total>0?`(${total}) FleetPro | Plataforma de Locadoras`:'FleetPro | Plataforma de Locadoras';
}

function fmtPhone(tel){
  if(!tel) return '';
  let n = tel.replace(/\D/g,'');
  if(n.startsWith('0')) n = n.slice(1);
  if(!n.startsWith('55')) n = '55'+n;
  return n;
}

// ── STATUS WPP ──
function setWppStatus(ok, msg){
  wppOk = ok;
  const dot   = document.getElementById('wpp-dot');
  const txt   = document.getElementById('wpp-status-txt');
  const badge = document.getElementById('wpp-status-badge');
  const hdr   = document.getElementById('chat-wpp-status');
  if(dot)   dot.style.background = ok ? 'var(--green)' : 'var(--red)';
  if(txt){  txt.textContent = ok ? 'WhatsApp conectado' : (msg||'Desconectado'); txt.style.color = ok ? 'var(--green)' : 'var(--red)'; }
  if(badge){ badge.style.background = ok ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)'; badge.style.borderColor = ok ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)'; }
  if(hdr){  hdr.textContent = ok ? '● Conectado' : '● Desconectado'; hdr.style.color = ok ? 'var(--green)' : 'var(--red)'; }
}

// ── SSE ──
function conectarSSE(bridgeUrl, secret){
  if(sseSource){ sseSource.close(); sseSource = null; }
  const sseUrl = bridgeUrl.replace(/\/$/,'')+'/events?secret='+encodeURIComponent(secret);
  sseSource = new EventSource(sseUrl);
  sseSource.onopen = ()=>{ console.log('[SSE] Conectado'); setWppStatus(true,'Conectado'); };
  sseSource.onmessage = e=>{
    try{
      const msg = JSON.parse(e.data);
      if(msg.tipo==='wpp_msg_recebida') receberMsgSSE(msg);
      else if(msg.tipo==='sara_bloqueada')   _atualizarBotaoSara(msg.numero, true);
      else if(msg.tipo==='sara_desbloqueada') _atualizarBotaoSara(msg.numero, false);
    }catch(_){}
  };
  sseSource.onerror = ()=>{
    setWppStatus(false,'Reconectando...');
    sseSource.close(); sseSource = null;
    const cfg = JSON.parse(localStorage.getItem(EVO_CFG_KEY)||'{}');
    if(cfg.bridgeUrl) setTimeout(()=>conectarSSE(cfg.bridgeUrl, cfg.secret||'FleetPro2025'), 5000);
  };
}

function receberMsgSSE(msg){
  console.log('[SSE] Mensagem chegou:', JSON.stringify(msg));
  const cidPorId     = msg.clienteId||null;
  const cidPorNumero = encontrarClientePorNumero(msg.numero);
  const cid          = cidPorId || cidPorNumero || msg.numero;

  // Detecta SARA pelo nomeCliente — Bridge não repassa campos extras
  const isSara = (msg.nomeCliente||'').includes('SARA') || (msg.nomeCliente||'').includes('🤖');
  const fromMe = isSara
    || msg.fromMe===true || msg.fromMe==='true'
    || msg.from_me===true || msg.from_me==='true';

  const msgObj = {
    texto:      msg.texto||'',
    tipo:       msg.tipoMsg||msg.tipo||'text',
    direcao:    fromMe ? 'saida' : 'entrada',
    out:        fromMe,
    media_url:  msg.mediaUrl||msg.media_url||null,
    created_at: msg.createdAt||msg.created_at||new Date().toISOString()
  };

  [cid, cidPorId, cidPorNumero, msg.numero].filter(Boolean).forEach(k=>{
    if(!chatMsgs[k]) chatMsgs[k] = [];
    const jatem = chatMsgs[k].some(m=>m.created_at===msgObj.created_at && m.texto===msgObj.texto);
    if(!jatem) chatMsgs[k].push(msgObj);
  });

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

  if(!estaAberta) incrementUnread(cid);
  if(allClientes && allClientes.length > 0) renderChatContacts();
  atualizarBadgeNotif();
  const nome = msg.nomeCliente||msg.numero||'Desconhecido';
  const prev = msg.texto ? msg.texto.slice(0,40) : '(mídia)';
  notify('💬 '+nome+': '+prev,'success');
  document.title = '(!) FleetPro — '+nome;
  setTimeout(()=>document.title='FleetPro — Sistema de Locadora', 8000);
}

function encontrarClientePorNumero(numero){
  if(!numero) return null;
  const numLimpo = numero.replace(/\D/g,'').slice(-11);
  const c = allClientes.find(c=>(c.telefone||'').replace(/\D/g,'').slice(-11)===numLimpo);
  return c ? c.id : numero;
}

// ── CONECTAR WPP ──
async function conectarWpp(){
  const evoUrl = (document.getElementById('wpp-url')?.value||'').trim().replace(/\/$/,'');
  const apiKey = (document.getElementById('wpp-apikey')?.value||'').trim();
  const inst   = (document.getElementById('wpp-inst')?.value||'fleetpro').trim();
  const bridge = (document.getElementById('wpp-bridge')?.value||'').trim().replace(/\/$/,'');
  const secret = (document.getElementById('wpp-secret')?.value||'FleetPro2025').trim();

  if(!bridge){ notify('Preencha a URL do Bridge Server','error'); return; }

  try{
    const r = await fetch(bridge+'/health', {signal: AbortSignal.timeout(5000)});
    if(!r.ok) throw new Error('Bridge retornou '+r.status);
  }catch(e){ notify('Bridge indisponível: '+e.message,'error'); return; }

  const cfg = {apiUrl:evoUrl, apiKey, instancia:inst, bridgeUrl:bridge, secret};
  localStorage.setItem(EVO_CFG_KEY, JSON.stringify(cfg));
  conectarSSE(bridge, secret);
  setWppStatus(true,'Conectado');
  notify('WhatsApp conectado! SSE ativo.','success');

  const el = document.getElementById('webhook-url-display');
  if(el) el.textContent = bridge+'/webhook/wpp  (header x-secret: '+secret+')';
}

function preencherCamposWpp(){
  const cfg = JSON.parse(localStorage.getItem(EVO_CFG_KEY)||'{}');
  const set = (id, val)=>{ const e=document.getElementById(id); if(e&&val) e.value=val; };
  set('wpp-url',    cfg.apiUrl);
  set('wpp-apikey', cfg.apiKey);
  set('wpp-inst',   cfg.instancia);
  set('wpp-bridge', cfg.bridgeUrl);
  set('wpp-secret', cfg.secret);
  if(cfg.bridgeUrl){
    const el = document.getElementById('webhook-url-display');
    if(el) el.textContent = cfg.bridgeUrl+'/webhook/wpp  (header x-secret: '+(cfg.secret||'FleetPro2025')+')';
    conectarSSE(cfg.bridgeUrl, cfg.secret||'FleetPro2025');
    setWppStatus(true,'Conectado');
    // Checa status SARA do chat ativo ao recarregar
    setTimeout(()=>{
      if(activeChatId){
        const c = allClientes.find(x=>x.id===activeChatId);
        if(c?.telefone) _checarStatusSara(c.telefone);
      }
    }, 1500);
  }
  const pers = JSON.parse(localStorage.getItem('fp_personalizacao')||'{}');
  if(pers.nome){ const e=document.getElementById('wpp-nome-locadora'); if(e) e.value=pers.nome; }
  if(pers.assin){ const e=document.getElementById('wpp-assinatura'); if(e) e.value=pers.assin; }
}

function salvarPersonalizacao(){
  const nome  = document.getElementById('wpp-nome-locadora')?.value||'FleetPro Locadora';
  const assin = document.getElementById('wpp-assinatura')?.value||'';
  localStorage.setItem('fp_personalizacao', JSON.stringify({nome, assin}));
  notify('Personalização salva!','success');
}

// ── DB ──
async function carregarMsgsDB(clienteId){
  if(!sb) return [];
  const isNumero = clienteId && !clienteId.includes('-');
  if(isNumero){
    const numLimpo = clienteId.replace(/\D/g,'');
    const num11 = numLimpo.slice(-11);
    const num13 = numLimpo.length >= 13 ? numLimpo.slice(-13) : num11;
    const {data} = await sb.from('wpp_mensagens')
      .select('*').or('numero.ilike.%'+num11+',numero.ilike.%'+num13)
      .order('created_at',{ascending:true}).limit(200);
    return data||[];
  }
  const {data:byId} = await sb.from('wpp_mensagens')
    .select('*').eq('cliente_id',clienteId)
    .order('created_at',{ascending:true}).limit(200);
  const cliente = allClientes.find(c=>c.id===clienteId);
  let byNumero = [];
  if(cliente?.telefone){
    const numLimpo = cliente.telefone.replace(/\D/g,'').slice(-11);
    const {data:d} = await sb.from('wpp_mensagens')
      .select('*').ilike('numero','%'+numLimpo)
      .order('created_at',{ascending:true}).limit(200);
    byNumero = (d||[]).filter(m=>!m.cliente_id || m.cliente_id!==clienteId);
    const semCliente = byNumero.filter(m=>!m.cliente_id).map(m=>m.id);
    if(semCliente.length>0)
      sb.from('wpp_mensagens').update({cliente_id:clienteId}).in('id',semCliente).then(()=>{});
  }
  const vistos = new Set();
  return [...(byId||[]),...byNumero]
    .filter(m=>{ if(vistos.has(m.id)) return false; vistos.add(m.id); return true; })
    .sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
}

async function salvarMsgDB(clienteId, numero, texto, tipo, direcao, mediaUrl){
  if(!sb) return;
  try{
    await sb.from('wpp_mensagens').insert({
      cliente_id:clienteId||null, numero, texto, tipo, direcao,
      media_url:mediaUrl||null, created_at:new Date().toISOString()
    });
  }catch(e){ console.warn('salvarMsgDB:', e.message); }
}

// ── ENVIO TEXTO ──
async function evoSendText(telefone, texto){
  const cfg = JSON.parse(localStorage.getItem(EVO_CFG_KEY)||'{}');
  if(!cfg.apiUrl||!cfg.apiKey) throw new Error('Evolution API não configurada. Configure no painel ⚙');
  const num = fmtPhone(telefone);
  const r = await fetch(cfg.apiUrl+'/message/sendText/'+cfg.instancia,{
    method:'POST',
    headers:{'apikey':cfg.apiKey,'Content-Type':'application/json'},
    body:JSON.stringify({number:num, text:texto, delay:500})
  });
  if(!r.ok){ const t=await r.text(); throw new Error(t); }
  return await r.json();
}

// ── RENDER ──
function renderMsgItem(m){
  const out    = m.direcao==='saida' || m.out===true;
  const isSara = out && ((m.nomeCliente||'').includes('SARA') || (m.nomeCliente||'').includes('🤖'));
  const tipo   = m.tipo||'text';
  const mediaUrl  = m.media_url||m.mediaUrl||m.media_url_local||null;
  const t    = m.created_at
    ? new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    : (m.time||'');
  let corpo = '';
  if(tipo==='image'||tipo==='imageMessage'){
    if(mediaUrl){
      corpo = '<img src="'+mediaUrl+'" style="max-width:220px;border-radius:8px;display:block;margin-bottom:4px;cursor:pointer" onclick="window.open(\''+mediaUrl+'\',\'_blank\')">';
      if(m.texto) corpo += '<div style="font-size:12px">'+m.texto+'</div>';
    } else {
      corpo = '<div style="font-size:12px;color:var(--muted)">🖼️ Imagem '+(m.texto||'')+'</div>';
    }
  } else if(tipo==='audio'||tipo==='ptt'||tipo==='audioMessage'||tipo==='pttMessage'){
    if(mediaUrl){
      corpo = '<audio controls style="max-width:220px;min-width:160px"><source src="'+mediaUrl+'">Seu navegador nao suporta audio.</audio>';
    } else {
      corpo = '<div style="font-size:12px;color:var(--muted)">🎵 Áudio '+(m.texto||'')+'</div>';
    }
  } else if(tipo==='video'||tipo==='videoMessage'){
    if(mediaUrl){
      corpo = '<video controls style="max-width:280px;border-radius:8px;display:block"><source src="'+mediaUrl+'">Seu navegador não suporta vídeo.</video>';
      if(m.texto && m.texto!=='Vídeo') corpo += '<div style="font-size:12px;margin-top:4px">'+m.texto+'</div>';
    } else {
      corpo = '<div style="font-size:12px;color:var(--muted)">🎥 Vídeo '+(m.texto||'')+'</div>';
    }
  } else if(tipo==='document'||tipo==='documentMessage'){
    if(mediaUrl){
      corpo = '<div>📎 <a href="'+mediaUrl+'" target="_blank" style="color:var(--accent)">'+(m.texto||'Abrir documento')+'</a></div>';
    } else {
      corpo = '<div style="font-size:12px;color:var(--muted)">📎 Documento '+(m.texto||'')+'</div>';
    }
  } else {
    const txt = (m.texto||m.text||'').replace(/</g,'&lt;').replace(/\n/g,'<br>');
    corpo = '<div style="white-space:pre-wrap">'+txt+'</div>';
  }
  const saraBadge = isSara ? '<div style="font-size:9px;color:#f0c040;font-weight:700;margin-bottom:3px;letter-spacing:.5px">🤖 SARA</div>' : '';
  const bgSara = isSara ? 'background:rgba(240,192,64,.12);border:1px solid rgba(240,192,64,.2);' : '';
  return '<div class="msg '+(out?'msg-out':'msg-in')+'" style="'+bgSara+'">'+saraBadge+corpo+'<div class="msg-time">'+t+'</div></div>';
}

async function renderChatMsgs(cid){
  const area = document.getElementById('chat-msgs');
  if(!area) return;
  const memMsgs = chatMsgs[cid]||[];
  if(memMsgs.length){
    area.innerHTML = memMsgs.map(renderMsgItem).join('');
    area.scrollTop = area.scrollHeight;
  }
  if(!memMsgs.length){
    area.innerHTML = '<div style="text-align:center;font-size:12px;color:var(--muted2);padding:20px">⏳ Buscando mensagens...</div>';
  }
  try{
    const dbMsgs = await carregarMsgsDB(cid);
    if(dbMsgs.length > 0){
      if(!chatMsgs[cid]) chatMsgs[cid] = [];
      dbMsgs.forEach(m=>{
        const jatem = chatMsgs[cid].some(x=>x.id===m.id||(x.created_at===m.created_at&&x.texto===m.texto));
        if(!jatem) chatMsgs[cid].push(m);
      });
    }
    const visto = new Set(dbMsgs.map(m=>m.created_at+'|'+(m.texto||'')));
    const extras = memMsgs.filter(m=>!visto.has((m.created_at||'')+'|'+(m.texto||m.text||'')));
    const todas = [...dbMsgs,...extras].sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0));
    area.innerHTML = todas.length
      ? todas.map(renderMsgItem).join('')
      : '<div data-placeholder style="text-align:center;font-size:12px;color:var(--muted2);padding:30px">Sem mensagens ainda.</div>';
  }catch(e){
    console.error('renderChatMsgs erro:', e);
    if(!memMsgs.length)
      area.innerHTML = '<div style="text-align:center;font-size:12px;color:var(--muted2);padding:30px">Sem mensagens ainda.</div>';
  }
  area.scrollTop = area.scrollHeight;
}

function renderChatContacts(){
  if(!allClientes || allClientes.length === 0) return;
  const s = (document.getElementById('chat-search')?.value||'').toLowerCase();
  const numsCadastrados = new Set(allClientes.map(c=>(c.telefone||'').replace(/\D/g,'').slice(-11)));
  const desconhecidosMap = {};
  Object.keys(chatMsgs).forEach(k=>{
    if(!k.includes('-')){
      const num = k.replace(/\D/g,'').slice(-11);
      if(!numsCadastrados.has(num) && chatMsgs[k]?.length > 0 && !desconhecidosMap[num])
        desconhecidosMap[num] = {id:k, nome:'📱 '+k, telefone:k, _desconhecido:true};
    }
  });
  (window._wppNumsDB||[]).forEach(num=>{
    const numL = num.replace(/\D/g,'').slice(-11);
    if(!numsCadastrados.has(numL) && !desconhecidosMap[numL])
      desconhecidosMap[numL] = {id:num, nome:'📱 '+num, telefone:num, _desconhecido:true};
  });
  const desconhecidos = Object.values(desconhecidosMap);
  const clientes = [...allClientes, ...desconhecidos].filter(c=>!s||c.nome.toLowerCase().includes(s)||(c.telefone||'').includes(s));
  const unread = getUnread();
  document.getElementById('chat-contacts').innerHTML = clientes.map(c=>{
    const ini = (c.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const lastMsg = (chatMsgs[c.id]||[]).slice(-1)[0];
    const preview = lastMsg?.texto||lastMsg?.text||(lastMsg?.tipo==='audio'||lastMsg?.tipo==='audioMessage'?'🎵 Áudio':lastMsg?.tipo==='image'||lastMsg?.tipo==='imageMessage'?'🖼️ Imagem':lastMsg?.tipo==='document'?'📎 Documento':'Toque para abrir');
    const nl = unread[c.id]||0;
    const badge = nl>0?`<div style="min-width:20px;height:20px;background:#22c55e;color:#fff;border-radius:99px;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 5px">${nl}</div>`:'';
    const ativo = activeChatId===c.id?'active':'';
    return `<div class="chat-item ${ativo}" onclick="abrirChat('${c.id}')"><div class="cavatar">${ini}</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:${nl>0?700:500}">${c.nome}</div><div style="font-size:11px;color:${nl>0?'var(--text)':'var(--muted)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px">${preview}</div></div>${badge}</div>`;
  }).join('')||'<div style="padding:16px;font-size:12px;color:var(--muted)">Sem contatos</div>';
}
function filtrarContatos(){ renderChatContacts(); }

function abrirChat(cid){
  activeChatId = cid;
  clearUnread(cid);
  atualizarBadgeNotif();
  const c = allClientes.find(x=>x.id===cid);
  if(!c){
    document.getElementById('chat-av').textContent = '?';
    document.getElementById('chat-av').style.background = 'rgba(139,139,139,0.2)';
    document.getElementById('chat-av').style.color = 'var(--muted)';
    document.getElementById('chat-name').textContent = 'Desconhecido';
    document.getElementById('chat-info').textContent = cid+' · Clique em Cadastrar para registrar';
    const btnCad = document.getElementById('btn-cadastrar-chat');
    if(btnCad) btnCad.style.display = 'flex';
    renderChatMsgs(cid);
    renderChatContacts();
    return;
  }
  const ini = (c.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  document.getElementById('chat-av').textContent = ini;
  document.getElementById('chat-av').style.background = 'rgba(245,166,35,.12)';
  document.getElementById('chat-av').style.color = 'var(--accent)';
  document.getElementById('chat-name').textContent = c.nome;
  document.getElementById('chat-info').textContent = c.telefone ? '📱 '+c.telefone : 'Sem telefone';
  const btnCad = document.getElementById('btn-cadastrar-chat');
  if(btnCad) btnCad.style.display = 'none';
  // Botão SARA
  _renderBtnSara(c.telefone);
  renderChatMsgs(cid);
  renderChatContacts();
}

// ── ENVIAR MENSAGEM ──
function adicionarMsgLocal(cid, texto, tipo, mediaUrl){
  const msgObj = {
    texto, tipo, direcao:'saida', out:true,
    media_url: mediaUrl||null,
    media_url_local: mediaUrl||null,
    created_at: new Date().toISOString()
  };
  if(!chatMsgs[cid]) chatMsgs[cid] = [];
  chatMsgs[cid].push(msgObj);
  const area = document.getElementById('chat-msgs');
  if(area){
    const ph = area.querySelector('[data-placeholder]');
    if(ph) ph.remove();
    area.insertAdjacentHTML('beforeend', renderMsgItem(msgObj));
    area.scrollTop = area.scrollHeight;
  }
  renderChatContacts();
}

async function sendMsg(){
  if(!activeChatId){ notify('Selecione um contato','error'); return; }
  if(_mediaFile){
    const c = allClientes.find(x=>x.id===activeChatId);
    await _enviarMidiaWpp(c);
    return;
  }
  const inp = document.getElementById('chat-msg-input');
  const texto = inp.value.trim();
  if(!texto) return;
  const c = allClientes.find(x=>x.id===activeChatId);
  const telefone = c?.telefone || (activeChatId.includes('-') ? null : activeChatId);
  if(!telefone){ notify('Cliente sem telefone cadastrado','error'); return; }
  adicionarMsgLocal(activeChatId, texto, 'text', null);
  inp.value = '';
  try{
    await evoSendText(telefone, texto);
    await salvarMsgDB(c?.id||null, telefone, texto, 'text', 'saida', null);
  }catch(e){
    notify('Erro ao enviar: '+e.message,'error');
  }
}

// ── ENVIAR MÍDIA ──
let _mediaFile = null, _mediaType = '', _mediaPreviewUrl = null;

function enviarArquivo(input, tipo){
  const file = input.files[0]; if(!file) return;
  _mediaFile = file; _mediaType = tipo;
  if(_mediaPreviewUrl) URL.revokeObjectURL(_mediaPreviewUrl);
  _mediaPreviewUrl = URL.createObjectURL(file);
  const prev = document.getElementById('media-preview');
  const txt  = document.getElementById('media-preview-txt');
  if(prev && txt){
    prev.style.display = 'flex';
    txt.textContent = (tipo==='image'?'🖼️':tipo==='audio'?'🎵':'📎')+' '+file.name+' ('+Math.round(file.size/1024)+'KB) — clique Enviar';
  }
  input.value = '';
}

function cancelarMidia(){
  if(_mediaPreviewUrl){ URL.revokeObjectURL(_mediaPreviewUrl); _mediaPreviewUrl = null; }
  _mediaFile = null; _mediaType = '';
  const prev = document.getElementById('media-preview');
  if(prev) prev.style.display = 'none';
  const txt = document.getElementById('media-preview-txt');
  if(txt) txt.textContent = '';
}

async function _enviarMidiaWpp(c){
  const telefone = c?.telefone || (activeChatId && !activeChatId.includes('-') ? activeChatId : null);
  if(!telefone){ notify('Cliente sem telefone','error'); return; }
  const cfg = JSON.parse(localStorage.getItem(EVO_CFG_KEY)||'{}');
  if(!cfg.apiUrl||!cfg.apiKey){ notify('Evolution API não configurada','error'); return; }
  const fileName = _mediaFile.name;
  const tipo     = _mediaType;
  const fileRef  = _mediaFile;
  const localUrl = _mediaPreviewUrl;
  notify('Enviando...','success');
  try{
    let base64 = '';
    if(tipo==='image'){
      base64 = await _comprimirImagem(fileRef, 800);
    } else {
      base64 = await _lerBase64(fileRef);
    }
    const num = fmtPhone(telefone);
    let endpoint = '', body = {};
    if(tipo==='image'){
      endpoint = 'sendMedia';
      body = {number:num, mediatype:'image', media:base64, caption:''};
    } else if(tipo==='audio'){
      endpoint = 'sendWhatsAppAudio';
      body = {number:num, audio:base64, encoding:true};
    } else {
      endpoint = 'sendMedia';
      body = {number:num, mediatype:'document', media:base64, fileName, caption:''};
    }
    const r = await fetch(cfg.apiUrl+'/message/'+endpoint+'/'+cfg.instancia,{
      method:'POST',
      headers:{'apikey':cfg.apiKey,'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if(!r.ok){
      const t = await r.text();
      let msg = t;
      try{ msg = JSON.parse(t)?.message||t; }catch(_){}
      throw new Error(msg);
    }
    adicionarMsgLocal(activeChatId, fileName||'Arquivo', tipo, localUrl);
    await salvarMsgDB(c?.id||null, telefone, fileName||'Arquivo', tipo, 'saida', null);
    cancelarMidia();
    notify('Arquivo enviado ✓','success');
  }catch(err){
    notify('Erro: '+err.message,'error');
    cancelarMidia();
  }
}

function _lerBase64(file){
  return new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload  = e => res(e.target.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function _comprimirImagem(file, maxWidth=800){
  return new Promise((res,rej)=>{
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = ()=>{
      URL.revokeObjectURL(objUrl);
      const scale = Math.min(1, maxWidth/img.width);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      res(canvas.toDataURL('image/jpeg', 0.75).split(',')[1]);
    };
    img.onerror = rej;
    img.src = objUrl;
  });
}

// ── GRAVAÇÃO DE ÁUDIO ──
let mediaRecorder = null, audioChunks = [], _streamAtivo = null;

async function iniciarGravacao(e){
  if(e) e.preventDefault();
  if(mediaRecorder && mediaRecorder.state==='recording') return;
  const btn = document.getElementById('btn-mic');
  try{
    _streamAtivo = await navigator.mediaDevices.getUserMedia({audio:true});
    audioChunks = [];
    mediaRecorder = new MediaRecorder(_streamAtivo);
    mediaRecorder.ondataavailable = ev=>{ if(ev.data.size>0) audioChunks.push(ev.data); };
    mediaRecorder.onstop = ()=>{
      if(_streamAtivo){ _streamAtivo.getTracks().forEach(t=>t.stop()); _streamAtivo=null; }
      if(audioChunks.length===0){ resetMicBtn(); return; }
      const blob = new Blob(audioChunks,{type:'audio/ogg;codecs=opus'});
      if(blob.size < 500){ notify('Áudio muito curto — segure mais tempo','error'); resetMicBtn(); return; }
      _mediaFile = new File([blob],'audio_'+Date.now()+'.ogg',{type:'audio/ogg'});
      _mediaType = 'audio';
      if(_mediaPreviewUrl) URL.revokeObjectURL(_mediaPreviewUrl);
      _mediaPreviewUrl = URL.createObjectURL(_mediaFile);
      resetMicBtn();
      const c = allClientes.find(x=>x.id===activeChatId);
      _enviarMidiaWpp(c);
    };
    mediaRecorder.start();
    if(btn){ btn.textContent='🔴'; btn.style.background='rgba(239,68,68,.2)'; btn.style.borderColor='var(--red)'; btn.style.color='var(--red)'; }
    notify('Gravando... Solte para enviar 🎙️','success');
  }catch(err){
    notify('Erro no microfone: '+err.message,'error');
    resetMicBtn();
  }
}

function pararGravacao(){
  if(mediaRecorder && mediaRecorder.state==='recording') mediaRecorder.stop();
}

function pararGravacaoSemEnviar(){
  if(mediaRecorder && mediaRecorder.state==='recording'){
    audioChunks = [];
    mediaRecorder.stop();
  }
  resetMicBtn();
}

function resetMicBtn(){
  const btn = document.getElementById('btn-mic');
  if(btn){ btn.textContent='🎙️'; btn.style.background='var(--bg3)'; btn.style.borderColor='var(--border2)'; btn.style.color=''; }
}

// ── CONTRATOS ──
async function enviarContratoWpp(){
  if(!activeChatId){ notify('Selecione um contato primeiro','error'); return; }
  const c = allClientes.find(x=>x.id===activeChatId);
  if(!c){ notify('Cadastre o cliente para enviar contrato','error'); return; }
  if(!c.telefone){ notify('Cliente sem telefone cadastrado','error'); return; }
  const {data:locs} = await sb.from('locacoes')
    .select('*,veiculos(marca,modelo,placa)')
    .eq('cliente_id', c.id)
    .order('created_at',{ascending:false})
    .limit(1);
  const loc = locs?.[0];
  let texto = '📄 *CONTRATO DE LOCAÇÃO — FleetPro*\n\n';
  texto += `👤 *Cliente:* ${c.nome}\n📋 *CPF:* ${c.cpf}\n`;
  if(loc){
    const dias = Math.ceil((new Date(loc.data_fim)-new Date(loc.data_inicio))/86400000);
    texto += `\n🚗 *Veículo:* ${loc.veiculos?.marca} ${loc.veiculos?.modelo} — ${loc.veiculos?.placa}\n`;
    texto += `📅 *Período:* ${fmtData(loc.data_inicio)} a ${fmtData(loc.data_fim)} (${dias} dias)\n`;
    texto += `💰 *Diária:* R$ ${(loc.diaria||0).toFixed(2)} · *Total:* R$ ${(loc.total||0).toFixed(2)}\n`;
    texto += `\n✅ Contrato registrado no sistema FleetPro.\n`;
  }
  texto += `\n_FleetPro Locadora 🚗🏍️_`;
  try{
    await evoSendText(c.telefone, texto);
    await salvarMsgDB(activeChatId, c.telefone, texto, 'text', 'saida', null);
    adicionarMsgLocal(activeChatId, texto, 'text', null);
    notify('Contrato enviado ✓','success');
  }catch(e){
    notify('Erro: '+e.message,'error');
  }
}

// ── PERFIL CLIENTE — função em clientes.js ──

// ── BLOQUEIO DA SARA ──
const _saraBloqueadas = new Set(); // números bloqueados localmente

function _atualizarBotaoSara(numero, bloqueada){
  const numLimpo = (numero||'').replace(/\D/g,'').slice(-11);
  if(bloqueada) _saraBloqueadas.add(numLimpo);
  else _saraBloqueadas.delete(numLimpo);
  // Atualiza botão se o chat desse número estiver aberto
  const btn = document.getElementById('btn-sara-toggle');
  if(!btn) return;
  const ativo = activeChatId;
  const c = allClientes.find(x=>x.id===ativo);
  const telAtivo = (c?.telefone||activeChatId||'').replace(/\D/g,'').slice(-11);
  if(telAtivo === numLimpo) _renderBotaoSara(bloqueada);
}

function _renderBotaoSara(bloqueada){
  const btn = document.getElementById('btn-sara-toggle');
  if(!btn) return;
  if(bloqueada){
    btn.textContent = '▶️ Liberar SARA';
    btn.style.background = 'rgba(22,163,74,.15)';
    btn.style.color = '#16a34a';
    btn.style.borderColor = 'rgba(22,163,74,.3)';
  } else {
    btn.textContent = '🤖 Pausar SARA';
    btn.style.background = 'rgba(139,92,246,.15)';
    btn.style.color = '#8b5cf6';
    btn.style.borderColor = 'rgba(139,92,246,.3)';
  }
}

async function toggleSara(){
  if(!activeChatId) return;
  const c = allClientes.find(x=>x.id===activeChatId);
  const telefone = c?.telefone || (activeChatId.includes('-') ? null : activeChatId);
  if(!telefone){ notify('Cliente sem telefone','error'); return; }
  const numLimpo = telefone.replace(/\D/g,'').slice(-11);
  const bloqueada = _saraBloqueadas.has(numLimpo);
  const cfg = JSON.parse(localStorage.getItem('fp_evo_cfg')||'{}');
  const endpoint = bloqueada ? '/unblock-sara' : '/block-sara';
  try{
    const r = await fetch((cfg.bridgeUrl||'').replace(/\/$/,'')+endpoint, {
      method:'POST',
      headers:{'Content-Type':'application/json','x-secret':'FleetPro2025'},
      body: JSON.stringify({ numero: numLimpo })
    });
    const data = await r.json();
    if(data.ok){
      if(bloqueada){ _saraBloqueadas.delete(numLimpo); _renderBotaoSara(false); notify('SARA liberada!','success'); }
      else { _saraBloqueadas.add(numLimpo); _renderBotaoSara(true); notify('SARA pausada — atendente assumiu!','success'); }
    }
  }catch(e){ notify('Erro: '+e.message,'error'); }
}

async function _checarStatusSara(telefone){
  const numLimpo = (telefone||'').replace(/\D/g,'').slice(-11);
  const cfg = JSON.parse(localStorage.getItem('fp_evo_cfg')||'{}');
  try{
    const r = await fetch((cfg.bridgeUrl||'').replace(/\/$/,'')+'/sara-status/'+numLimpo+'?secret=FleetPro2025');
    const data = await r.json();
    if(data.bloqueada) _saraBloqueadas.add(numLimpo);
    else _saraBloqueadas.delete(numLimpo);
    _renderBotaoSara(data.bloqueada);
  }catch(_){}
}

// ── CADASTRAR CLIENTE PELO CHAT ──
function abrirCadastroClienteChat(){
  if(!activeChatId) return;
  const num = activeChatId.includes('-') ? '' : activeChatId;
  const tel = document.getElementById('mc-tel');
  if(tel) tel.value = num.replace(/^55/,'');
  window._afterSalvarCliente = async ()=>{
    await loadClientes();
    renderChatContacts();
    const c = allClientes.find(x=>(x.telefone||'').replace(/\D/g,'').slice(-11) === num.slice(-11));
    if(c){ activeChatId = c.id; abrirChat(c.id); }
  };
  openModal('cliente');
}

function setMsg(t){ const i=document.getElementById('chat-msg-input'); if(i){i.value=t;i.focus();} }

// Reconexão ao voltar para a aba
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState !== 'visible'){
    const pageAtiva = document.querySelector('.page.active')?.id?.replace('page-','');
    if(pageAtiva) sessionStorage.setItem('fp_last_page', pageAtiva);
    if(activeChatId) sessionStorage.setItem('fp_last_chat', activeChatId);
    return;
  }
  window.location.reload();
});
