// locacoes.js — Aba de Locações em andamento + Checklist de vistoria

let allLocacoesCompletas = []; // locações com joins completos
let _checklistItens = [];      // itens padrão do checklist
let _fotosSelecionadas = [];   // fotos para upload

// ══ RENDER LISTA DE LOCAÇÕES ══
function renderLocacoes(){
  const tb = document.getElementById('tb-locacoes');
  if(!tb) return;
  const ativas = allLocacoesCompletas.filter(l=>l.status==='ativa');
  if(!ativas.length){
    tb.innerHTML='<tr class="empty-row"><td colspan="6">Nenhuma locação ativa no momento</td></tr>';
    return;
  }
  tb.innerHTML = ativas.map(l=>{
    const diff = Math.ceil((new Date(l.data_fim)-new Date())/86400000);
    const badge = diff<0
      ? '<span class="badge badge-red">Atrasado</span>'
      : diff===0
        ? '<span class="badge badge-yellow">Vence hoje</span>'
        : `<span class="badge badge-green">+${diff}d</span>`;
    const icone = l.veiculos?.tipo==='moto'?'🏍️':'🚗';
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="vi ${l.veiculos?.tipo==='carro'?'vi-car':'vi-moto'}">${icone}</div>
          <div>
            <div style="font-weight:500">${l.veiculos?.marca||''} ${l.veiculos?.modelo||''}</div>
            <div style="font-size:11px;color:var(--muted)">${l.veiculos?.placa||''}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-weight:500">${l.clientes?.nome||'—'}</div>
        <div style="font-size:11px;color:var(--muted)">${l.clientes?.telefone||''}</div>
      </td>
      <td>${fmtData(l.data_inicio)}</td>
      <td>${fmtData(l.data_fim)}</td>
      <td>${badge}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-primary" style="font-size:11px;padding:5px 12px" onclick="abrirModalLocacao('${l.id}')">📋 Detalhes</button>
          <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="confirmarDevolucao('${l.id}','${l.veiculo_id}','${(l.veiculos?.marca||'')+' '+(l.veiculos?.modelo||'')}')">✅ Devolver</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ══ LOAD LOCAÇÕES COMPLETAS ══
async function loadLocacoesCompletas(){
  const {data} = await sb.from('locacoes')
    .select('*,veiculos(*),clientes(*)')
    .eq('status','ativa')
    .order('data_fim',{ascending:true});
  allLocacoesCompletas = data||[];
  // Atualiza allLocacoes também para o dashboard
  allLocacoes = data||[];
}

// ══ MODAL DETALHES DA LOCAÇÃO ══
async function abrirModalLocacao(locId){
  const modal = document.getElementById('m-locacao-detalhe');
  const body  = document.getElementById('locacao-detalhe-body');
  if(!modal||!body) return;

  body.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted)">⏳ Carregando...</div>`;
  modal.classList.add('show');

  // Busca locação completa
  const {data:loc} = await sb.from('locacoes')
    .select('*,veiculos(*),clientes(*)')
    .eq('id',locId).single();
  if(!loc){ body.innerHTML='<p style="color:var(--red)">Locação não encontrada.</p>'; return; }

  // Busca checklists existentes
  const {data:checks} = await sb.from('checklists')
    .select('*,perfis(nome)')
    .eq('locacao_id',locId)
    .order('created_at',{ascending:true});

  const checkSaida   = checks?.find(c=>c.tipo==='saida');
  const checkEntrada = checks?.find(c=>c.tipo==='entrada');

  const diff = Math.ceil((new Date(loc.data_fim)-new Date())/86400000);
  const statusColor = diff<0?'#dc2626':diff===0?'#d97706':'#16a34a';
  const statusLabel = diff<0?`Atrasado ${Math.abs(diff)}d`:diff===0?'Vence hoje':`${diff} dias restantes`;

  body.innerHTML = `
    <!-- HEADER DA LOCAÇÃO -->
    <div style="background:linear-gradient(135deg,#1d4ed8,#2563EB);color:#fff;padding:20px 24px;border-radius:12px;margin-bottom:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:1px">Contrato #${loc.num_contrato||'—'}</div>
          <div style="font-size:20px;font-weight:800;margin:4px 0">${loc.veiculos?.marca||''} ${loc.veiculos?.modelo||''}</div>
          <div style="font-size:13px;opacity:.85">Placa: ${loc.veiculos?.placa||'—'}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;opacity:.7">Status</div>
          <div style="font-size:14px;font-weight:700;color:${statusColor==='#16a34a'?'#a7f3d0':statusColor==='#d97706'?'#fde68a':'#fca5a5'}">${statusLabel}</div>
        </div>
      </div>
    </div>

    <!-- DADOS PRINCIPAIS -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:var(--bg2);border-radius:10px;padding:14px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:8px">👤 Cliente</div>
        <div style="font-weight:600;font-size:14px">${loc.clientes?.nome||'—'}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">CPF: ${loc.clientes?.cpf||'—'}</div>
        <div style="font-size:12px;color:var(--muted)">Tel: ${loc.clientes?.telefone||'—'}</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:14px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:8px">📅 Período</div>
        <div style="font-size:12px"><strong>Retirada:</strong> ${loc.data_inicio_hora ? _fmtDtLocacao(loc.data_inicio_hora) : fmtData(loc.data_inicio)}</div>
        <div style="font-size:12px"><strong>Devolução:</strong> ${loc.data_fim_hora ? _fmtDtLocacao(loc.data_fim_hora) : fmtData(loc.data_fim)}</div>
        <div style="font-size:12px"><strong>Local:</strong> ${loc.local_retirada||'Loja'}</div>
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:14px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:8px">💰 Financeiro</div>
        <div style="font-size:12px"><strong>Diária:</strong> R$ ${(loc.diaria||0).toFixed(2).replace('.',',')}</div>
        <div style="font-size:12px"><strong>Total:</strong> <span style="color:var(--accent);font-weight:700">R$ ${(loc.total||0).toFixed(2).replace('.',',')}</span></div>
        <div style="font-size:12px"><strong>Pagamento:</strong> ${loc.forma_pgto||'—'}</div>
        ${loc.caucao>0?`<div style="font-size:12px"><strong>Caução:</strong> R$ ${(loc.caucao||0).toFixed(2).replace('.',',')}</div>`:''}
      </div>
      <div style="background:var(--bg2);border-radius:10px;padding:14px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:8px">🚗 Veículo</div>
        <div style="font-size:12px"><strong>Km saída:</strong> ${loc.km_inicial||'—'}</div>
        <div style="font-size:12px"><strong>Tipo:</strong> ${loc.tipo_contrato==='moto'?'🏍️ Moto':'🚗 Carro'}</div>
        ${loc.servicos_adicionais?.length>0?`<div style="font-size:12px"><strong>Serviços:</strong> ${loc.servicos_adicionais.map(s=>s.descricao).join(', ')}</div>`:''}
      </div>
    </div>

    ${loc.observacoes?`
    <div style="background:var(--bg2);border-radius:10px;padding:14px;margin-bottom:20px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:6px">📝 Observações</div>
      <div style="font-size:13px;color:var(--text)">${loc.observacoes}</div>
    </div>`:''}

    <!-- ABAS CHECKLISTS -->
    <div style="border-bottom:2px solid var(--border2);margin-bottom:16px;display:flex;gap:0">
      <button id="tab-saida" class="loc-tab active" onclick="showLocTab('saida')"
        style="padding:8px 20px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;border-bottom:2px solid var(--accent);color:var(--accent);margin-bottom:-2px">
        🚗 Saída ${checkSaida?'✓':''}
      </button>
      <button id="tab-entrada" class="loc-tab" onclick="showLocTab('entrada')"
        style="padding:8px 20px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-2px">
        🏁 Entrada ${checkEntrada?'✓':''}
      </button>
    </div>

    <!-- PAINEL SAÍDA -->
    <div id="painel-saida">
      ${checkSaida ? _renderChecklistExistente(checkSaida) : _renderFormChecklist('saida', locId, loc)}
    </div>

    <!-- PAINEL ENTRADA -->
    <div id="painel-entrada" style="display:none">
      ${checkEntrada ? _renderChecklistExistente(checkEntrada) : (checkSaida ? _renderFormChecklist('entrada', locId, loc) : '<div style="text-align:center;padding:30px;color:var(--muted2)">⚠️ Faça o checklist de saída primeiro.</div>')}
    </div>

    <!-- BOTÃO DEVOLUÇÃO -->
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border2)">
      <button class="btn btn-primary" style="width:100%" onclick="confirmarDevolucao('${loc.id}','${loc.veiculo_id}','${loc.veiculos?.marca||''} ${loc.veiculos?.modelo||''}');closeModal('locacao-detalhe')">
        ✅ Confirmar devolução do veículo
      </button>
    </div>
  `;

  // Carrega itens do checklist
  await _carregarItensChecklist();
}

function showLocTab(tab){
  document.getElementById('painel-saida').style.display  = tab==='saida'  ? '' : 'none';
  document.getElementById('painel-entrada').style.display = tab==='entrada' ? '' : 'none';
  document.querySelectorAll('.loc-tab').forEach(t=>{
    const isSaida = t.id==='tab-saida';
    const active = (tab==='saida')===isSaida;
    t.style.color = active?'var(--accent)':'var(--muted)';
    t.style.borderBottomColor = active?'var(--accent)':'transparent';
    t.style.fontWeight = active?'700':'600';
  });
}

function _fmtDtLocacao(str){
  if(!str) return '—';
  try{
    const d=new Date(str);
    return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  }catch(e){ return str; }
}

// ══ RENDER CHECKLIST EXISTENTE (só leitura) ══
function _renderChecklistExistente(check){
  const itens = check.itens||[];
  const fotos = check.fotos||[];
  const consultor = check.perfis?.nome||'—';
  return `
  <div style="background:var(--bg2);border-radius:10px;padding:16px;margin-bottom:12px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
      <div><div style="font-size:10px;color:var(--muted2)">Horário</div><div style="font-weight:600;font-size:13px">${_fmtDtLocacao(check.horario)}</div></div>
      <div><div style="font-size:10px;color:var(--muted2)">Km</div><div style="font-weight:600;font-size:13px">${check.km||'—'} km</div></div>
      <div><div style="font-size:10px;color:var(--muted2)">Combustível</div><div style="font-weight:600;font-size:13px">${check.combustivel||'—'}</div></div>
      <div><div style="font-size:10px;color:var(--muted2)">Consultor</div><div style="font-weight:600;font-size:13px">${consultor}</div></div>
    </div>
    ${itens.length>0?`
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted2);margin-bottom:8px">Itens vistoriados</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      ${itens.map(it=>{
        const cor = it.status==='ok'?'#16a34a':it.status==='avaria'?'#dc2626':'#64748b';
        const icon = it.status==='ok'?'✓':it.status==='avaria'?'✕':'—';
        return `<div style="display:flex;align-items:center;gap:6px;font-size:12px;padding:4px 0;border-bottom:1px solid var(--border)">
          <span style="color:${cor};font-weight:700;width:14px">${icon}</span>
          <span style="flex:1">${it.descricao}</span>
          ${it.obs?`<span style="font-size:10px;color:var(--muted);font-style:italic">${it.obs}</span>`:''}
        </div>`;
      }).join('')}
    </div>`:''}
    ${check.observacoes?`<div style="margin-top:10px;font-size:12px;color:var(--muted)"><strong>Obs:</strong> ${check.observacoes}</div>`:''}
    ${fotos.length>0?`
    <div style="margin-top:12px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted2);margin-bottom:8px">Fotos (${fotos.length})</div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">
        ${fotos.map(url=>`<img src="${url}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid var(--border2)" onclick="window.open('${url}','_blank')">`).join('')}
      </div>
    </div>`:''}
  </div>`;
}

