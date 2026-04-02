// reservas.js — Gestão de reservas

// ══ RENDER LISTA ══
function renderReservas(){
  const tb = document.getElementById('tb-reservas');
  if(!tb) return;
  const ativas = allReservas.filter(r=>r.status==='ativa');
  const outras = allReservas.filter(r=>r.status!=='ativa');
  const todas  = [...ativas, ...outras];
  if(!todas.length){
    tb.innerHTML='<tr class="empty-row"><td colspan="7">Nenhuma reserva encontrada</td></tr>';
    return;
  }
  const canEdit = ['admin','atendente'].includes(currentPerfil?.perfil);
  tb.innerHTML = todas.map(r=>{
    const cli  = allClientes.find(c=>c.id===r.cliente_id);
    const veic = allVeiculos.find(v=>v.id===r.veiculo_id);
    const badge = r.status==='ativa'
      ? '<span class="badge badge-blue">Ativa</span>'
      : r.status==='convertida'
      ? '<span class="badge badge-green">Convertida</span>'
      : r.status==='cancelada'
      ? '<span class="badge badge-red">Cancelada</span>'
      : '<span class="badge badge-gray">Expirada</span>';

    const valorPago = r.valor_pago > 0
      ? `<span style="color:var(--green);font-weight:600">R$ ${Number(r.valor_pago).toFixed(2).replace('.',',')}</span>`
      : '<span style="color:var(--muted2)">—</span>';

    const acoes = canEdit && r.status==='ativa' ? `
      <div style="display:flex;gap:6px">
        <button class="btn btn-primary" style="font-size:11px;padding:5px 10px" onclick="converterReservaContrato('${r.id}')">📄 Contrato</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="cancelarReserva('${r.id}')">✕ Cancelar</button>
      </div>` : '—';

    return `<tr>
      <td>
        <div style="font-weight:500">${cli?.nome||'—'}</div>
        <div style="font-size:11px;color:var(--muted)">${cli?.telefone||''}</div>
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="vi ${veic?.tipo==='carro'?'vi-car':'vi-moto'}">${veic?.tipo==='carro'?'🚗':'🏍️'}</div>
          <div>
            <div style="font-weight:500">${veic?.marca||'—'} ${veic?.modelo||''}</div>
            <div style="font-size:11px;color:var(--muted)">${veic?.placa||''}</div>
          </div>
        </div>
      </td>
      <td>
        <div>${fmtDt(r.data_inicio)}</div>
      </td>
      <td>
        <div>${fmtDt(r.data_fim)}</div>
      </td>
      <td>${valorPago}</td>
      <td>${badge}</td>
      <td>${acoes}</td>
    </tr>`;
  }).join('');
}

// ══ ABRIR MODAL NOVA RESERVA ══
function abrirModalReserva(){
  // Popula clientes
  const selCli = document.getElementById('res-cli');
  if(selCli) selCli.innerHTML = allClientes.map(c=>`<option value="${c.id}" data-tel="${c.telefone||''}">${c.nome}</option>`).join('');

  // Popula veículos disponíveis e reservados
  const selVei = document.getElementById('res-vei');
  if(selVei){
    const disponiveis = allVeiculos.filter(v=>v.status==='disponivel'||v.status==='reservado');
    selVei.innerHTML = disponiveis.map(v=>`<option value="${v.id}">${v.marca} ${v.modelo} — ${v.placa} ${v.status==='reservado'?'(reservado)':''}</option>`).join('');
  }

  // Data início padrão: agora
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  const agoraStr = agora.toISOString().slice(0,16);
  const el = document.getElementById('res-ini');
  if(el) el.value = agoraStr;

  // Limpa outros campos
  ['res-fim','res-valor','res-obs'].forEach(id=>{
    const e = document.getElementById(id); if(e) e.value='';
  });

  document.getElementById('m-reserva').classList.add('show');
}

// ══ SALVAR RESERVA ══
async function salvarReserva(){
  const cid    = document.getElementById('res-cli')?.value;
  const vid    = document.getElementById('res-vei')?.value;
  const ini    = document.getElementById('res-ini')?.value;
  const fim    = document.getElementById('res-fim')?.value;
  const valor  = parseFloat(document.getElementById('res-valor')?.value||'0')||0;
  const obs    = document.getElementById('res-obs')?.value||'';

  if(!cid||!vid||!ini||!fim){notify('Preencha cliente, veículo e datas','error');return;}
  if(new Date(fim)<=new Date(ini)){notify('Data fim deve ser após data início','error');return;}

  const btn = document.querySelector('#m-reserva .btn-primary');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}

  try{
    const {error:errRes} = await sb.from('reservas').insert({
      cliente_id: cid,
      veiculo_id: vid,
      data_inicio: ini,
      data_fim: fim,
      valor_pago: valor,
      observacoes: obs,
      status: 'ativa',
      criado_por: currentUser?.id
    });
    if(errRes) throw errRes;

    // Marca veículo como reservado
    await sb.from('veiculos').update({status:'reservado'}).eq('id',vid);

    notify('Reserva criada! Veículo marcado como reservado.','success');
    closeModal('reserva');
    await carregarTudo();
    renderReservas();
  }catch(e){
    notify('Erro: '+e.message,'error');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='✓ Confirmar reserva';}
  }
}

