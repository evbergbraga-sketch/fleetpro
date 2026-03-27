// clientes.js — Gestão de clientes

// ══ CLIENTES ══
function cnhBadge(val){if(!val)return'<span class="badge badge-gray">Não informada</span>';const d=Math.ceil((new Date(val)-new Date())/86400000);return d<0?'<span class="badge badge-red">Vencida</span>':d<60?`<span class="badge badge-yellow">Vence em ${d}d</span>`:'<span class="badge badge-green">Válida</span>';}

function renderClientes(){
  const s=(document.getElementById('s-clientes')?.value||'').toLowerCase();
  const data=allClientes.filter(c=>!s||`${c.nome} ${c.cpf} ${c.telefone||''}`.toLowerCase().includes(s));
  const tb=document.getElementById('tb-clientes');
  const palette=['rgba(34,197,94,.12):#22c55e','rgba(239,68,68,.12):#ef4444','rgba(168,85,247,.12):#a855f7','rgba(59,130,246,.12):#3b82f6'];
  tb.innerHTML=data.length?data.map(c=>{
    const ini=(c.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const [bg,fg]=palette[c.nome.charCodeAt(0)%palette.length].split(':');
    return `<tr><td><div style="display:flex;align-items:center;gap:10px"><div class="cavatar" style="width:34px;height:34px;font-size:12px;background:${bg};color:${fg}">${ini}</div><div><div style="font-weight:500">${c.nome}</div><div style="font-size:11px;color:var(--muted)">${c.email||''}</div></div></div></td><td>${c.cpf}</td><td>${c.telefone||'—'}</td><td>${c.cnh_validade?fmtData(c.cnh_validade):'—'}</td><td>${cnhBadge(c.cnh_validade)}</td><td style="display:flex;gap:4px;flex-wrap:wrap"><button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="verPerfilClienteById('${c.id}')">👤 Perfil</button><button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="abrirChat('${c.id}')">💬 Chat</button><button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="editarCliente('${c.id}')">✏️ Editar</button></td></tr>`;
  }).join(''):'<tr class="empty-row"><td colspan="6">Nenhum cliente encontrado</td></tr>';
}

async function salvarCliente(){
  const nome = document.getElementById('mc-nome').value.trim();
  const cpf  = document.getElementById('mc-cpf').value.trim();
  const tel  = document.getElementById('mc-tel').value.trim();
  const email= document.getElementById('mc-email').value.trim();
  const cnh  = document.getElementById('mc-cnh').value.trim();
  const cnhv = document.getElementById('mc-cnh-val').value||null;
  const end  = document.getElementById('mc-end').value.trim();
  const obs  = document.getElementById('mc-obs').value.trim();

  if(!nome||!cpf){notify('Nome e CPF são obrigatórios','error');return;}

  // Desabilita botão durante salvamento
  const btn = document.querySelector('#m-cliente .btn-primary');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}

  try{
    const {data,error}=await sb.from('clientes').insert({
      nome,cpf,email,telefone:tel,cnh,cnh_validade:cnhv,endereco:end,observacoes:obs
    }).select().single();

    if(error) throw error;

    notify('Cliente cadastrado com sucesso!','success');
    closeModal('cliente');
    ['mc-nome','mc-cpf','mc-tel','mc-email','mc-cnh','mc-end'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });
    document.getElementById('mc-obs').value='';
    await loadClientes();
    renderDashboard();
    renderChatContacts();
  }catch(e){
    console.error('salvarCliente erro:', e);
    notify('Erro ao salvar: '+e.message,'error');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='✓ Salvar';}
  }
}