// ══ RENDER FORMULÁRIO DE CHECKLIST ══
function _renderFormChecklist(tipo, locId, loc){
  const label = tipo==='saida'?'Saída':'Entrada';
  return `
  <div id="form-checklist-${tipo}">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group">
        <label>Km atual</label>
        <input type="number" id="chk-km-${tipo}" placeholder="${loc.km_inicial||0}" style="width:100%">
      </div>
      <div class="form-group">
        <label>Nível de combustível</label>
        <select id="chk-comb-${tipo}" style="width:100%">
          <option>Cheio</option><option>3/4</option><option>1/2</option><option>1/4</option><option>Reserva</option>
        </select>
      </div>
      <div class="form-group">
        <label>Horário da vistoria</label>
        <input type="datetime-local" id="chk-hora-${tipo}" style="width:100%" value="${new Date(new Date().getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}">
      </div>
    </div>

    <!-- ITENS DO CHECKLIST -->
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted2);margin-bottom:10px">Itens de vistoria</div>
    <div id="chk-itens-${tipo}" style="margin-bottom:16px">
      <div style="text-align:center;padding:20px;color:var(--muted2);font-size:13px">⏳ Carregando itens...</div>
    </div>

    <!-- FOTOS -->
    <div style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted2);margin-bottom:8px">📷 Fotos (máx. 10)</div>
      <label style="display:flex;align-items:center;gap:8px;padding:12px;background:var(--bg2);border:2px dashed var(--border2);border-radius:10px;cursor:pointer;transition:border-color .15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border2)'">
        <span style="font-size:20px">📷</span>
        <div>
          <div style="font-size:13px;font-weight:500">Selecionar fotos</div>
          <div style="font-size:11px;color:var(--muted)">Até 10 fotos — JPG, PNG, WEBP</div>
        </div>
        <input type="file" accept="image/*" multiple style="display:none" onchange="_previewFotos(this,'${tipo}')">
      </label>
      <div id="fotos-preview-${tipo}" style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:8px"></div>
    </div>

    <!-- OBSERVAÇÕES -->
    <div class="form-group" style="margin-bottom:16px">
      <label>Observações da vistoria</label>
      <textarea id="chk-obs-${tipo}" rows="2" style="width:100%;resize:vertical" placeholder="Descreva avarias, itens faltantes..."></textarea>
    </div>

    <button class="btn btn-primary" style="width:100%" onclick="salvarChecklist('${tipo}','${locId}')">
      💾 Salvar vistoria de ${label}
    </button>
  </div>`;
}

