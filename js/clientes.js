// clientes.js — Gestão de clientes

// ══ CLIENTES ══
function cnhBadge(val){
  if(!val) return '<span class="badge badge-gray">Não informada</span>';
  const d=Math.ceil((new Date(val)-new Date())/86400000);
  return d<0?'<span class="badge badge-red">Vencida</span>':d<60?`<span class="badge badge-yellow">Vence em ${d}d</span>`:'<span class="badge badge-green">Válida</span>';
}

function renderClientes(){
  const s=(document.getElementById('s-clientes')?.value||'').toLowerCase();
  const data=allClientes.filter(c=>!s||`${c.nome} ${c.cpf} ${c.telefone||''}`.toLowerCase().includes(s));
  const tb=document.getElementById('tb-clientes');
  const palette=['rgba(34,197,94,.15):#16a34a','rgba(168,85,247,.15):#7c3aed','rgba(37,99,235,.15):#2563EB','rgba(220,38,38,.15):#dc2626'];
  tb.innerHTML=data.length?data.map(c=>{
    const ini=(c.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const [bg,fg]=palette[c.nome.charCodeAt(0)%palette.length].split(':');
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:10px">
        <div class="cavatar" style="width:36px;height:36px;font-size:12px;background:${bg};color:${fg}">${ini}</div>
        <div><div style="font-weight:500">${c.nome}</div><div style="font-size:11px;color:var(--muted)">${c.email||''}</div></div>
      </div></td>
      <td>${c.cpf}</td>
      <td>${c.telefone||'—'}</td>
      <td>${c.cnh_validade?fmtData(c.cnh_validade):'—'}</td>
      <td>${cnhBadge(c.cnh_validade)}</td>
      <td><div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="verPerfilClienteById('${c.id}')">👤 Perfil</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="irParaChat('${c.id}')">💬 Chat</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="editarCliente('${c.id}')">✏️ Editar</button>
      </div></td>
    </tr>`;
  }).join(''):'<tr class="empty-row"><td colspan="6">Nenhum cliente encontrado</td></tr>';
}

// Navega para o chat e abre a conversa do cliente
function irParaChat(id){
  goPage('chat');
  setTimeout(()=>abrirChat(id), 300);
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
  const btn = document.querySelector('#m-cliente .btn-primary');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  try{
    const {data,error}=await sb.from('clientes').insert({
      nome,cpf,email,telefone:tel,cnh,cnh_validade:cnhv,endereco:end,observacoes:obs
    }).select().single();
    if(error) throw error;
    notify('Cliente cadastrado com sucesso!','success');
    closeModal('cliente');
    ['mc-nome','mc-cpf','mc-tel','mc-email','mc-cnh','mc-end','mc-obs'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });
    await loadClientes(); renderDashboard(); renderChatContacts();
  }catch(e){
    notify('Erro ao salvar: '+e.message,'error');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='✓ Salvar';}
  }
}

// Perfil do cliente com histórico completo de locações
async function verPerfilCliente(){
  if(!activeChatId) return;
  const c = allClientes.find(x=>x.id===activeChatId);
  if(!c){ notify('Selecione um cliente cadastrado','error'); return; }
  await _renderPerfilCliente(c);
}

async function verPerfilClienteById(id){
  const c = allClientes.find(x=>x.id===id);
  if(!c) return;
  await _renderPerfilCliente(c);
}

async function _renderPerfilCliente(c){
  const {data:locs} = await sb.from('locacoes')
    .select('*,veiculos(marca,modelo,placa,tipo)')
    .eq('cliente_id', c.id)
    .order('created_at',{ascending:false});

  const cnhStatus = c.cnh_validade
    ? (new Date(c.cnh_validade) < new Date()
        ? '<span class="badge badge-red">Vencida</span>'
        : '<span class="badge badge-green">Válida até '+fmtData(c.cnh_validade)+'</span>')
    : '<span class="badge badge-gray">Não informada</span>';

  const ini=(c.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

  // Calcular stats do cliente
  const totalGasto = (locs||[]).reduce((acc,l)=>acc+(l.total||0),0);
  const locAtiva = (locs||[]).find(l=>l.status==='ativa');

  let html = `
  <div style="padding:20px 20px 0">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
      <div class="cavatar" style="width:52px;height:52px;font-size:18px;background:rgba(37,99,235,.12);color:#2563EB">${ini}</div>
      <div style="flex:1">
        <div style="font-size:17px;font-weight:700">${c.nome}</div>
        <div style="font-size:12px;color:var(--muted)">${c.email||'sem email'}</div>
      </div>
      <button class="btn btn-ghost" style="font-size:12px" onclick="editarCliente('${c.id}');closeModal('perfil-cliente')">✏️ Editar</button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px">
      <div style="background:rgba(37,99,235,.06);border:1px solid rgba(37,99,235,.12);padding:12px;border-radius:10px;text-align:center">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Locações</div>
        <div style="font-size:24px;font-weight:800;color:#2563EB">${(locs||[]).length}</div>
      </div>
      <div style="background:rgba(22,163,74,.06);border:1px solid rgba(22,163,74,.12);padding:12px;border-radius:10px;text-align:center">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Total gasto</div>
        <div style="font-size:16px;font-weight:800;color:#16a34a">R$ ${totalGasto.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
      </div>
      <div style="background:${locAtiva?'rgba(220,38,38,.06)':'rgba(100,116,139,.06)'};border:1px solid ${locAtiva?'rgba(220,38,38,.15)':'rgba(100,116,139,.12)'};padding:12px;border-radius:10px;text-align:center">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Status</div>
        <div style="font-size:13px;font-weight:700;color:${locAtiva?'#dc2626':'#64748B'}">${locAtiva?'Com veículo':'Livre'}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">
      <div style="background:var(--bg2);padding:10px 12px;border-radius:8px">
        <div style="font-size:10px;color:var(--muted2);margin-bottom:3px">CPF</div>
        <div style="font-size:13px;font-weight:500">${c.cpf||'—'}</div>
      </div>
      <div style="background:var(--bg2);padding:10px 12px;border-radius:8px">
        <div style="font-size:10px;color:var(--muted2);margin-bottom:3px">Telefone</div>
        <div style="font-size:13px;font-weight:500">${c.telefone||'—'}</div>
      </div>
      <div style="background:var(--bg2);padding:10px 12px;border-radius:8px">
        <div style="font-size:10px;color:var(--muted2);margin-bottom:3px">CNH</div>
        <div style="font-size:13px;font-weight:500">${c.cnh||'—'}</div>
      </div>
      <div style="background:var(--bg2);padding:10px 12px;border-radius:8px">
        <div style="font-size:10px;color:var(--muted2);margin-bottom:3px">Validade CNH</div>
        <div style="font-size:13px">${cnhStatus}</div>
      </div>
      ${c.endereco?`<div style="background:var(--bg2);padding:10px 12px;border-radius:8px;grid-column:1/-1"><div style="font-size:10px;color:var(--muted2);margin-bottom:3px">Endereço</div><div style="font-size:13px">${c.endereco}</div></div>`:''}
    </div>
  </div>

  <div style="border-top:1px solid var(--border2);padding:16px 20px">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:12px">
      📋 Histórico de Locações (${(locs||[]).length})
    </div>`;

  if(locs && locs.length > 0){
    html += locs.map(l=>{
      const dias = Math.ceil((new Date(l.data_fim)-new Date(l.data_inicio))/86400000);
      const diff = Math.ceil((new Date(l.data_fim)-new Date())/86400000);
      let badge = '';
      if(l.status==='ativa'){
        badge = diff < 0
          ? '<span class="badge badge-red">Atrasado</span>'
          : diff === 0
            ? '<span class="badge badge-yellow">Hoje</span>'
            : '<span class="badge badge-green">Ativa</span>';
      } else if(l.status==='encerrada'){
        badge = '<span class="badge badge-blue">Encerrada</span>';
      } else {
        badge = '<span class="badge badge-gray">Cancelada</span>';
      }
      const icone = l.veiculos?.tipo === 'moto' ? '🏍️' : '🚗';
      return `<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:14px;margin-bottom:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">${icone}</span>
            <div>
              <div style="font-size:13px;font-weight:600">${l.veiculos?.marca||''} ${l.veiculos?.modelo||''}</div>
              <div style="font-size:11px;color:var(--muted)">${l.veiculos?.placa||''}</div>
            </div>
          </div>
          ${badge}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:var(--muted)">
          <div>📅 ${fmtData(l.data_inicio)} → ${fmtData(l.data_fim)}</div>
          <div>⏱ ${dias} dias</div>
          <div>💰 R$ ${(l.diaria||0).toFixed(2)}/dia</div>
          <div style="font-weight:600;color:var(--text)">Total: R$ ${(l.total||0).toFixed(2)}</div>
        </div>
        ${l.status==='ativa'?`<div style="margin-top:10px"><button class="btn btn-primary" style="font-size:11px;padding:5px 14px;width:100%" onclick="confirmarDevolucao('${l.id}','${l.veiculo_id}','${l.veiculos?.marca||''} ${l.veiculos?.modelo||''}');closeModal('perfil-cliente')">✅ Confirmar devolução</button></div>`:''}
      </div>`;
    }).join('');
  } else {
    html += '<div style="text-align:center;padding:20px;color:var(--muted2);font-size:13px">Nenhum contrato registrado ainda.</div>';
  }

  html += `<div style="display:flex;gap:8px;margin-top:4px">
    <button class="btn btn-ghost" style="flex:1" onclick="irParaChat('${c.id}');closeModal('perfil-cliente')">💬 Abrir chat</button>
    <button class="btn btn-primary" style="flex:1" onclick="closeModal('perfil-cliente')">Fechar</button>
  </div></div>`;

  document.getElementById('perfil-cliente-body').innerHTML = html;
  document.getElementById('m-perfil-cliente').classList.add('show');
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
    nome:        document.getElementById('ec-nome').value.trim(),
    cpf:         document.getElementById('ec-cpf').value.trim(),
    telefone:    document.getElementById('ec-tel').value.trim(),
    email:       document.getElementById('ec-email').value.trim(),
    cnh:         document.getElementById('ec-cnh').value.trim(),
    cnh_validade:document.getElementById('ec-cnh-val').value||null,
    endereco:    document.getElementById('ec-end').value.trim(),
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
    await loadClientes(); renderDashboard(); renderChatContacts();
  }catch(e){
    notify('Erro: '+e.message,'error');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='✓ Salvar alterações';}
  }
}

// ══ DEVOLUÇÃO DE VEÍCULO ══
async function confirmarDevolucao(locId, veiculoId, nomeVeiculo){
  const kmFinal = prompt(`Confirmar devolução de ${nomeVeiculo}\n\nInforme o KM final do veículo (ou deixe vazio):`, '');
  if(kmFinal === null) return; // cancelou

  const btn_text = 'Processando...';
  try{
    // Atualiza locação para encerrada
    const updateObj = {status:'encerrada'};
    if(kmFinal && !isNaN(parseInt(kmFinal))) updateObj.km_final = parseInt(kmFinal);

    const {error:e1} = await sb.from('locacoes').update(updateObj).eq('id',locId);
    if(e1) throw e1;

    // Atualiza veículo para disponível
    const kmUpdate = {status:'disponivel'};
    if(kmFinal && !isNaN(parseInt(kmFinal))) kmUpdate.km_atual = parseInt(kmFinal);
    const {error:e2} = await sb.from('veiculos').update(kmUpdate).eq('id',veiculoId);
    if(e2) throw e2;

    notify('Devolução confirmada! Veículo disponível. ✅','success');
    await carregarTudo();
  }catch(e){
    notify('Erro ao confirmar devolução: '+e.message,'error');
  }
}

function salvarPersonalizacao(){
  const nome = document.getElementById('wpp-nome-locadora')?.value||'FleetPro Locadora';
  const assin = document.getElementById('wpp-assinatura')?.value||'';
  localStorage.setItem('fp_personalizacao', JSON.stringify({nome, assin}));
  notify('Personalização salva!','success');
}
