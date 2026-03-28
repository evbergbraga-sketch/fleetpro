function renderMsgItem(m){
const out  = m.direcao==='saida' || m.out===true;
const tipo = m.tipo||'text';
  const url  = m.media_url||m.mediaUrl||null;
  const url  = m.media_url||m.mediaUrl||m.media_url_local||null;
const t    = m.created_at
? new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
: (m.time||'');
let corpo = '';
  if(tipo==='image'){
  if(tipo==='image'||tipo==='imageMessage'){
if(url){
      corpo = '<img src="'+url+'" style="max-width:220px;border-radius:8px;display:block;margin-bottom:4px">';
      corpo = '<img src="'+url+'" style="max-width:220px;border-radius:8px;display:block;margin-bottom:4px;cursor:pointer" onclick="window.open(\''+url+'\',\'_blank\')">';
if(m.texto) corpo += '<div style="font-size:12px">'+m.texto+'</div>';
} else {
      corpo = '<div style="font-size:12px;color:var(--muted)">[Imagem] '+(m.texto||'')+'</div>';
      corpo = '<div style="font-size:12px;color:var(--muted)">🖼️ Imagem '+(m.texto||'')+'</div>';
}
} else if(tipo==='audio'||tipo==='ptt'||tipo==='audioMessage'||tipo==='pttMessage'){
if(url){
corpo = '<audio controls style="max-width:220px;min-width:160px"><source src="'+url+'">Seu navegador nao suporta audio.</audio>';
} else {
      corpo = '<div style="font-size:12px;color:var(--muted)">[Audio] '+(m.texto||'')+'</div>';
      corpo = '<div style="font-size:12px;color:var(--muted)">🎵 Áudio '+(m.texto||'')+'</div>';
}
  } else if(tipo==='document'){
  } else if(tipo==='document'||tipo==='documentMessage'){
if(url){
      corpo = '<div>Documento: <a href="'+url+'" target="_blank" style="color:var(--accent)">'+(m.texto||'Abrir')+'</a></div>';
      corpo = '<div>📎 <a href="'+url+'" target="_blank" style="color:var(--accent)">'+(m.texto||'Abrir documento')+'</a></div>';
} else {
      corpo = '<div style="font-size:12px;color:var(--muted)">[Documento] '+(m.texto||'')+'</div>';
      corpo = '<div style="font-size:12px;color:var(--muted)">📎 Documento '+(m.texto||'')+'</div>';
}
} else {
const txt = (m.texto||m.text||'').replace(/</g,'&lt;').replace(/\n/g,'<br>');
@@ -234,7 +234,6 @@ function renderMsgItem(m){
return '<div class="msg '+(out?'msg-out':'msg-in')+'">'+corpo+'<div class="msg-time">'+t+'</div></div>';
}


async function renderChatMsgs(cid){
const area = document.getElementById('chat-msgs');
if(!area) return;
@@ -282,7 +281,7 @@ function renderChatContacts(){
document.getElementById('chat-contacts').innerHTML = clientes.map(c=>{
const ini = (c.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const lastMsg = (chatMsgs[c.id]||[]).slice(-1)[0];
    const preview = lastMsg?.texto||lastMsg?.text||(lastMsg?.tipo==='audio'?'🎵 Áudio':lastMsg?.tipo==='image'?'🖼️ Imagem':lastMsg?.tipo==='document'?'📎 Documento':'Toque para abrir');
    const preview = lastMsg?.texto||lastMsg?.text||(lastMsg?.tipo==='audio'||lastMsg?.tipo==='audioMessage'?'🎵 Áudio':lastMsg?.tipo==='image'||lastMsg?.tipo==='imageMessage'?'🖼️ Imagem':lastMsg?.tipo==='document'?'📎 Documento':'Toque para abrir');
return '<div class="chat-item '+(activeChatId===c.id?'active':'')+'" onclick="abrirChat(\''+c.id+'\')">'
+'<div class="cavatar">'+ini+'</div>'
+'<div style="flex:1;min-width:0">'
@@ -324,19 +323,20 @@ function abrirChat(cid){
}

// ── ENVIAR MENSAGEM ──
// Adiciona mensagem ao chat local imediatamente (feedback visual)
function adicionarMsgLocal(cid, texto, tipo, mediaUrl){
  if(!chatMsgs[cid]) chatMsgs[cid] = [];
  chatMsgs[cid].push({
  const msgObj = {
texto, tipo, direcao:'saida', out:true,
media_url: mediaUrl||null,
    media_url_local: mediaUrl||null,
created_at: new Date().toISOString()
  });
  };
  if(!chatMsgs[cid]) chatMsgs[cid] = [];
  chatMsgs[cid].push(msgObj);
const area = document.getElementById('chat-msgs');
if(area){
const ph = area.querySelector('[data-placeholder]');
if(ph) ph.remove();
    area.insertAdjacentHTML('beforeend', renderMsgItem({texto, tipo, direcao:'saida', out:true, media_url:mediaUrl||null, created_at:new Date().toISOString()}));
    area.insertAdjacentHTML('beforeend', renderMsgItem(msgObj));
area.scrollTop = area.scrollHeight;
}
renderChatContacts();
@@ -345,7 +345,6 @@ function adicionarMsgLocal(cid, texto, tipo, mediaUrl){
async function sendMsg(){
if(!activeChatId){ notify('Selecione um contato','error'); return; }

  // Se tem mídia na fila, envia arquivo
if(_mediaFile){
const c = allClientes.find(x=>x.id===activeChatId);
await _enviarMidiaWpp(c);
@@ -356,13 +355,10 @@ async function sendMsg(){
const texto = inp.value.trim();
if(!texto) return;

  // Pega telefone — cliente cadastrado ou número desconhecido
const c = allClientes.find(x=>x.id===activeChatId);
const telefone = c?.telefone || (activeChatId.includes('-') ? null : activeChatId);

if(!telefone){ notify('Cliente sem telefone cadastrado','error'); return; }

  // Mostra imediatamente no chat
adicionarMsgLocal(activeChatId, texto, 'text', null);
inp.value = '';

@@ -375,11 +371,16 @@ async function sendMsg(){
}

// ── ENVIAR MÍDIA ──
let _mediaFile = null, _mediaType = '';
let _mediaFile = null, _mediaType = '', _mediaPreviewUrl = null;

function enviarArquivo(input, tipo){
const file = input.files[0]; if(!file) return;
_mediaFile = file; _mediaType = tipo;

  // Cria URL local para preview
  if(_mediaPreviewUrl) URL.revokeObjectURL(_mediaPreviewUrl);
  _mediaPreviewUrl = URL.createObjectURL(file);

const prev = document.getElementById('media-preview');
const txt  = document.getElementById('media-preview-txt');
if(prev && txt){
@@ -390,9 +391,10 @@ function enviarArquivo(input, tipo){
}

function cancelarMidia(){
  if(_mediaPreviewUrl){ URL.revokeObjectURL(_mediaPreviewUrl); _mediaPreviewUrl = null; }
_mediaFile = null; _mediaType = '';
const prev = document.getElementById('media-preview');
  if(prev){ prev.style.display = 'none'; prev.style.cssText = 'display:none'; }
  if(prev) prev.style.display = 'none';
const txt = document.getElementById('media-preview-txt');
if(txt) txt.textContent = '';
}
@@ -407,6 +409,8 @@ async function _enviarMidiaWpp(c){
const fileName = _mediaFile.name;
const tipo     = _mediaType;
const fileRef  = _mediaFile;
  // Salva URL local antes de cancelar
  const localUrl = _mediaPreviewUrl;

notify('Enviando...','success');

@@ -444,12 +448,14 @@ async function _enviarMidiaWpp(c){
throw new Error(msg);
}

    adicionarMsgLocal(activeChatId, fileName||'Arquivo', tipo, null);
    // Mostra no chat com URL local (imagem/áudio aparece na hora)
    adicionarMsgLocal(activeChatId, fileName||'Arquivo', tipo, localUrl);
await salvarMsgDB(c?.id||null, telefone, fileName||'Arquivo', tipo, 'saida', null);
cancelarMidia();
notify('Arquivo enviado ✓','success');
}catch(err){
notify('Erro: '+err.message,'error');
    cancelarMidia();
}
}

@@ -480,7 +486,7 @@ function _comprimirImagem(file, maxWidth=800){
});
}

// ── GRAVAÇÃO DE ÁUDIO (segurar para gravar) ──
// ── GRAVAÇÃO DE ÁUDIO ──
let mediaRecorder = null, audioChunks = [], _streamAtivo = null;

async function iniciarGravacao(e){
@@ -499,8 +505,10 @@ async function iniciarGravacao(e){
if(blob.size < 500){ notify('Áudio muito curto — segure mais tempo','error'); resetMicBtn(); return; }
_mediaFile = new File([blob],'audio_'+Date.now()+'.ogg',{type:'audio/ogg'});
_mediaType = 'audio';
      // Cria URL local para o áudio gravado
      if(_mediaPreviewUrl) URL.revokeObjectURL(_mediaPreviewUrl);
      _mediaPreviewUrl = URL.createObjectURL(_mediaFile);
resetMicBtn();
      // Envia automaticamente
const c = allClientes.find(x=>x.id===activeChatId);
_enviarMidiaWpp(c);
};
@@ -530,7 +538,6 @@ function resetMicBtn(){
if(btn){ btn.textContent='🎙️'; btn.style.background='var(--bg3)'; btn.style.borderColor='var(--border2)'; btn.style.color=''; }
}


// ── CONTRATOS ──
async function enviarContratoWpp(){
if(!activeChatId){ notify('Selecione um contato primeiro','error'); return; }