// ══ CARREGA ITENS DO CHECKLIST DO BANCO ══
async function _carregarItensChecklist(){
  if(_checklistItens.length) return _renderItensNosFormularios();
  const {data} = await sb.from('checklist_itens')
    .select('*').eq('ativo',true).order('ordem');
  _checklistItens = data||[];
  _renderItensNosFormularios();
}

function _renderItensNosFormularios(){
  ['saida','entrada'].forEach(tipo=>{
    const wrap = document.getElementById(`chk-itens-${tipo}`);
    if(!wrap) return;
    if(!_checklistItens.length){
      wrap.innerHTML='<div style="color:var(--muted2);font-size:13px;text-align:center;padding:10px">Nenhum item configurado. Configure em Configurações.</div>';
      return;
    }
    // Agrupa por categoria
    const cats = {};
    _checklistItens.forEach(it=>{
      if(!cats[it.categoria]) cats[it.categoria]=[];
      cats[it.categoria].push(it);
    });
    wrap.innerHTML = Object.entries(cats).map(([cat,itens])=>`
      <div style="margin-bottom:12px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:6px;padding:4px 0;border-bottom:1px solid var(--border2)">${cat}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          ${itens.map(it=>`
          <div style="background:var(--bg2);border-radius:8px;padding:8px 10px">
            <div style="font-size:12px;font-weight:500;margin-bottom:6px">${it.descricao}</div>
            <div style="display:flex;gap:4px">
              <label style="flex:1;text-align:center;padding:4px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;border:1.5px solid #16a34a;color:#16a34a;background:transparent;transition:all .1s" onclick="_selectItem(this,'ok')">
                <input type="radio" name="chk-${tipo}-${it.id}" value="ok" style="display:none"> ✓ OK
              </label>
              <label style="flex:1;text-align:center;padding:4px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;border:1.5px solid #dc2626;color:#dc2626;background:transparent;transition:all .1s" onclick="_selectItem(this,'avaria')">
                <input type="radio" name="chk-${tipo}-${it.id}" value="avaria" style="display:none"> ✕ Avaria
              </label>
              <label style="flex:1;text-align:center;padding:4px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;border:1.5px solid var(--muted2);color:var(--muted);background:transparent;transition:all .1s selected-nv" onclick="_selectItem(this,'nao_verificado')">
                <input type="radio" name="chk-${tipo}-${it.id}" value="nao_verificado" style="display:none"> — N/V
              </label>
            </div>
            <input type="text" placeholder="Obs (opcional)" style="width:100%;font-size:11px;margin-top:4px;padding:3px 6px;border-radius:4px"
              id="chk-obs-item-${tipo}-${it.id}">
          </div>`).join('')}
        </div>
      </div>`).join('');
  });
}

