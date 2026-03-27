// ui.js — Camadas, modais, notificações, utilitários

// ══ LAYERS ══
function goLayer(id){
  document.querySelectorAll('.layer').forEach(l=>l.classList.remove('active'));
  document.getElementById('layer-'+id).classList.add('active');
}

// ══ SETUP ══
// ══ MODALS ══
function openModal(type,subtipo){
  if(type==='veiculo'){
    document.getElementById('mv-title').textContent=subtipo==='moto'?'Cadastrar Moto':'Cadastrar Carro';
    if(subtipo) document.getElementById('mv-tipo').value=subtipo;
    document.getElementById('m-veiculo').classList.add('show');
  } else if(type==='cliente'){
    document.getElementById('m-cliente').classList.add('show');
  } else if(type==='manutencao'){
    document.getElementById('mm-vei').innerHTML=allVeiculos.map(v=>`<option value="${v.id}">${v.marca} ${v.modelo} — ${v.placa}</option>`).join('');
    document.getElementById('mm-ini').value=new Date().toISOString().split('T')[0];
    document.getElementById('m-manutencao').classList.add('show');
  }
}
function closeModal(t){document.getElementById('m-'+t).classList.remove('show');}
document.querySelectorAll('.modal-overlay').forEach(el=>el.addEventListener('click',e=>{if(e.target===el)el.classList.remove('show');}));

// ══ UTILS ══
function fmtData(d){return d?d.split('-').reverse().join('/'):'—';}
function fmtDt(dt){if(!dt)return'—';const d=new Date(dt);return d.toLocaleDateString('pt-BR')+' às '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}
function notify(msg,type='success'){
  const el=document.getElementById('notify');
  el.textContent=(type==='success'?'✓ ':'✕ ')+msg;
  el.className='notify '+type;el.style.display='block';
  clearTimeout(el._t);el._t=setTimeout(()=>el.style.display='none',3500);
}

// ══ BOOT ══