// ══ CANCELAR RESERVA ══
async function cancelarReserva(id){
  if(!confirm('Cancelar esta reserva? O veículo voltará a ficar disponível.')) return;
  const r = allReservas.find(x=>x.id===id);
  if(!r) return;

  await sb.from('reservas').update({status:'cancelada'}).eq('id',id);

  // Só libera veículo se não tiver outra reserva ativa no mesmo veículo
  const outraReserva = allReservas.find(x=>x.id!==id&&x.veiculo_id===r.veiculo_id&&x.status==='ativa');
  if(!outraReserva){
    await sb.from('veiculos').update({status:'disponivel'}).eq('id',r.veiculo_id);
  }

  notify('Reserva cancelada.','success');
  await carregarTudo();
  renderReservas();
}

// ══ CONVERTER RESERVA → CONTRATO ══
async function converterReservaContrato(id){
  const r = allReservas.find(x=>x.id===id);
  if(!r) return;

  const cli  = allClientes.find(c=>c.id===r.cliente_id);
  const veic = allVeiculos.find(v=>v.id===r.veiculo_id);

  // Pré-preenche a tela de contratos com os dados da reserva
  goPage('contratos');

  setTimeout(()=>{
    // Cliente
    const selCli = document.getElementById('c-cli');
    if(selCli){ selCli.value = r.cliente_id; }

    // Veículo — adiciona o veículo reservado no select mesmo que não esteja "disponivel"
    const selVei = document.getElementById('c-vei');
    if(selVei){
      // Garante que o veículo reservado aparece na lista
      const jaExiste = selVei.querySelector(`option[value="${r.veiculo_id}"]`);
      if(!jaExiste && veic){
        const opt = document.createElement('option');
        opt.value = veic.id;
        opt.dataset.diaria = veic.diaria;
        opt.dataset.placa  = veic.placa;
        opt.textContent = `${veic.marca} ${veic.modelo} — ${veic.placa}`;
        selVei.insertBefore(opt, selVei.firstChild);
      }
      selVei.value = r.veiculo_id;
      autoFillDiaria();
    }

    // Datas — extrai só a parte da data (YYYY-MM-DD)
    const dataIni = r.data_inicio?.slice(0,10)||'';
    const dataFim = r.data_fim?.slice(0,10)||'';
    const elIni = document.getElementById('c-ini');
    const elFim = document.getElementById('c-fim');
    if(elIni) elIni.value = dataIni;
    if(elFim) elFim.value = dataFim;

    // Observações — menciona valor já pago
    const elObs = document.getElementById('c-obs');
    let obsTexto = 'Veículo em perfeito estado. Cliente responsável por multas.';
    if(r.valor_pago > 0){
      obsTexto += `\nReserva convertida — valor já pago: R$ ${Number(r.valor_pago).toFixed(2).replace('.',',')}`;
    }
    if(r.observacoes) obsTexto += `\n${r.observacoes}`;
    if(elObs) elObs.value = obsTexto;

    // Sinaliza reserva de origem para abater no total
    window._reservaOrigemId    = id;
    window._reservaValorPago   = r.valor_pago||0;
    window._reservaVeiculoId   = r.veiculo_id;

    previewContrato();

    // Mostra aviso de abatimento se houver valor pago
    if(r.valor_pago > 0){
      notify(`Reserva com R$ ${Number(r.valor_pago).toFixed(2).replace('.',',')} já pago — será abatido do total.`,'success');
    }
  }, 300);
}

// ══ EXPIRAR RESERVAS AUTOMATICAMENTE ══
async function expirarReservas(){
  if(!sb) return;
  const hoje = new Date().toISOString();
  const {data:expiradas} = await sb.from('reservas')
    .select('id,veiculo_id')
    .eq('status','ativa')
    .lt('data_fim', hoje);

  if(!expiradas?.length) return;

  for(const r of expiradas){
    await sb.from('reservas').update({status:'expirada'}).eq('id',r.id);
    // Libera veículo se não tiver outra reserva ativa
    const {data:outras} = await sb.from('reservas')
      .select('id').eq('veiculo_id',r.veiculo_id).eq('status','ativa');
    if(!outras?.length){
      await sb.from('veiculos').update({status:'disponivel'}).eq('id',r.veiculo_id);
    }
  }

  if(expiradas.length > 0){
    console.log(`[Reservas] ${expiradas.length} reserva(s) expirada(s) automaticamente.`);
    await carregarTudo();
    renderReservas();
  }
}