function _selectItem(label, status){
  const parent = label.closest('div[style*="display:flex"]');
  if(!parent) return;
  parent.querySelectorAll('label').forEach(l=>{
    l.style.background='transparent';
    l.style.color = l.classList.contains('selected-nv')||l.textContent.includes('N/V')?'var(--muted)':l.textContent.includes('OK')?'#16a34a':'#dc2626';
  });
  const colors = {ok:'#16a34a', avaria:'#dc2626', nao_verificado:'var(--muted2)'};
  const bgColors = {ok:'rgba(22,163,74,.1)', avaria:'rgba(220,38,38,.1)', nao_verificado:'rgba(100,116,139,.08)'};
  label.style.background = bgColors[status];
  label.style.color = colors[status];
  label.querySelector('input[type=radio]').checked = true;
}

// ══ PREVIEW DE FOTOS ══
function _previewFotos(input, tipo){
  const files = Array.from(input.files).slice(0,10);
  const wrap = document.getElementById(`fotos-preview-${tipo}`);
  if(!wrap) return;
  wrap.innerHTML = '';
  window[`_fotos_${tipo}`] = files;
  files.forEach((file,i)=>{
    const reader = new FileReader();
    reader.onload = e=>{
      const div = document.createElement('div');
      div.style.cssText='position:relative';
      div.innerHTML=`
        <img src="${e.target.result}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;border:1px solid var(--border2)">
        <button onclick="this.parentElement.remove();window['_fotos_${tipo}'].splice(${i},1)"
          style="position:absolute;top:3px;right:3px;background:rgba(0,0,0,.6);border:none;color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>`;
      wrap.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

// ══ SALVAR CHECKLIST ══
async function salvarChecklist(tipo, locId){
  const km     = parseInt(document.getElementById(`chk-km-${tipo}`)?.value)||null;
  const comb   = document.getElementById(`chk-comb-${tipo}`)?.value||'';
  const hora   = document.getElementById(`chk-hora-${tipo}`)?.value||new Date().toISOString();
  const obs    = document.getElementById(`chk-obs-${tipo}`)?.value||'';
  const fotos  = window[`_fotos_${tipo}`]||[];

  const btn = document.querySelector(`#form-checklist-${tipo} .btn-primary`);
  if(btn){ btn.disabled=true; btn.textContent='Salvando...'; }

  try{
    // Coleta itens do formulário
    const itens = _checklistItens.map(it=>{
      const radios = document.querySelectorAll(`input[name="chk-${tipo}-${it.id}"]`);
      const checked = [...radios].find(r=>r.checked);
      const obsItem = document.getElementById(`chk-obs-item-${tipo}-${it.id}`)?.value||'';
      return {
        id:it.id, descricao:it.descricao, categoria:it.categoria,
        status: checked?.value||'nao_verificado',
        obs: obsItem
      };
    });

    // Upload das fotos para Supabase Storage
    const fotoUrls = [];
    for(const file of fotos){
      const ext = file.name.split('.').pop();
      const path = `${locId}/${tipo}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const {data:up, error:upErr} = await sb.storage.from('checklists').upload(path, file);
      if(upErr) throw upErr;
      const {data:urlData} = sb.storage.from('checklists').getPublicUrl(path);
      fotoUrls.push(urlData.publicUrl);
    }

    // Salva checklist no banco
    const {error} = await sb.from('checklists').insert({
      locacao_id: locId,
      tipo,
      km,
      combustivel: comb,
      horario: hora,
      consultor_id: currentUser?.id,
      itens,
      observacoes: obs,
      fotos: fotoUrls
    });
    if(error) throw error;

    notify(`Vistoria de ${tipo==='saida'?'saída':'entrada'} salva!`,'success');
    // Reabre o modal atualizado
    closeModal('locacao-detalhe');
    setTimeout(()=>abrirModalLocacao(locId), 200);
  }catch(e){
    notify('Erro: '+e.message,'error');
    if(btn){ btn.disabled=false; btn.textContent=`💾 Salvar vistoria de ${tipo==='saida'?'Saída':'Entrada'}`; }
  }
}
