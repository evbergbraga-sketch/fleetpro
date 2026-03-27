// historico.js — Histórico e manutenções

// ══ HISTÓRICO ══
function renderHistVeiculosList(){filtrarHistVeiculos();}
function filtrarHistVeiculos(){
  const s=(document.getElementById('s-hist')?.value||'').toLowerCase();
  const data=allVeiculos.filter(v=>!s||`${v.marca} ${v.modelo} ${v.placa}`.toLowerCase().includes(s));
  document.getElementById('tb-hist-veic').innerHTML=data.map(v=>`<tr style="cursor:pointer;${histVeiculoId===v.id?'background:rgba(245,166,35,.06)':''}" onclick="verHistorico('${v.id}')"><td><div style="font-weight:500">${v.marca} ${v.modelo}${histVeiculoId===v.id?' <span style="font-size:10px;color:var(--accent)">📌</span>':''}</div></td><td>${v.placa}</td></tr>`).join('')||'<tr class="empty-row"><td colspan="2">Nenhum</td></tr>';
}

async function verHistorico(vid){
  histVeiculoId=vid;filtrarHistVeiculos();
  const v=allVeiculos.find(x=>x.id===vid);
  if(v) document.getElementById('hist-title').textContent=`${v.marca} ${v.modelo} — ${v.placa}`;
  const [{data:locs},{data:mans}]=await Promise.all([
    sb.from('locacoes').select('*,clientes(nome)').eq('veiculo_id',vid).order('created_at',{ascending:false}),
    sb.from('manutencoes').select('*').eq('veiculo_id',vid).order('created_at',{ascending:false}),
  ]);
  const items=[...(locs||[]).map(l=>({...l,_t:'loc'})),...(mans||[]).map(m=>({...m,_t:'maint'}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const tl=document.getElementById('hist-tl');
  tl.innerHTML=items.length?items.map(i=>{
    if(i._t==='loc'){
      const dias = i.data_inicio&&i.data_fim ? Math.ceil((new Date(i.data_fim)-new Date(i.data_inicio))/86400000) : '?';
      const statusBadge = i.status==='ativa' ? '<span class="badge badge-green">Ativa</span>' : i.status==='encerrada' ? '<span class="badge badge-blue">Encerrada</span>' : '<span class="badge badge-red">Cancelada</span>';
      return `<div class="tl-item"><div class="tl-dot rental"></div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
          <div class="tl-title">Locação — ${i.clientes?.nome||'—'}</div>${statusBadge}
        </div>
        <div class="tl-sub">📅 ${fmtData(i.data_inicio)} a ${fmtData(i.data_fim)} · ${dias} dias</div>
        <div class="tl-sub">💰 R$ ${(i.diaria||0).toFixed(2)}/dia · Total: R$ ${(i.total||0).toFixed(2)}</div>
        <div class="tl-sub">🔑 Km inicial: ${i.km_inicial||'—'}${i.km_final?' · Km final: '+i.km_final:''}</div>
        <div class="tl-date">${fmtDt(i.created_at)}</div></div>`;
    } else {
      return `<div class="tl-item"><div class="tl-dot maint"></div>
        <div class="tl-title">Manutenção — ${i.tipo}</div>
        <div class="tl-sub">${i.oficina||'—'}${i.custo?' · R$ '+parseFloat(i.custo).toFixed(2):''}</div>
        ${i.descricao?`<div class="tl-sub">${i.descricao}</div>`:''}
        <div class="tl-date">${fmtDt(i.created_at)}</div></div>`;
    }
  }).join(''):'<p style="color:var(--muted2);font-size:13px">Sem histórico ainda. Cadastre uma locação ou manutenção.</p>';
  goPage('historico');
}

async function salvarManutencao(){
  const obj={veiculo_id:document.getElementById('mm-vei').value,tipo:document.getElementById('mm-tipo').value.trim(),descricao:document.getElementById('mm-desc').value,oficina:document.getElementById('mm-ofic').value.trim(),custo:parseFloat(document.getElementById('mm-custo').value)||0,data_inicio:document.getElementById('mm-ini').value,data_fim:document.getElementById('mm-fim').value||null};
  if(!obj.veiculo_id||!obj.tipo||!obj.data_inicio){notify('Preencha os campos obrigatórios','error');return;}
  await sb.from('veiculos').update({status:'manutencao'}).eq('id',obj.veiculo_id);
  const {error}=await sb.from('manutencoes').insert(obj);
  if(error){notify('Erro: '+error.message,'error');return;}
  notify('Manutenção registrada!','success');
  closeModal('manutencao');
  await loadVeiculos();await loadManutencoes();renderDashboard();
  if(histVeiculoId===obj.veiculo_id) verHistorico(histVeiculoId);
}

