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

async function confirmarDevolucao(locId, veiculoId, nomeVeiculo){
  const kmFinal = prompt(`Confirmar devolução de ${nomeVeiculo}\n\nInforme o KM final (ou deixe vazio):`, '');
  if(kmFinal === null) return;
  try{
    const updateObj = {status:'encerrada'};
    if(kmFinal && !isNaN(parseInt(kmFinal))) updateObj.km_final = parseInt(kmFinal);
    const {error:e1} = await sb.from('locacoes').update(updateObj).eq('id',locId);
    if(e1) throw e1;
    const kmUpdate = {status:'disponivel'};
    if(kmFinal && !isNaN(parseInt(kmFinal))) kmUpdate.km_atual = parseInt(kmFinal);
    const {error:e2} = await sb.from('veiculos').update(kmUpdate).eq('id',veiculoId);
    if(e2) throw e2;
    notify('Devolução confirmada! Veículo disponível. ✅','success');
    await Promise.all([loadVeiculos(), loadLocacoes(), loadLocacoesCompletas()]);
    renderDashboard(); renderVeiculos(); renderLocacoes();
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


// ══ EXTENSÃO clientes.js — Condutores e Cartões no perfil ══
// Adicionar ao final do clientes.js existente

// ══ PERFIL EXPANDIDO COM ABAS ══
async function _renderPerfilCliente(c){
  document.getElementById('perfil-cliente-body').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;gap:14px">
      <div style="width:40px;height:40px;border:3px solid #E2E8F0;border-top-color:#2563EB;border-radius:50%;animation:spin .7s linear infinite"></div>
      <div style="font-size:13px;color:var(--muted)">Carregando perfil...</div>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
  document.getElementById('m-perfil-cliente').classList.add('show');

  const [
    {data:locs},
    {data:condutores},
    {data:cartoes}
  ] = await Promise.all([
    sb.from('locacoes').select('*,veiculos(marca,modelo,placa,tipo)').eq('cliente_id',c.id).order('created_at',{ascending:false}),
    sb.from('condutores').select('*').eq('cliente_id',c.id).order('nome'),
    sb.from('cartoes').select('*').eq('cliente_id',c.id).order('created_at',{ascending:false})
  ]);

  const cnhStatus = c.cnh_validade
    ? (new Date(c.cnh_validade)<new Date()
        ?'<span class="badge badge-red">Vencida</span>'
        :`<span class="badge badge-green">Válida até ${fmtData(c.cnh_validade)}</span>`)
    :'<span class="badge badge-gray">Não informada</span>';
  const ini=(c.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const totalGasto=(locs||[]).reduce((acc,l)=>acc+(l.total||0),0);
  const locAtiva=(locs||[]).find(l=>l.status==='ativa');

  const html = `
  <!-- HEADER -->
  <div style="padding:20px 20px 0">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
      <div class="cavatar" style="width:52px;height:52px;font-size:18px;background:rgba(37,99,235,.12);color:#2563EB">${ini}</div>
      <div style="flex:1">
        <div style="font-size:17px;font-weight:700">${c.nome}</div>
        <div style="font-size:12px;color:var(--muted)">${c.email||'sem email'}</div>
      </div>
      <button class="btn btn-ghost" style="font-size:12px" onclick="editarCliente('${c.id}');closeModal('perfil-cliente')">✏️ Editar</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
      <div style="background:rgba(37,99,235,.06);border:1px solid rgba(37,99,235,.12);padding:12px;border-radius:10px;text-align:center">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase">Locações</div>
        <div style="font-size:24px;font-weight:800;color:#2563EB">${(locs||[]).length}</div>
      </div>
      <div style="background:rgba(22,163,74,.06);border:1px solid rgba(22,163,74,.12);padding:12px;border-radius:10px;text-align:center">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase">Total gasto</div>
        <div style="font-size:14px;font-weight:800;color:#16a34a">R$ ${totalGasto.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
      </div>
      <div style="background:${locAtiva?'rgba(220,38,38,.06)':'rgba(100,116,139,.06)'};border:1px solid ${locAtiva?'rgba(220,38,38,.15)':'rgba(100,116,139,.12)'};padding:12px;border-radius:10px;text-align:center">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase">Status</div>
        <div style="font-size:13px;font-weight:700;color:${locAtiva?'#dc2626':'#64748B'}">${locAtiva?'Com veículo':'Livre'}</div>
      </div>
    </div>
  </div>

  <!-- ABAS -->
  <div style="display:flex;border-bottom:2px solid var(--border2);padding:0 20px;gap:0">
    ${[
      {id:'tab-dados',    label:'👤 Dados'},
      {id:'tab-locacoes', label:`📋 Locações (${(locs||[]).length})`},
      {id:'tab-condutores',label:`🧑‍💼 Condutores (${(condutores||[]).length})`},
      {id:'tab-cartoes',  label:`💳 Cartões (${(cartoes||[]).length})`},
    ].map((t,i)=>`
      <button id="${t.id}" class="perfil-tab" onclick="showPerfilTab('${t.id.replace('tab-','')}')"
        style="padding:10px 14px;border:none;background:none;cursor:pointer;font-size:12px;font-weight:600;
               color:${i===0?'var(--accent)':'var(--muted)'};border-bottom:${i===0?'2px solid var(--accent)':'2px solid transparent'};margin-bottom:-2px">
        ${t.label}
      </button>`).join('')}
  </div>

  <!-- PAINEL DADOS -->
  <div id="painel-dados" style="padding:16px 20px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="background:var(--bg2);padding:10px 12px;border-radius:8px"><div style="font-size:10px;color:var(--muted2);margin-bottom:3px">CPF</div><div style="font-size:13px;font-weight:500">${c.cpf||'—'}</div></div>
      <div style="background:var(--bg2);padding:10px 12px;border-radius:8px"><div style="font-size:10px;color:var(--muted2);margin-bottom:3px">Telefone</div><div style="font-size:13px;font-weight:500">${c.telefone||'—'}</div></div>
      <div style="background:var(--bg2);padding:10px 12px;border-radius:8px"><div style="font-size:10px;color:var(--muted2);margin-bottom:3px">CNH</div><div style="font-size:13px;font-weight:500">${c.cnh||'—'}</div></div>
      <div style="background:var(--bg2);padding:10px 12px;border-radius:8px"><div style="font-size:10px;color:var(--muted2);margin-bottom:3px">Validade CNH</div><div style="font-size:13px">${cnhStatus}</div></div>
      ${c.endereco?`<div style="background:var(--bg2);padding:10px 12px;border-radius:8px;grid-column:1/-1"><div style="font-size:10px;color:var(--muted2);margin-bottom:3px">Endereço</div><div style="font-size:13px">${c.endereco}</div></div>`:''}
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost" style="flex:1" onclick="irParaChat('${c.id}');closeModal('perfil-cliente')">💬 Chat</button>
      <button class="btn btn-primary" style="flex:1" onclick="closeModal('perfil-cliente')">Fechar</button>
    </div>
  </div>

  <!-- PAINEL LOCAÇÕES -->
  <div id="painel-locacoes" style="display:none;padding:16px 20px">
    ${(locs||[]).length>0 ? (locs||[]).map(l=>{
      const dias=Math.ceil((new Date(l.data_fim)-new Date(l.data_inicio))/86400000);
      let badge=l.status==='ativa'?'<span class="badge badge-green">Ativa</span>':l.status==='encerrada'?'<span class="badge badge-blue">Encerrada</span>':'<span class="badge badge-gray">Cancelada</span>';
      return `<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:14px;margin-bottom:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">${l.veiculos?.tipo==='moto'?'🏍️':'🚗'}</span>
            <div><div style="font-size:13px;font-weight:600">${l.veiculos?.marca||''} ${l.veiculos?.modelo||''}</div><div style="font-size:11px;color:var(--muted)">${l.veiculos?.placa||''}</div></div>
          </div>${badge}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:var(--muted)">
          <div>📅 ${fmtData(l.data_inicio)} → ${fmtData(l.data_fim)}</div>
          <div style="font-weight:600;color:var(--text)">Total: R$ ${(l.total||0).toFixed(2)}</div>
        </div>
        ${l.status==='ativa'?`<div style="margin-top:10px"><button class="btn btn-primary" style="font-size:11px;padding:5px 14px;width:100%" onclick="confirmarDevolucao('${l.id}','${l.veiculo_id}','${l.veiculos?.marca||''} ${l.veiculos?.modelo||''}');closeModal('perfil-cliente')">✅ Confirmar devolução</button></div>`:''}
      </div>`;
    }).join('') : '<div style="text-align:center;padding:20px;color:var(--muted2);font-size:13px">Nenhum contrato registrado.</div>'}
  </div>

  <!-- PAINEL CONDUTORES -->
  <div id="painel-condutores" style="display:none;padding:16px 20px">
    <div id="condutores-perfil-lista">
      ${(condutores||[]).length>0 ? (condutores||[]).map(cd=>`
        <div style="display:flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--border2);border-radius:8px;padding:10px 12px;margin-bottom:8px">
          <div style="flex:1">
            <div style="font-weight:600;font-size:13px">${cd.nome}</div>
            <div style="font-size:11px;color:var(--muted)">CPF: ${cd.cpf||'não informado'} ${cd.cnh?'· CNH: '+cd.cnh:''}</div>
          </div>
          <button onclick="_excluirCondutor('${cd.id}','${c.id}')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:14px;padding:4px">🗑️</button>
        </div>`).join('')
      : '<div style="text-align:center;padding:16px;color:var(--muted2);font-size:13px">Nenhum condutor cadastrado.</div>'}
    </div>
    <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:14px;margin-top:8px">
      <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--muted)">+ Novo condutor</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <input type="text" id="novo-cond-nome" placeholder="Nome completo" style="width:100%">
        <input type="text" id="novo-cond-cpf" placeholder="CPF" style="width:100%">
        <input type="text" id="novo-cond-cnh" placeholder="CNH (opcional)" style="width:100%">
        <input type="date" id="novo-cond-val" style="width:100%">
      </div>
      <button class="btn btn-primary" style="width:100%;font-size:12px" onclick="_salvarCondutor('${c.id}')">+ Adicionar condutor</button>
    </div>
  </div>

  <!-- PAINEL CARTÕES -->
  <div id="painel-cartoes" style="display:none;padding:16px 20px">
    <div style="font-size:11px;background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.15);border-radius:6px;padding:8px 10px;margin-bottom:12px;color:#991b1b">
      🔒 Dados de cartão armazenados com segurança para uso exclusivo em cobranças futuras.
    </div>
    <div id="cartoes-perfil-lista">
      ${(cartoes||[]).length>0 ? (cartoes||[]).map(ct=>`
        <div style="display:flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--border2);border-radius:8px;padding:10px 12px;margin-bottom:8px">
          <div style="font-size:22px">${ct.bandeira==='Visa'?'💳':ct.bandeira==='Mastercard'?'💳':'💳'}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:13px">${ct.bandeira} •••• ${(ct.numero||'').slice(-4)||'????'}</div>
            <div style="font-size:11px;color:var(--muted)">${ct.titular} · Val: ${ct.validade||'—'}</div>
          </div>
          <button onclick="_excluirCartao('${ct.id}','${c.id}')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:14px;padding:4px">🗑️</button>
        </div>`).join('')
      : '<div style="text-align:center;padding:16px;color:var(--muted2);font-size:13px">Nenhum cartão cadastrado.</div>'}
    </div>
    <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:14px;margin-top:8px">
      <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--muted)">+ Novo cartão</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div class="form-group full" style="grid-column:1/-1"><input type="text" id="novo-cart-titular" placeholder="Nome do titular" style="width:100%"></div>
        <input type="text" id="novo-cart-numero" placeholder="Número do cartão" maxlength="19" style="width:100%" oninput="this.value=this.value.replace(/\D/g,'').replace(/(\d{4})/g,'$1 ').trim().slice(0,19)">
        <input type="text" id="novo-cart-validade" placeholder="MM/AA" maxlength="5" style="width:100%">
        <select id="novo-cart-bandeira" style="width:100%">
          <option>Visa</option><option>Mastercard</option><option>Elo</option>
          <option>American Express</option><option>Hipercard</option><option>Outra</option>
        </select>
      </div>
      <button class="btn btn-primary" style="width:100%;font-size:12px" onclick="_salvarCartao('${c.id}')">+ Adicionar cartão</button>
    </div>
  </div>`;

  document.getElementById('perfil-cliente-body').innerHTML = html;
}

function showPerfilTab(tab){
  const paineis = ['dados','locacoes','condutores','cartoes'];
  paineis.forEach(p=>{
    const painel = document.getElementById(`painel-${p}`);
    const btn    = document.getElementById(`tab-${p}`);
    const active = p===tab;
    if(painel) painel.style.display = active?'':'none';
    if(btn){
      btn.style.color = active?'var(--accent)':'var(--muted)';
      btn.style.borderBottomColor = active?'var(--accent)':'transparent';
    }
  });
}

// ══ SALVAR CONDUTOR ══
async function _salvarCondutor(clienteId){
  const nome = document.getElementById('novo-cond-nome')?.value.trim();
  const cpf  = document.getElementById('novo-cond-cpf')?.value.trim();
  const cnh  = document.getElementById('novo-cond-cnh')?.value.trim();
  const val  = document.getElementById('novo-cond-val')?.value||null;
  if(!nome){ notify('Informe o nome do condutor','error'); return; }
  const {error} = await sb.from('condutores').insert({
    cliente_id:clienteId, nome, cpf:cpf||null, cnh:cnh||null, cnh_validade:val
  });
  if(error){ notify('Erro: '+error.message,'error'); return; }
  notify('Condutor adicionado!','success');
  const c = allClientes.find(x=>x.id===clienteId);
  if(c) await _renderPerfilCliente(c);
}

async function _excluirCondutor(id, clienteId){
  if(!confirm('Remover este condutor?')) return;
  await sb.from('condutores').delete().eq('id',id);
  notify('Condutor removido','success');
  const c = allClientes.find(x=>x.id===clienteId);
  if(c) await _renderPerfilCliente(c);
}

// ══ SALVAR CARTÃO ══
async function _salvarCartao(clienteId){
  const titular  = document.getElementById('novo-cart-titular')?.value.trim();
  const numero   = document.getElementById('novo-cart-numero')?.value.trim();
  const validade = document.getElementById('novo-cart-validade')?.value.trim();
  const bandeira = document.getElementById('novo-cart-bandeira')?.value||'';
  if(!titular||!numero){ notify('Preencha titular e número','error'); return; }
  const {error} = await sb.from('cartoes').insert({
    cliente_id:clienteId, titular, numero, validade, bandeira
  });
  if(error){ notify('Erro: '+error.message,'error'); return; }
  notify('Cartão adicionado!','success');
  const c = allClientes.find(x=>x.id===clienteId);
  if(c) await _renderPerfilCliente(c);
}

async function _excluirCartao(id, clienteId){
  if(!confirm('Remover este cartão?')) return;
  await sb.from('cartoes').delete().eq('id',id);
  notify('Cartão removido','success');
  const c = allClientes.find(x=>x.id===clienteId);
  if(c) await _renderPerfilCliente(c);
}
