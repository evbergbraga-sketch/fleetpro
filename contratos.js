// contratos.js — Contratos e calendário

// ══ CONTRATOS ══
function populateContratosSelects(){
  const cs=document.getElementById('c-cli');
  if(cs) cs.innerHTML=allClientes.map(c=>`<option value="${c.id}" data-nome="${c.nome}">${c.nome}</option>`).join('');
  const vs=document.getElementById('c-vei');
  const disp=allVeiculos.filter(v=>v.status==='disponivel');
  if(vs){ vs.innerHTML=disp.map(v=>`<option value="${v.id}" data-diaria="${v.diaria}" data-placa="${v.placa}">${v.marca} ${v.modelo} — ${v.placa}</option>`).join(''); autoFillDiaria(); }
}
function autoFillDiaria(){
  const opt=document.getElementById('c-vei')?.selectedOptions[0];
  if(opt) document.getElementById('c-dia').value=opt.dataset.diaria||'';
  previewContrato();
}
function previewContrato(){
  const cOpt=document.getElementById('c-cli')?.selectedOptions[0];
  const vOpt=document.getElementById('c-vei')?.selectedOptions[0];
  const ini=document.getElementById('c-ini')?.value;
  const fim=document.getElementById('c-fim')?.value;
  const dia=parseFloat(document.getElementById('c-dia')?.value)||0;
  const km=document.getElementById('c-km')?.value||'—';
  const obs=document.getElementById('c-obs')?.value||'—';
  const dias=ini&&fim?Math.max(1,Math.ceil((new Date(fim)-new Date(ini))/86400000)):1;
  const total=(dia*dias).toFixed(2).replace('.',',');
  document.getElementById('ct-cli').textContent=cOpt?.dataset.nome||'___';
  document.getElementById('ct-cli2').textContent=cOpt?.dataset.nome||'___';
  document.getElementById('ct-vei').textContent=vOpt?.text||'___';
  document.getElementById('ct-ini').textContent=ini?fmtData(ini):'__/__/____';
  document.getElementById('ct-fim').textContent=fim?fmtData(fim):'__/__/____';
  document.getElementById('ct-dias').textContent=dias;
  document.getElementById('ct-total').textContent=total;
  document.getElementById('ct-km').textContent=km;
  document.getElementById('ct-obs').textContent=obs;
  document.getElementById('ct-data').textContent=new Date().toLocaleDateString('pt-BR');
  return {dias,totalVal:dia*dias};
}
['c-cli','c-vei','c-ini','c-fim','c-dia','c-km','c-obs'].forEach(id=>{
  const el=document.getElementById(id);
  if(el){el.addEventListener('input',previewContrato);el.addEventListener('change',previewContrato);}
});

async function registrarContrato(){
  const {dias,totalVal}=previewContrato();
  const cid=document.getElementById('c-cli')?.value;
  const vid=document.getElementById('c-vei')?.value;
  const ini=document.getElementById('c-ini')?.value;
  const fim=document.getElementById('c-fim')?.value;
  const dia=parseFloat(document.getElementById('c-dia')?.value)||0;
  const km=parseInt(document.getElementById('c-km')?.value)||0;
  const obs=document.getElementById('c-obs')?.value||'';
  if(!cid||!vid||!ini||!fim){notify('Preencha todos os campos','error');return;}
  const {data:locSalva,error}=await sb.from('locacoes').insert({
    veiculo_id:vid,cliente_id:cid,data_inicio:ini,data_fim:fim,
    km_inicial:km,diaria:dia,total:totalVal,observacoes:obs,
    criado_por:currentUser?.id
  }).select().single();
  if(error){notify('Erro: '+error.message,'error');return;}
  await sb.from('veiculos').update({status:'alugado'}).eq('id',vid);
  notify('Contrato registrado! Veículo marcado como alugado.','success');
  await carregarTudo();
  // Envia automaticamente pelo WhatsApp se cliente tiver telefone
  const c = allClientes.find(x=>x.id===cid);
  const v = allVeiculos.find(x=>x.id===vid);
  if(c?.telefone){
    const txt = '📄 *CONTRATO DE LOCAÇÃO — FleetPro*\n\n'
      + '👤 Cliente: '+c.nome+'\n📋 CPF: '+c.cpf+'\n'
      + '\n🚗 Veículo: '+(v?.marca||'')+' '+(v?.modelo||'')+' — '+(v?.placa||'')+'\n'
      + '📅 Período: '+fmtData(ini)+' a '+fmtData(fim)+' ('+dias+' dias)\n'
      + '💰 Diária: R$ '+dia.toFixed(2)+' · Total: R$ '+totalVal.toFixed(2)+'\n'
      + '\n✅ Contrato registrado no sistema FleetPro.\n_Equipe FleetPro 🚗🏍️_';
    try{
      await evoSendText(c.telefone, txt);
      await salvarMsgDB(cid, c.telefone, txt, 'text', 'saida', null);
      notify('Contrato também enviado pelo WhatsApp! ✓','success');
    }catch(e){ console.warn('WPP contrato:', e.message); }
  }
}

