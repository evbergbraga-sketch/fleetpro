// veiculos.js — Gestão de veículos

function statusBadge(s){
  return s==='disponivel'?'<span class="badge badge-green">Disponível</span>':
         s==='alugado'?'<span class="badge badge-red">Alugado</span>':
         '<span class="badge badge-yellow">Manutenção</span>';
}

function renderVeiculos(){
  const map={carro:'carros', moto:'motos'};
  Object.entries(map).forEach(([tipo,key])=>{
    const search=(document.getElementById(`s-${key}`)?.value||'').toLowerCase();
    const sf=document.getElementById(`f-${key}`)?.value||'';
    const data=allVeiculos.filter(v=>v.tipo===tipo&&(!sf||v.status===sf)&&(!search||`${v.marca} ${v.modelo} ${v.placa}`.toLowerCase().includes(search)));
    const tb=document.getElementById(`tb-${key}`);
    if(!tb) return;
    const canEdit=['admin','atendente'].includes(currentPerfil?.perfil);
    tb.innerHTML=data.length?data.map(v=>{
      const inv = allPerfis.find(p=>p.id===v.investidor_id);
      const invBadge = inv ? `<span style="font-size:10px;color:var(--purple);background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.2);border-radius:4px;padding:2px 6px">📈 ${inv.nome.split(' ')[0]}</span>` : '';
      return `
      <tr>
        <td><div style="display:flex;align-items:center;gap:8px">
          <div class="vi ${v.tipo==='carro'?'vi-car':'vi-moto'}">${v.tipo==='carro'?'🚗':'🏍️'}</div>
          <div>
            <div style="font-weight:500">${v.marca} ${v.modelo}</div>
            <div style="font-size:11px;color:var(--muted)">${v.cor||''} · ${v.cambio||''} ${invBadge}</div>
          </div>
        </div></td>
        <td>${v.placa}</td>
        <td>${v.ano||'—'}</td>
        <td>${(v.km_atual||0).toLocaleString('pt-BR')}</td>
        <td style="color:var(--accent);font-weight:600">R$ ${(v.diaria||0).toFixed(2)}</td>
        <td>${statusBadge(v.status)}</td>
        <td>${canEdit?`<button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="verHistorico('${v.id}')">Histórico</button>`:'—'}</td>
      </tr>`;
    }).join('')
    :'<tr class="empty-row"><td colspan="7">Nenhum veículo encontrado</td></tr>';
  });
}

// Preenche o select de investidores no modal de veículo
function preencherSelectInvestidores(){
  const sel = document.getElementById('mv-investidor');
  if(!sel) return;
  const investidores = allPerfis.filter(p=>p.perfil==='investidor');
  sel.innerHTML = '<option value="">— Nenhum (frota própria)</option>' +
    investidores.map(p=>`<option value="${p.id}">${p.nome}</option>`).join('');
}

async function salvarVeiculo(){
  const tipo        = document.getElementById('mv-tipo').value;
  const marca       = document.getElementById('mv-marca').value.trim();
  const modelo      = document.getElementById('mv-modelo').value.trim();
  const placa       = document.getElementById('mv-placa').value.trim().toUpperCase();
  const ano         = parseInt(document.getElementById('mv-ano').value)||null;
  const cor         = document.getElementById('mv-cor').value.trim();
  const cambio      = document.getElementById('mv-cambio').value;
  const km          = parseInt(document.getElementById('mv-km').value)||0;
  const diaria      = parseFloat(document.getElementById('mv-diaria').value)||0;
  const obs         = document.getElementById('mv-obs').value.trim();
  const investidor_id = document.getElementById('mv-investidor')?.value || null;

  if(!marca||!modelo||!placa){notify('Marca, modelo e placa são obrigatórios','error');return;}
  if(!diaria){notify('Informe o valor da diária','error');return;}

  const btn = document.querySelector('#m-veiculo .btn-primary');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  try{
    const {data,error}=await sb.from('veiculos').insert({
      tipo,marca,modelo,placa,ano,cor,cambio,km_atual:km,diaria,observacoes:obs,
      investidor_id: investidor_id||null
    }).select().single();
    if(error) throw error;
    notify('Veículo cadastrado com sucesso!','success');
    closeModal('veiculo');
    ['mv-marca','mv-modelo','mv-placa','mv-ano','mv-cor','mv-km','mv-diaria','mv-obs'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });
    const sel=document.getElementById('mv-investidor'); if(sel) sel.value='';
    await loadVeiculos();
    renderDashboard();
  }catch(e){
    console.error('salvarVeiculo erro:', e);
    notify('Erro ao salvar: '+e.message,'error');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='✓ Salvar';}
  }
}
