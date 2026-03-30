// chat.js — Chat WhatsApp, SSE, usuários e investidores

// ══ CONFIG ══
let wppCfg = {};
let wppOk = false;
let sseSource = null;
const EVO_CFG_KEY = 'fp_evo_cfg';

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

  const msgObj = {
    texto:      msg.texto||'',
    tipo:       msg.tipoMsg||msg.tipo||'text',
    direcao:    'entrada',
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

  if(allClientes && allClientes.length > 0) renderChatContacts();
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
  const out  = m.direcao==='saida' || m.out===true;
  const tipo = m.tipo||'text';
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
  return '<div class="msg '+(out?'msg-out':'msg-in')+'">'+corpo+'<div class="msg-time">'+t+'</div></div>';
}

async function renderChatMsgs(cid){
  const area = document.getElementById('chat-msgs');
  if(!area) return;
  const memMsgs = chatMsgs[cid]||[];
  // Mostra memória imediatamente se tiver
  if(memMsgs.length){
    area.innerHTML = memMsgs.map(renderMsgItem).join('');
    area.scrollTop = area.scrollHeight;
  }
  // Busca banco SEMPRE — sem mostrar "Carregando" se já tem msgs na memória
  if(!memMsgs.length){
    area.innerHTML = '<div style="text-align:center;font-size:12px;color:var(--muted2);padding:20px">⏳ Buscando mensagens...</div>';
  }
  try{
    const dbMsgs = await carregarMsgsDB(cid);
    // Atualiza chatMsgs com dados do banco para próximas visitas
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
  document.getElementById('chat-contacts').innerHTML = clientes.map(c=>{
    const ini = (c.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const lastMsg = (chatMsgs[c.id]||[]).slice(-1)[0];
    const preview = lastMsg?.texto||lastMsg?.text||(lastMsg?.tipo==='audio'||lastMsg?.tipo==='audioMessage'?'🎵 Áudio':lastMsg?.tipo==='image'||lastMsg?.tipo==='imageMessage'?'🖼️ Imagem':lastMsg?.tipo==='document'?'📎 Documento':'Toque para abrir');
    return '<div class="chat-item '+(activeChatId===c.id?'active':'')+'" onclick="abrirChat(\''+c.id+'\')">'
      +'<div class="cavatar">'+ini+'</div>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:13px;font-weight:500">'+c.nome+'</div>'
        +'<div style="font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px">'+preview+'</div>'
      +'</div>'
    +'</div>';
  }).join('')||'<div style="padding:16px;font-size:12px;color:var(--muted)">Sem contatos</div>';
}

function filtrarContatos(){ renderChatContacts(); }

function abrirChat(cid){
  activeChatId = cid;
  const c = allClientes.find(x=>x.id===cid);
  if(!c){
    document.getElementById('chat-av').textContent = '?';
    document.getElementById('chat-av').style.background = 'rgba(139,139,139,0.2)';
    document.getElementById('chat-av').style.color = 'var(--muted)';
    document.getElementById('chat-name').textContent = 'Desconhecido';
    document.getElementById('chat-info').textContent = cid+' · Clique em Perfil para cadastrar';
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

// ── PERFIL CLIENTE ──
async function verPerfilCliente(){
  if(!activeChatId){ notify('Selecione um contato','error'); return; }
  const c = allClientes.find(x=>x.id===activeChatId);
  if(!c){ notify('Cadastre o cliente para ver o perfil','error'); return; }
  document.getElementById('perfil-cli-titulo').textContent = '👤 '+c.nome;
  const body = document.getElementById('perfil-cli-body');
  body.innerHTML = '<div style="padding:16px;color:var(--muted2);font-size:13px">⏳ Carregando...</div>';
  document.getElementById('m-perfil-cliente').classList.add('show');
  const {data:locs} = await sb.from('locacoes')
    .select('*,veiculos(marca,modelo,placa)')
    .eq('cliente_id',c.id)
    .order('created_at',{ascending:false});
  const locsHtml = (locs||[]).length ? (locs||[]).map(l=>{
    const dias = l.data_inicio&&l.data_fim ? Math.ceil((new Date(l.data_fim)-new Date(l.data_inicio))/86400000) : '?';
    const badge = l.status==='ativa'?'<span class="badge badge-green">Ativa</span>':l.status==='encerrada'?'<span class="badge badge-blue">Encerrada</span>':'<span class="badge badge-red">Cancelada</span>';
    return `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-weight:600;font-size:13px">🚗 ${l.veiculos?.marca||''} ${l.veiculos?.modelo||''} — ${l.veiculos?.placa||''}</span>${badge}
      </div>
      <div style="font-size:12px;color:var(--muted)">📅 ${fmtData(l.data_inicio)} a ${fmtData(l.data_fim)} · ${dias} dias</div>
      <div style="font-size:12px;color:var(--muted)">💰 R$ ${(l.diaria||0).toFixed(2)}/dia · Total: R$ ${(l.total||0).toFixed(2)}</div>
    </div>`;
  }).join('') : '<div style="color:var(--muted2);font-size:13px;padding:8px 0">Nenhum contrato ainda.</div>';
  body.innerHTML = `
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><div style="font-size:11px;color:var(--muted2)">TELEFONE</div><div style="font-size:13px">${c.telefone||'—'}</div></div>
      <div><div style="font-size:11px;color:var(--muted2)">CPF</div><div style="font-size:13px">${c.cpf||'—'}</div></div>
      <div><div style="font-size:11px;color:var(--muted2)">EMAIL</div><div style="font-size:13px">${c.email||'—'}</div></div>
      <div><div style="font-size:11px;color:var(--muted2)">CNH</div><div style="font-size:13px">${c.cnh||'—'}</div></div>
      ${c.endereco?`<div style="grid-column:1/-1"><div style="font-size:11px;color:var(--muted2)">ENDEREÇO</div><div style="font-size:13px">${c.endereco}</div></div>`:''}
    </div>
    <div style="padding:16px 20px">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:12px">HISTÓRICO DE LOCAÇÕES (${(locs||[]).length})</div>
      ${locsHtml}
    </div>
    <div style="padding:0 20px 16px;display:flex;gap:8px">
      <button class="btn btn-ghost" style="flex:1" onclick="editarCliente('${c.id}');closeModal('perfil-cliente')">✏️ Editar</button>
      <button class="btn btn-primary" style="flex:1" onclick="closeModal('perfil-cliente')">💬 Fechar</button>
    </div>`;
}

function setMsg(t){ const i=document.getElementById('chat-msg-input'); if(i){i.value=t;i.focus();} }

// ══ USUÁRIOS ══
async function renderUsuarios(){
  const {data} = await sb.from('perfis').select('*').order('created_at');
  allPerfis = data||[];
  document.getElementById('usuarios-list').innerHTML = allPerfis.map(u=>{
    const isMe = u.id===currentUser?.id;
    const rBadge = u.perfil==='admin'?'badge-yellow':u.perfil==='atendente'?'badge-blue':'badge-purple';
    const ini = (u.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    return `<div class="user-card">
      <div class="cavatar" style="width:42px;height:42px;font-size:14px;background:rgba(245,166,35,.12);color:var(--accent)">${ini}</div>
      <div class="uc-info">
        <div class="uc-name">${u.nome}${isMe?' <span style="font-size:10px;color:var(--muted)">(você)</span>':''}</div>
        <div class="uc-email">${u.email}</div>
      </div>
      <div class="uc-actions" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        ${!isMe?`
          <select onchange="alterarPerfil('${u.id}',this.value)" style="font-size:12px;padding:5px 8px;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:6px;cursor:pointer">
            <option value="atendente" ${u.perfil==='atendente'?'selected':''}>🧑‍💼 Atendente</option>
            <option value="admin" ${u.perfil==='admin'?'selected':''}>👑 Admin</option>
            <option value="investidor" ${u.perfil==='investidor'?'selected':''}>📈 Investidor</option>
          </select>
          <button onclick="excluirUsuario('${u.id}','${u.nome.replace(/'/g,"\\'")}','${u.email}')" style="font-size:11px;padding:5px 10px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--red);border-radius:6px;cursor:pointer">🗑️ Excluir</button>
        `:`<span class="badge ${rBadge}">${ROLE_LABELS[u.perfil]}</span><span style="font-size:11px;color:var(--muted2)">seu perfil</span>`}
      </div>
    </div>`;
  }).join('')||'<p style="color:var(--muted2)">Nenhum usuário encontrado.</p>';
}

async function alterarPerfil(uid, novoPerfil){
  const {error} = await sb.from('perfis').update({perfil:novoPerfil}).eq('id',uid);
  if(error){notify('Erro: '+error.message,'error');return;}
  notify('Perfil atualizado!','success'); renderUsuarios();
}

async function excluirUsuario(uid, nome, email){
  if(!confirm(`Excluir o usuário "${nome}" (${email})?

Essa ação não pode ser desfeita.`)) return;
  try{
    // Remove da tabela perfis
    const {error} = await sb.from('perfis').delete().eq('id',uid);
    if(error) throw error;
    notify(`Usuário ${nome} removido do sistema.`,'success');
    renderUsuarios();
  }catch(e){
    notify('Erro ao excluir: '+e.message,'error');
  }
}

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