// Modal perfil do cliente com histórico de contratos
async function verPerfilCliente(){
  if(!activeChatId) return;
  const c = allClientes.find(x=>x.id===activeChatId);
  if(!c){ notify('Selecione um cliente cadastrado','error'); return; }

  // Busca locações do cliente
  const {data:locs} = await sb.from('locacoes')
    .select('*,veiculos(marca,modelo,placa)')
    .eq('cliente_id', c.id)
    .order('created_at',{ascending:false});

  const cnhStatus = c.cnh_validade
    ? (new Date(c.cnh_validade) < new Date() ? '🔴 Vencida' : '🟢 Válida até '+fmtData(c.cnh_validade))
    : '—';

  let html = `<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
    <div class="cavatar" style="width:52px;height:52px;font-size:18px;background:rgba(245,166,35,.12);color:var(--accent)">
      ${(c.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
    </div>
    <div>
      <div style="font-size:16px;font-weight:700">${c.nome}</div>
      <div style="font-size:12px;color:var(--muted)">${c.email||'sem email'}</div>
    </div>
    <button class="btn btn-ghost" style="margin-left:auto;font-size:12px" onclick="editarCliente('${c.id}');closeModal('perfil-cliente')">✏️ Editar</button>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
    <div style="background:var(--bg3);padding:10px;border-radius:8px">
      <div style="font-size:10px;color:var(--muted2);margin-bottom:3px">CPF</div>
      <div style="font-size:13px">${c.cpf||'—'}</div>
    </div>
    <div style="background:var(--bg3);padding:10px;border-radius:8px">
      <div style="font-size:10px;color:var(--muted2);margin-bottom:3px">Telefone</div>
      <div style="font-size:13px">${c.telefone||'—'}</div>
    </div>
    <div style="background:var(--bg3);padding:10px;border-radius:8px">
      <div style="font-size:10px;color:var(--muted2);margin-bottom:3px">CNH</div>
      <div style="font-size:13px">${c.cnh||'—'}</div>
    </div>
    <div style="background:var(--bg3);padding:10px;border-radius:8px">
      <div style="font-size:10px;color:var(--muted2);margin-bottom:3px">Validade CNH</div>
      <div style="font-size:13px">${cnhStatus}</div>
    </div>
  </div>
  ${c.endereco?`<div style="background:var(--bg3);padding:10px;border-radius:8px;margin-bottom:16px"><div style="font-size:10px;color:var(--muted2);margin-bottom:3px">Endereço</div><div style="font-size:13px">${c.endereco}</div></div>`:''}
  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">
    📋 Histórico de Contratos (${locs?.length||0})
  </div>`;

  if(locs && locs.length > 0){
    html += locs.map(l=>{
      const dias = Math.ceil((new Date(l.data_fim)-new Date(l.data_inicio))/86400000);
      const cor = l.status==='ativa'?'var(--green)':l.status==='encerrada'?'var(--blue)':'var(--red)';
      return `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:13px;font-weight:600">🚗 ${l.veiculos?.marca||''} ${l.veiculos?.modelo||''}</div>
          <span style="font-size:11px;color:${cor};font-weight:600">${l.status?.toUpperCase()}</span>
        </div>
        <div style="font-size:12px;color:var(--muted)">📅 ${fmtData(l.data_inicio)} → ${fmtData(l.data_fim)} (${dias} dias)</div>
        <div style="font-size:12px;color:var(--muted)">💰 R$ ${(l.diaria||0).toFixed(2)}/dia · Total: R$ ${(l.total||0).toFixed(2)}</div>
        ${l.veiculos?.placa?`<div style="font-size:11px;color:var(--muted2);margin-top:2px">Placa: ${l.veiculos.placa}</div>`:''}
      </div>`;
    }).join('');
  } else {
    html += '<div style="text-align:center;padding:20px;color:var(--muted2);font-size:13px">Nenhum contrato registrado ainda.</div>';
  }

  document.getElementById('perfil-cliente-body').innerHTML = html;
  document.getElementById('m-perfil-cliente').classList.add('show');
}

// Abre perfil do cliente por ID (usado na tabela de clientes)
async function verPerfilClienteById(id){
  const c = allClientes.find(x=>x.id===id);
  if(!c) return;
  // Temporariamente seta activeChatId para reusar verPerfilCliente
  const anterior = activeChatId;
  activeChatId = id;
  await verPerfilCliente();
  // Restaura se não foi abrir chat
  if(!document.getElementById('page-chat').classList.contains('active'))
    activeChatId = anterior;
}

function editarCliente(id){
  const c = allClientes.find(x=>x.id===id);
  if(!c) return;
  document.getElementById('ec-id').value = c.id;
  document.getElementById('ec-nome').value = c.nome||'';
  document.getElementById('ec-cpf').value = c.cpf||'';
  document.getElementById('ec-tel').value = c.telefone||'';
  document.getElementById('ec-email').value = c.email||'';
  document.getElementById('ec-cnh').value = c.cnh||'';
  document.getElementById('ec-cnh-val').value = c.cnh_validade||'';
  document.getElementById('ec-end').value = c.endereco||'';
  document.getElementById('ec-obs').value = c.observacoes||'';
  document.getElementById('m-editar-cliente').classList.add('show');
}

async function atualizarCliente(){
  const id = document.getElementById('ec-id').value;
  if(!id) return;
  const obj = {
    nome:     document.getElementById('ec-nome').value.trim(),
    cpf:      document.getElementById('ec-cpf').value.trim(),
    telefone: document.getElementById('ec-tel').value.trim(),
    email:    document.getElementById('ec-email').value.trim(),
    cnh:      document.getElementById('ec-cnh').value.trim(),
    cnh_validade: document.getElementById('ec-cnh-val').value||null,
    endereco: document.getElementById('ec-end').value.trim(),
    observacoes: document.getElementById('ec-obs').value.trim(),
  };
  if(!obj.nome||!obj.cpf){notify('Nome e CPF obrigatórios','error');return;}
  const btn = document.querySelector('#m-editar-cliente .btn-primary');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  try{
    const {error} = await sb.from('clientes').update(obj).eq('id',id);
    if(error) throw error;
    notify('Cliente atualizado!','success');
    closeModal('editar-cliente');
    await loadClientes();
    renderDashboard();
    renderChatContacts();
  }catch(e){
    notify('Erro: '+e.message,'error');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='✓ Salvar alterações';}
  }
}

function salvarPersonalizacao(){
  const nome = document.getElementById('wpp-nome-locadora')?.value||'FleetPro Locadora';
  const assin = document.getElementById('wpp-assinatura')?.value||'';
  localStorage.setItem('fp_personalizacao', JSON.stringify({nome, assin}));
  notify('Personalização salva!','success');
}