// ══ CALENDÁRIO ══
function renderCal(){
  document.getElementById('cal-titulo').textContent=MONTHS[calMonth]+' '+calYear;
  const first=new Date(calYear,calMonth,1).getDay();
  const days=new Date(calYear,calMonth+1,0).getDate();
  const today=new Date();
  const busy={};
  allLocacoes.forEach(l=>{
    for(let d=new Date(l.data_inicio);d<=new Date(l.data_fim);d.setDate(d.getDate()+1)){
      if(d.getFullYear()===calYear&&d.getMonth()===calMonth){
        const k=d.getDate();
        if(!busy[k]) busy[k]=[];
        busy[k].push(l.veiculos?.tipo||'carro');
      }
    }
  });
  let html='';
  for(let i=0;i<first;i++) html+=`<div class="cal-day other">${new Date(calYear,calMonth,-first+i+1).getDate()}</div>`;
  for(let d=1;d<=days;d++){
    const isT=d===today.getDate()&&calMonth===today.getMonth()&&calYear===today.getFullYear();
    const types=[...new Set(busy[d]||[])];
    const dots=types.map(t=>`<div class="dot" style="background:${t==='carro'?'#3b82f6':'#f5a623'}"></div>`).join('');
    html+=`<div class="cal-day ${isT?'today':''}" onclick="calSelectDay(${d})"><span>${d}</span>${dots?`<div class="dots">${dots}</div>`:''}</div>`;
  }
  document.getElementById('cal-grid').innerHTML=html;
}
function changeMonth(dir){calMonth+=dir;if(calMonth>11){calMonth=0;calYear++;}if(calMonth<0){calMonth=11;calYear--;}renderCal();}

async function calSelectDay(d){
  document.getElementById('cal-sel-date').textContent=`${d} de ${MONTHS[calMonth]}`;
  const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const {data:locs}=await sb.from('locacoes').select('*,veiculos(*)').lte('data_inicio',ds).gte('data_fim',ds).eq('status','ativa');
  const locIds=(locs||[]).map(l=>l.veiculo_id);
  document.getElementById('cal-veic-list').innerHTML=allVeiculos.map(v=>{
    const b=v.status==='manutencao'?'badge-yellow':locIds.includes(v.id)?'badge-red':'badge-green';
    const lb=v.status==='manutencao'?'Manutenção':locIds.includes(v.id)?'Alugado':'Disponível';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)"><div style="display:flex;align-items:center;gap:8px"><div class="vi ${v.tipo==='carro'?'vi-car':'vi-moto'}">${v.tipo==='carro'?'🚗':'🏍️'}</div><div><div style="font-size:13px;font-weight:500">${v.marca} ${v.modelo}</div><div style="font-size:11px;color:var(--muted)">${v.placa}</div></div></div><span class="badge ${b}">${lb}</span></div>`;
  }).join('')||'<p style="color:var(--muted2)">Sem veículos.</p>';
}

