// contratos.js — Contratos, calendário e geração de PDF

// ══ LOGO BASE64 (embutida para o PDF) ══
const ROYAL_LOGO_B64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIbGNtcwIQAABtbnRyUkdCIFhZWiAH4gADABQACQAOAB1hY3NwTVNGVAAAAABzYXdzY3RybAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWhhbmSdkQA9QICwPUB0LIGepSKOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAABxjcHJ0AAABDAAAAAx3dHB0AAABGAAAABRyWFlaAAABLAAAABRnWFlaAAABQAAAABRiWFlaAAABVAAAABRyVFJDAAABaAAAAGBnVFJDAAABaAAAAGBiVFJDAAABaAAAAGBkZXNjAAAAAAAAAAV1UkdCAAAAAAAAAAAAAAAAdGV4dAAAAABDQzAAWFlaIAAAAAAAAPNUAAEAAAABFslYWVogAAAAAAAAb6AAADjyAAADj1hZWiAAAAAAAABilgAAt4kAABjaWFlaIAAAAAAAACSgAAAPhQAAtsRjdXJ2AAAAAAAAACoAAAB8APgBnAJ1A4MEyQZOCBIKGAxiDvQRzxT2GGocLiBDJKwpai5+M+s5sz/WRldNNlR2XBdkHWyGdVZ+jYgskjacq6eMstu+mcrH12Xkd/H5////2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAH0AfQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD7LooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBO1FJnArjNV8dxQ3VxbaRpN3qxtm23EkRVI4z3AZjyfYZrmxGLpYaPNVlZFwpyqO0Vc7IcU4dK5jwb4y0vxMJorYS215BjzbacAOvuMHBHv/ACrph0q6NaFaCnTd0xThKDtJWY6iiitiQooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiijIoAKKKKACkwMVTu9T020mWK6v7WCRvupJMqk/QE1aUhhkHI9ulRGcZOyewNNK5X1JZX064S2O2YxMIz6Ng4/Wvm/w941fR9Bk0ZojDcRM6zIwwwbJznPfNfTJr5w+L9lZ6h8S9Qe2gjQW9vFFMUAG+QgsScdTggfhXyfFlGLoRquVraHrZTJOo4NXuHwUuLzVPiot1ahjDFbv9pcdADjAPbOa+kK8k/Zt+ywaHqdgsMaXUF0TIwADMpGVz3I4xXrfWvT4foxpYKPK73MMxnzV3psLxScVFPNFBEZJpEiRRks5AAHuT0ptndW13H5lrcQzp03RuGH5ivZ5435b6nDZ2uWKKKKsQUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQ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Dj/oQfC3/gog/wDiKz/s99zL+zH/ADH5r7jRuNfpR/wrL4cf9CD4W/8ABRB/8RR/wrL4cf8AQg+Fv/BRB/8AEUf2e+4f2Y/5j818mjJr9KP+FZfDj/oQfC3/AIKIP/iKF+Gnw6U5XwF4XUjoRpMA/wDZKP7PfcP7Mf8AMfmvk11XhD4eeN/FsyR6D4a1C6R8fvzEY4QPUyPhB+eTjjNfopYeGvDunlTYaFplqV6eTaomPpgcVq9OgxVxwC6suOWL7TPEP2ffgRY+AHTX9flh1LxGykKyDMNoCMER5GS2ONxx1IAHJPuGKM+tGOK7qdNQVoo9KnTjTVoi0UUVZoFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAH/9k=';

// ══ NÚMERO DO CONTRATO (sequencial localStorage) ══
function _proximoNumContrato(){
  const n = parseInt(localStorage.getItem('fp_contrato_seq')||'0') + 1;
  localStorage.setItem('fp_contrato_seq', String(n));
  return n;
}
function _peekNumContrato(){
  return parseInt(localStorage.getItem('fp_contrato_seq')||'0') + 1;
}

// ══ TIPO DE CONTRATO ATIVO ══
let _tipoContrato = 'moto'; // 'moto' | 'carro'

function selecionarTipoContrato(tipo){
  _tipoContrato = tipo;
  // Atualiza botões
  document.querySelectorAll('.btn-tipo-contrato').forEach(b=>{
    b.classList.toggle('active', b.dataset.tipo===tipo);
  });
  // Mostra/esconde campos específicos
  document.getElementById('campos-moto').style.display  = tipo==='moto'  ? '' : 'none';
  document.getElementById('campos-carro').style.display = tipo==='carro' ? '' : 'none';
  document.getElementById('label-valor-principal').textContent = tipo==='moto' ? 'Valor semanal (R$)' : 'Diária (R$)';
  document.getElementById('label-periodo').textContent = tipo==='moto' ? 'Período (semanas)' : 'Período (dias)';
  // Reseta origem de reserva ao trocar tipo
  window._reservaOrigemId  = null;
  window._reservaValorPago = 0;
  previewContrato();
}

// ══ POPULA SELECTS ══
function populateContratosSelects(){
  const cs = document.getElementById('c-cli');
  if(cs) cs.innerHTML = allClientes.map(c=>`<option value="${c.id}" data-nome="${c.nome}" data-cpf="${c.cpf||''}" data-tel="${c.telefone||''}">${c.nome}</option>`).join('');

  const vs = document.getElementById('c-vei');
  const disp = allVeiculos.filter(v=>v.status==='disponivel'||v.status==='reservado');
  if(vs){
    vs.innerHTML = disp.map(v=>`<option value="${v.id}" data-diaria="${v.diaria}" data-placa="${v.placa}" data-tipo="${v.tipo}" data-modelo="${v.marca} ${v.modelo}">${v.marca} ${v.modelo} — ${v.placa}${v.status==='reservado'?' (reservado)':''}</option>`).join('');
    autoFillContrato();
  }

  // Pré-seleciona tipo baseado no veículo se vier de reserva
  previewContrato();
  _atualizarNumContrato();
}

function _atualizarNumContrato(){
  const el = document.getElementById('ct-num');
  if(el) el.textContent = _peekNumContrato();
  const elForm = document.getElementById('c-num-display');
  if(elForm) elForm.textContent = `Contrato #${_peekNumContrato()}`;
}

function autoFillContrato(){
  const opt = document.getElementById('c-vei')?.selectedOptions[0];
  if(!opt) return;
  document.getElementById('c-dia').value = opt.dataset.diaria||'';
  // Auto-seleciona tipo pelo veículo
  const tipoVeic = opt.dataset.tipo;
  if(tipoVeic) selecionarTipoContrato(tipoVeic);
  previewContrato();
}

// ══ PREVIEW ══
function previewContrato(){
  const cOpt  = document.getElementById('c-cli')?.selectedOptions[0];
  const vOpt  = document.getElementById('c-vei')?.selectedOptions[0];
  const ini   = document.getElementById('c-ini')?.value;
  const fim   = document.getElementById('c-fim')?.value;
  const dia   = parseFloat(document.getElementById('c-dia')?.value)||0;
  const km    = document.getElementById('c-km')?.value||'—';
  const obs   = document.getElementById('c-obs')?.value||'';
  const caucao= parseFloat(document.getElementById('c-caucao')?.value)||0;
  const pgto  = document.getElementById('c-pgto')?.value||'PIX';
  const condutor = document.getElementById('c-condutor')?.value||'';
  const condutorCpf = document.getElementById('c-condutor-cpf')?.value||'';

  // Período
  const periodoVal = parseInt(document.getElementById('c-periodo')?.value)||1;
  const isMoto = _tipoContrato === 'moto';

  let totalBruto = 0;
  let diasLabel = '';
  if(isMoto){
    totalBruto = dia * periodoVal;
    diasLabel  = `${periodoVal} semana${periodoVal!==1?'s':''}`;
  } else {
    const days = ini&&fim ? Math.max(1,Math.ceil((new Date(fim)-new Date(ini))/86400000)) : periodoVal;
    totalBruto = dia * days;
    diasLabel  = `${days} dia${days!==1?'s':''}`;
    // Extras carro
    const taxaLoc = parseFloat(document.getElementById('c-taxa-loc')?.value)||0;
    const lavagem = parseFloat(document.getElementById('c-lavagem')?.value)||0;
    totalBruto += (totalBruto * taxaLoc/100) + lavagem;
  }

  const valorPago  = window._reservaValorPago||0;
  const totalLiq   = Math.max(0, totalBruto - valorPago);
  const nomeCli    = cOpt?.dataset.nome||'___';
  const cpfCli     = cOpt?.dataset.cpf||'___';
  const telCli     = cOpt?.dataset.tel||'___';
  const placa      = vOpt?.dataset.placa||'___';
  const modelo     = vOpt?.dataset.modelo||'___';
  const atendente  = currentPerfil?.nome||'—';
  const numCtrato  = _peekNumContrato();

  // Atualiza preview
  _set('ct-num', numCtrato);
  _set('ct-tipo-badge', isMoto ? 'MOTO' : 'CARRO');
  _set('ct-cli', nomeCli);
  _set('ct-cli2', nomeCli);
  _set('ct-cpf', cpfCli);
  _set('ct-tel', telCli);
  _set('ct-condutor', condutor||nomeCli);
  _set('ct-condutor-cpf', condutorCpf||cpfCli);
  _set('ct-placa', placa);
  _set('ct-modelo', modelo);
  _set('ct-ini', ini ? fmtDt(ini+'T00:00') : '__/__/____');
  _set('ct-fim', fim ? fmtDt(fim+'T00:00') : '__/__/____');
  _set('ct-periodo', diasLabel);
  _set('ct-dia-val', `R$ ${dia.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
  _set('ct-total-bruto', `R$ ${totalBruto.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
  _set('ct-total', `R$ ${totalLiq.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
  _set('ct-km', km);
  _set('ct-obs', obs||'Veículo em perfeito estado. Cliente responsável por multas.');
  _set('ct-caucao', `R$ ${caucao.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
  _set('ct-pgto', pgto);
  _set('ct-atendente', atendente);
  _set('ct-data', new Date().toLocaleDateString('pt-BR'));

  // Aviso abatimento reserva
  const avisoEl = document.getElementById('ct-aviso-reserva');
  if(avisoEl){
    if(valorPago>0){
      avisoEl.style.display='block';
      avisoEl.innerHTML=`⚠️ Valor já pago na reserva: <strong>R$ ${valorPago.toFixed(2).replace('.',',')}</strong> · Total ajustado: <strong>R$ ${totalLiq.toFixed(2).replace('.',',')}</strong>`;
    } else {
      avisoEl.style.display='none';
    }
  }

  const ini = document.getElementById('c-ini')?.value||'';
  const fim = document.getElementById('c-fim')?.value||'';
  return {totalBruto, totalLiq, valorPago, nomeCli, cpfCli, telCli, placa, modelo, atendente, diasLabel, dia, km, obs, condutor, condutorCpf, pgto, caucao, numCtrato, periodoVal, ini, fim};
}

function _set(id, val){
  const el = document.getElementById(id);
  if(el) el.textContent = val;
}

// ══ REGISTRAR CONTRATO ══
async function registrarContrato(){
  const d = previewContrato();
  const cid = document.getElementById('c-cli')?.value;
  const vid = document.getElementById('c-vei')?.value;
  const ini = document.getElementById('c-ini')?.value;
  const fim = document.getElementById('c-fim')?.value;
  const km  = parseInt(document.getElementById('c-km')?.value)||0;
  const obs = document.getElementById('c-obs')?.value||'';

  if(!cid||!vid||!ini||!fim){ notify('Preencha cliente, veículo e datas','error'); return; }

  const btn = document.querySelector('#page-contratos .btn-registrar');
  if(btn){ btn.disabled=true; btn.textContent='Salvando...'; }

  try{
    const numContrato = _proximoNumContrato();

    const {data:locSalva, error} = await sb.from('locacoes').insert({
      veiculo_id:vid, cliente_id:cid, data_inicio:ini, data_fim:fim,
      km_inicial:km, diaria:dia, total:d.totalLiq, observacoes:obs,
      criado_por:currentUser?.id
    }).select().single();
    if(error) throw error;

    await sb.from('veiculos').update({status:'alugado'}).eq('id',vid);

    if(window._reservaOrigemId){
      await sb.from('reservas').update({status:'convertida'}).eq('id',window._reservaOrigemId);
      window._reservaOrigemId=null; window._reservaValorPago=0;
    }

    notify('Contrato #'+numContrato+' registrado!','success');

    // Gera PDF
    setTimeout(()=> gerarPdfContrato(numContrato, d), 500);

    await carregarTudo();

    // WhatsApp resumo
    const c = allClientes.find(x=>x.id===cid);
    const v = allVeiculos.find(x=>x.id===vid);
    if(c?.telefone){
      const txt = _msgWppContrato(numContrato, c, v, d);
      try{
        await evoSendText(c.telefone, txt);
        await salvarMsgDB(cid, c.telefone, txt, 'text', 'saida', null);
        notify('Resumo enviado pelo WhatsApp ✓','success');
      }catch(e){ console.warn('WPP:', e.message); }
    }
  }catch(e){
    notify('Erro: '+e.message,'error');
  }finally{
    if(btn){ btn.disabled=false; btn.textContent='📄 Registrar contrato'; }
  }
}

function _msgWppContrato(num, c, v, d){
  const isMoto = _tipoContrato==='moto';
  let txt = `📄 *CONTRATO #${num} — LOCADORA ROYAL*\n\n`;
  txt += `👤 *Cliente:* ${c.nome}\n`;
  txt += `📋 *CPF:* ${c.cpf||'—'}\n`;
  txt += `\n${isMoto?'🏍️':'🚗'} *Veículo:* ${v?.marca||''} ${v?.modelo||''} — ${v?.placa||''}\n`;
  txt += `📅 *Retirada:* ${d.ini||'—'}\n`;
  txt += `📅 *Devolução:* ${d.fim||'—'}\n`;
  txt += `⏱ *Período:* ${d.diasLabel}\n`;
  txt += `💰 *Valor ${isMoto?'semanal':'diária'}:* R$ ${d.dia.toFixed(2).replace('.',',')}\n`;
  if(d.valorPago>0){
    txt += `✂️ *Abatimento reserva:* - R$ ${d.valorPago.toFixed(2).replace('.',',')}\n`;
  }
  txt += `💳 *Total:* R$ ${d.totalLiq.toFixed(2).replace('.',',')}\n`;
  txt += `\n✅ Contrato registrado. O PDF completo será enviado em seguida.\n_Equipe Locadora Royal 🚗🏍️_`;
  return txt;
}

// ══ GERAR PDF ══
function _baixarPdfSemRegistrar(){
  const d = previewContrato();
  gerarPdfContrato(_peekNumContrato(), d);
}

async function gerarPdfContrato(numContrato, d){
  // Se d não foi passado, chama previewContrato para obter os dados
  if(!d || typeof d !== 'object') d = previewContrato();
  if(!d) return;
  // Extrai dia e periodoVal do objeto d para uso no PDF
  const dia        = d.dia || 0;
  const periodoVal = d.periodoVal || 1;
  // Carrega jsPDF dinamicamente
  if(!window.jspdf){
    await new Promise((res,rej)=>{
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload=res; s.onerror=rej;
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const isMoto = _tipoContrato==='moto';
  const PW = 210; // page width
  const M  = 15;  // margin
  const CW = PW - M*2; // content width
  let y = 15;

  // ── Helpers ──
  const line = (x1,y1,x2,y2,color='#cccccc')=>{
    doc.setDrawColor(color); doc.line(x1,y1,x2,y2);
  };
  const rect = (x,yy,w,h,fill,stroke)=>{
    if(fill){ doc.setFillColor(fill); }
    if(stroke){ doc.setDrawColor(stroke); }
    if(fill&&stroke) doc.rect(x,yy,w,h,'FD');
    else if(fill) doc.rect(x,yy,w,h,'F');
    else doc.rect(x,yy,w,h,'S');
  };
  const txt = (text,x,yy,opts={})=>{
    doc.setFontSize(opts.size||9);
    doc.setFont('helvetica', opts.bold?'bold':opts.italic?'italic':'normal');
    doc.setTextColor(opts.color||'#1a1a1a');
    if(opts.align==='center') doc.text(String(text), x, yy, {align:'center'});
    else if(opts.align==='right') doc.text(String(text), x, yy, {align:'right'});
    else doc.text(String(text), x, yy);
  };
  const newPage = ()=>{
    doc.addPage();
    y = 20;
    // Header mini nas páginas seguintes
    doc.setFillColor('#006400');
    doc.rect(0,0,PW,8,'F');
    txt('ROYAL RENT A CAR LTDA — CNPJ: '+(isMoto?'18.686.521/0002-90':'18.686.521/0001-00')+'  |  (21) 96894-9627  |  sac@locadoraroyal.com.br', PW/2, 5.5, {color:'#ffffff',size:7,align:'center',bold:false});
  };
  const checkY = (needed=25)=>{ if(y+needed>275){ newPage(); } };

  // ── PÁGINA 1 — HEADER ──
  // Faixa verde topo
  doc.setFillColor('#006400');
  doc.rect(0,0,PW,22,'F');

  // Logo
  try{
    doc.addImage(ROYAL_LOGO_B64, 'JPEG', M, 2, 35, 18);
  }catch(e){ txt('LOCADORA ROYAL', M, 12, {color:'#ffffff',size:14,bold:true}); }

  // Dados empresa
  txt('ROYAL RENT A CAR LTDA', 58, 8, {color:'#ffffff',size:10,bold:true});
  txt('CNPJ: '+(isMoto?'18.686.521/0002-90':'18.686.521/0001-00'), 58, 13, {color:'#d4edda',size:8});
  txt('Tel: (21) 96894-9627  |  sac@locadoraroyal.com.br', 58, 18, {color:'#d4edda',size:8});

  y = 30;

  // Número e situação
  rect(M, y, CW, 10, '#f0f8f0', '#006400');
  txt(`CONTRATO ${isMoto?'MASTER':''}#${numContrato}`, PW/2, y+4, {size:11,bold:true,align:'center',color:'#006400'});
  txt(`Situação: Em Vigência`, M+4, y+8, {size:8,color:'#333'});
  txt(`Tipo: ${isMoto?'MOTO':'CARRO'}  |  Data: ${new Date().toLocaleDateString('pt-BR')}`, PW-M, y+8, {size:8,color:'#333',align:'right'});
  y += 14;

  // ── BLOCO CLIENTE / RETIRADA / DEVOLUÇÃO ──
  const bH = isMoto ? 28 : 34;
  rect(M, y, CW/3-2, bH, '#f9f9f9', '#dddddd');
  rect(M+CW/3+1, y, CW/3-2, bH, '#f9f9f9', '#dddddd');
  rect(M+2*CW/3+2, y, CW/3-2, bH, '#f9f9f9', '#dddddd');

  // Col 1 — Cliente
  doc.setFillColor('#006400'); doc.rect(M,y,CW/3-2,5,'F');
  txt('CLIENTE', M+2, y+3.5, {size:7,bold:true,color:'#ffffff'});
  let cy = y+8;
  txt(d.nomeCli, M+2, cy, {size:8,bold:true}); cy+=5;
  txt(`CPF: ${d.cpfCli}`, M+2, cy, {size:7.5}); cy+=4;
  txt(`Tel: ${d.telCli}`, M+2, cy, {size:7.5}); cy+=5;
  txt('CONDUTOR(ES):', M+2, cy, {size:7,bold:true,color:'#555'}); cy+=4;
  txt(d.condutor||d.nomeCli, M+2, cy, {size:7.5}); cy+=4;
  txt(`CPF: ${d.condutorCpf||d.cpfCli}`, M+2, cy, {size:7.5});

  // Col 2 — Retirada
  const x2 = M+CW/3+1;
  doc.setFillColor('#006400'); doc.rect(x2,y,CW/3-2,5,'F');
  txt('RETIRADA', x2+2, y+3.5, {size:7,bold:true,color:'#ffffff'});
  let ry = y+8;
  const vOpt2 = document.getElementById('c-vei')?.selectedOptions[0];
  txt(`Placa: ${d.placa}`, x2+2, ry, {size:8,bold:true}); ry+=5;
  txt('Local: Loja', x2+2, ry, {size:7.5}); ry+=4;
  txt(`Data: ${document.getElementById('c-ini')?.value ? fmtDt(document.getElementById('c-ini').value+'T00:00') : '—'}`, x2+2, ry, {size:7.5}); ry+=4;
  txt('Empresa: Royal Rent A Car Ltda', x2+2, ry, {size:7}); ry+=4;
  txt('Endereço: Av. das Américas, 12900', x2+2, ry, {size:7}); ry+=4;
  txt('Bairro: Recreio dos Bandeirantes', x2+2, ry, {size:7}); ry+=4;
  txt('Tel: +55 (21) 96894-9627', x2+2, ry, {size:7});

  // Col 3 — Devolução
  const x3 = M+2*CW/3+2;
  doc.setFillColor('#006400'); doc.rect(x3,y,CW/3-2,5,'F');
  txt('DEVOLUÇÃO', x3+2, y+3.5, {size:7,bold:true,color:'#ffffff'});
  let dvy = y+8;
  txt(`Placa: ${d.placa}`, x3+2, dvy, {size:8,bold:true}); dvy+=5;
  txt('Local: Loja', x3+2, dvy, {size:7.5}); dvy+=4;
  txt(`Data: ${document.getElementById('c-fim')?.value ? fmtDt(document.getElementById('c-fim').value+'T00:00') : '—'}`, x3+2, dvy, {size:7.5}); dvy+=4;
  txt('Empresa: Royal Rent A Car Ltda', x3+2, dvy, {size:7}); dvy+=4;
  txt('Endereço: Av. das Américas, 12900', x3+2, dvy, {size:7}); dvy+=4;
  txt('Bairro: Recreio dos Bandeirantes', x3+2, dvy, {size:7}); dvy+=4;
  txt('Tel: +55 (21) 96894-9627', x3+2, dvy, {size:7});

  y += bH + 4;

  // ── TABELA VEÍCULO ──
  if(isMoto){
    // Tabela moto
    rect(M, y, CW, 6, '#006400', '#006400');
    const cols = [30,20,28,28,22,20,32];
    const headers = ['Veículo','Franquia Km','Valor Locação','Km Excedente','Data Entrega','Km Saída','Data Término'];
    let cx = M;
    headers.forEach((h,i)=>{ txt(h, cx+1, y+4, {size:6.5,bold:true,color:'#ffffff'}); cx+=cols[i]; });
    y+=6;
    rect(M, y, CW, 8, '#f0f8f0', '#dddddd');
    cx=M;
    const rowMoto = [
      `${d.placa} - ${d.modelo}`,
      document.getElementById('c-franquia-km')?.value||'0',
      `R$ ${(d.dia||0).toFixed(2).replace('.',',')}`,
      `R$ ${(parseFloat(document.getElementById('c-km-excedente')?.value)||0).toFixed(2).replace('.',',')}`,
      document.getElementById('c-ini')?.value ? fmtData(document.getElementById('c-ini').value) : '—',
      d.km,
      document.getElementById('c-fim')?.value ? fmtData(document.getElementById('c-fim').value) : '—',
    ];
    rowMoto.forEach((v,i)=>{ txt(v, cx+1, y+5, {size:7}); cx+=cols[i]; });
    y+=10;

    // Forma pagamento
    rect(M, y, CW, 8, '#f9f9f9', '#dddddd');
    txt(`Forma de Pagamento: ${d.pgto}`, M+2, y+3, {size:8,bold:true});
    txt(`Caução/Garantia: ${d.pgto} — R$ ${d.caucao.toFixed(2).replace('.',',')}`, M+2, y+7, {size:8});
    y+=10;

  } else {
    // Tabela carro
    const kmLivre = document.getElementById('c-km-livre')?.checked;
    const tanque  = document.getElementById('c-tanque')?.value||'Cheio';
    const protecao= document.getElementById('c-protecao')?.value||'Basica';
    const taxaLoc = parseFloat(document.getElementById('c-taxa-loc')?.value)||6;
    const lavagem = parseFloat(document.getElementById('c-lavagem')?.value)||0;
    const grupo   = document.getElementById('c-grupo')?.value||'';
    const periodoVal2 = parseInt(document.getElementById('c-periodo')?.value)||1;
    const dias2 = document.getElementById('c-ini')?.value&&document.getElementById('c-fim')?.value
      ? Math.max(1,Math.ceil((new Date(document.getElementById('c-fim').value)-new Date(document.getElementById('c-ini').value))/86400000))
      : periodoVal2;
    const totalDiarias = (d.dia||0) * dias2;
    const totalTaxa    = totalDiarias * taxaLoc/100;

    txt(`Grupo: ${grupo}    Km Livre: ${kmLivre?'Sim':'Não'}    Tanque Saída: ${tanque}    Km Saída: ${d.km} km`, M, y+4, {size:7.5});
    y+=7;

    rect(M, y, CW, 6, '#006400', '#006400');
    const hCarro=['Valores da Locação','Qtd','Valor Unit.','Desconto','Valor Total'];
    const wCarro=[70,15,35,25,35];
    let ccx=M;
    hCarro.forEach((h,i)=>{ txt(h, ccx+1, y+4, {size:6.5,bold:true,color:'#ffffff'}); ccx+=wCarro[i]; });
    y+=6;

    const rowsCarro=[
      ['Diária:', dias2, `R$ ${(d.dia||0).toFixed(2).replace('.',',')}`, '—', `R$ ${totalDiarias.toFixed(2).replace('.',',')}`],
      ['Taxa de Locação:', 1, `${taxaLoc}%`, '—', `R$ ${totalTaxa.toFixed(2).replace('.',',')}`],
      lavagem>0 ? ['Lavagem Antecipada:', 1, `R$ ${lavagem.toFixed(2).replace('.',',')}`, '—', `R$ ${lavagem.toFixed(2).replace('.',',')}`] : null,
    ].filter(Boolean);

    rowsCarro.forEach((row,ri)=>{
      rect(M, y, CW, 7, ri%2===0?'#ffffff':'#f9f9f9', '#dddddd');
      ccx=M;
      row.forEach((v2,i)=>{ txt(String(v2), ccx+1, y+5, {size:7.5,bold:i===0}); ccx+=wCarro[i]; });
      y+=7;
    });

    // Proteção
    rect(M, y, CW, 9, '#fff8e1', '#dddddd');
    const protText = protecao==='Completa'
      ? 'Proteção Completa: cobertura ampla, franquia 6% FIPE, vidros e pneus incluídos, danos a terceiros até R$ 50.000'
      : 'Proteção Básica (com Franquia): Casco franquia 12% FIPE; Furto/roubo coparticipação 12%; Vidros e pneus não incluídos';
    doc.setFontSize(6.5); doc.setFont('helvetica','normal');
    const splitProt = doc.splitTextToSize(protText, CW-4);
    doc.setTextColor('#333');
    doc.text(splitProt, M+2, y+4);
    y += 9 + (splitProt.length-1)*3;

    // Total
    rect(M, y, CW, 8, '#e8f5e9', '#006400');
    txt('VALOR TOTAL DO CONTRATO:', M+4, y+5, {size:9,bold:true,color:'#006400'});
    txt(`R$ ${d.totalLiq.toFixed(2).replace('.',',')}`, PW-M, y+5, {size:11,bold:true,color:'#006400',align:'right'});
    y+=10;

    // Pagamento
    rect(M, y, CW, 8, '#f9f9f9', '#dddddd');
    txt(`Forma de Pagamento Locação: ${d.pgto}`, M+2, y+3.5, {size:8,bold:true});
    txt(`Forma de Pagamento Garantia: ${d.pgto} — Caução R$ ${d.caucao.toFixed(2).replace('.',',')}`, M+2, y+7.5, {size:7.5});
    y+=10;
  }

  // Observações
  if(d.obs && d.obs!=='—'){
    checkY(12);
    rect(M, y, CW, 5, '#006400');
    txt('OBSERVAÇÕES', M+2, y+3.5, {size:7,bold:true,color:'#ffffff'});
    y+=5;
    rect(M, y, CW, 8, '#f9f9f9', '#dddddd');
    const splitObs = doc.splitTextToSize(d.obs, CW-4);
    doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor('#333');
    doc.text(splitObs, M+2, y+4);
    y += Math.max(8, splitObs.length*3.5)+2;
  }

  // ── TERMOS E CONDIÇÕES ──
  checkY(15);
  rect(M, y, CW, 5, '#006400');
  txt('TERMOS E CONDIÇÕES', M+2, y+3.5, {size:7,bold:true,color:'#ffffff'});
  y+=7;

  const termosText = isMoto ? _termossMoto() : _termosCarro();
  const termosLines = doc.splitTextToSize(termosText, CW);
  doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor('#333');

  // Divide em chunks por página
  const lineH = 3.2;
  let chunk = [];
  termosLines.forEach(l=>{
    if(y + chunk.length*lineH + lineH > 270){ checkY(10); doc.text(chunk, M, y); y+=chunk.length*lineH+2; chunk=[]; }
    chunk.push(l);
  });
  if(chunk.length){ checkY(chunk.length*lineH+5); doc.text(chunk, M, y); y+=chunk.length*lineH+4; }

  // ── ASSINATURAS ──
  checkY(45);
  y+=4;
  line(M, y, M+CW/3-5, y, '#000000');
  line(M+CW/3+5, y, M+2*CW/3-5, y, '#000000');
  line(M+2*CW/3+5, y, PW-M, y, '#000000');
  y+=3;
  txt('Cliente', M+CW/6-10, y, {size:8,bold:true,align:'center'});
  txt('Motorista', M+CW/2, y, {size:8,bold:true,align:'center'});
  txt('Atendente', M+5*CW/6+5, y, {size:8,bold:true,align:'center'});
  y+=4;
  txt(d.nomeCli, M+CW/6-10, y, {size:7.5,align:'center'});
  txt(d.condutor||d.nomeCli, M+CW/2, y, {size:7.5,align:'center'});
  txt(d.atendente, M+5*CW/6+5, y, {size:7.5,align:'center'});
  y+=4;
  txt(`CPF: ${d.cpfCli}`, M+CW/6-10, y, {size:7,align:'center',color:'#555'});
  txt(`CPF: ${d.condutorCpf||d.cpfCli}`, M+CW/2, y, {size:7,align:'center',color:'#555'});
  y+=6;

  // Rodapé
  const totalPgs = doc.getNumberOfPages();
  for(let p=1;p<=totalPgs;p++){
    doc.setPage(p);
    doc.setFillColor('#006400');
    doc.rect(0,287,PW,10,'F');
    txt(`Locadora Royal — Contrato #${numContrato} — Página ${p} de ${totalPgs}`, PW/2, 293, {size:6.5,color:'#ffffff',align:'center'});
  }

  // Download
  doc.save(`Contrato_Royal_${numContrato}_${d.nomeCli.replace(/\s+/g,'_')}.pdf`);
  notify(`PDF do Contrato #${numContrato} gerado e baixado!`,'success');
}

// ══ TERMOS MOTO ══
function _termossMoto(){
  return `1. DEFINIÇÕES
1.1 Motocicleta: veículo descrito neste contrato, com todos os acessórios e itens em perfeito estado de uso e conservação.
1.2 Obrigação da LOCADORA: serviços periódicos previstos no Manual do Fabricante (revisões programadas, trocas periódicas e inspeções), conforme Cláusula 8. Manutenção Preventiva.
1.3 Obrigação do LOCATÁRIO: reparos decorrentes de falha, quebra, impacto, colisão, queda, mau uso, negligência ou qualquer evento não enquadrado como Manutenção Preventiva.
1.4 Semana de Locação: período de 7 (sete) dias corridos contados da data de início.
1.5 Caução: valor de garantia descrito neste contrato.
1.6 Seguro Suhai: proteção contratada junto à seguradora Suhai, cobrindo roubo/furto e danos a terceiros.

2. OBJETO
2.1 Locação da motocicleta para uso exclusivo em atividade de delivery e deslocamentos compatíveis.
2.2 Locação sem transferência de propriedade, posse precária, temporária e resolúvel.

3. PRAZO
3.1 Contrato por prazo indeterminado, com pagamento semanal.
3.2 Cada semana corresponde a 7 dias corridos. Renovação automática enquanto houver adimplência.
3.3 Para encerrar, comunicar com antecedência mínima de 48 horas.

4. PREÇO, PAGAMENTO E ENCARGOS
4.1 Pagamento semanal ANTECIPADO. A inadimplência autoriza a LOCADORA a bloquear e recolher a motocicleta.
4.2 Encargos por atraso: Multa 5%, Juros 1%/mês, Correção IPCA/IBGE.
4.3 Inadimplência superior a 2 dias caracteriza rescisão de pleno direito.

5. CAUÇÃO
5.1 Caução paga no ato da assinatura. Pode ser utilizada para quitar débitos do LOCATÁRIO.
5.2 Devolvida em até 10 dias úteis após devolução e conferência, sem pendências.

6. ENTREGA, VISTORIA E DEVOLUÇÃO
6.1 Entrega mediante assinatura do Termo de Entrega e Vistoria, com registro fotográfico.
6.2 Devolução na sede da LOCADORA em dia útil e horário comercial.

7. REQUISITOS E CONDUTOR AUTORIZADO
7.1 Somente o LOCATÁRIO identificado poderá conduzir a motocicleta.
7.2 O LOCATÁRIO declara possuir CNH categoria A válida.

8. MANUTENÇÃO PREVENTIVA — RESPONSABILIDADE DA LOCADORA
8.1 A LOCADORA realizará manutenção preventiva conforme Manual do Fabricante.
8.2 Agendamento obrigatório com antecedência mínima de 5 dias.

9. RESPONSABILIDADE DO LOCATÁRIO — DANOS
9.1 Quaisquer danos fora da manutenção preventiva são de responsabilidade exclusiva do LOCATÁRIO.
9.2 Cuidados diários: verificar nível de óleo, pressão dos pneus, corrente e freios.

10. SEGURO — SUHAI SEGURADORA
10.1 Cobertura: Roubo/furto total e Danos a terceiros (responsabilidade civil).
10.2 O LOCATÁRIO é responsável pelo pagamento da franquia em caso de sinistro coberto.

11. USO PERMITIDO E PROIBIÇÕES
11.1 PROIBIDO: conduzir sob efeito de álcool, participar de corridas, adulterar hodômetro, sublocar o veículo, usar fora do estado do Rio de Janeiro sem autorização, circular em raio inferior a 150 km de fronteiras internacionais.

12. MULTAS E INFRAÇÕES
12.1 O LOCATÁRIO é integralmente responsável por multas. Acréscimo de 20% a título de custo operacional.

13. SINISTROS — PROVIDÊNCIAS OBRIGATÓRIAS
13.1 Em caso de sinistro: comunicar a LOCADORA imediatamente, registrar BO em até 48h, enviar fotos e documentos.

14. RESCISÃO
14.1 Pelo LOCATÁRIO: comunicar com 48h de antecedência e quitar débitos.
14.2 Pela LOCADORA: imediatamente nos casos de inadimplência, mau uso, condutor não autorizado ou sinistro não comunicado.

15. REEMBOLSO E ACERTO FINAL
15.1 Após rescisão, a LOCADORA apurará todos os créditos e débitos do LOCATÁRIO.

16. TRATAMENTO DE DADOS PESSOAIS — LGPD
16.1 Os dados pessoais serão tratados conforme Lei nº 13.709/2018 para fins de execução deste contrato.

17. DISPOSIÇÕES GERAIS
17.1 Assinatura eletrônica/digital tem plena validade jurídica, conforme MP 2.200/2001.
17.2 Este contrato constitui título executivo extrajudicial nos termos do art. 784 do CPC.

18. FORO: Comarca do Rio de Janeiro — RJ.`;
}

// ══ TERMOS CARRO ══
function _termosCarro(){
  return `1. ACEITE ÀS CONDIÇÕES GERAIS E ESPECIAIS
Ao assinar este Contrato, VOCÊ declara ciência, aceite e adesão às Condições Gerais do Contrato de Aluguel de Carros da ROYAL RENT A CAR LTDA – CNPJ 18.686.521/0001-00. As Condições Gerais estão disponíveis em https://locadoraroyal.com.br/contrato/.

2. SEGURO / PROTEÇÕES
Pacote Básica: Furto/roubo ou perda total com coparticipação de 12%, franquia de 12% do valor da FIPE por evento; vidros e pneus não incluídos.
Pacote Completa: Cobertura ampla, franquia 6% FIPE, danos a terceiros até R$ 50.000,00, cobertura ocupantes até R$ 10.000,00, vidros e pneus incluídos (sublimite R$ 2.000 por item).

3. MULTAS E IDENTIFICAÇÃO DE CONDUTOR
O LOCATÁRIO assume total responsabilidade por infrações de trânsito. A ROYAL fica constituída sua procuradora para assinar o termo de apresentação do condutor infrator, conforme art. 257 do CTB e Resolução CONTRAN nº 918/2022.

4. DADOS PESSOAIS E PRIVACIDADE
As informações coletadas serão utilizadas para executar este Contrato nos termos da Lei nº 13.709/2018 (LGPD). Acesse: https://locadoraroyal.com.br/privacy-policy/.

5. PEDÁGIOS E ESTACIONAMENTOS (TAG)
Os veículos podem conter dispositivo eletrônico para abertura de cancelas. A utilização autoriza a cobrança dos valores de uso acrescidos da tarifa TAG da Royal.

6. ÁREAS DE FRONTEIRA
Proibido circular em raio de 150 km de fronteiras internacionais. O descumprimento autoriza bloqueio remoto e retomada do veículo.

7. DA LIMPEZA E DO COMBUSTÍVEL
O veículo deverá ser devolvido nas mesmas condições de limpeza. Nível de combustível inferior ao da retirada: cobrança de R$ 7,00 por litro faltante.

8. CONSULTA A SISTEMAS DE CRÉDITO
Ao assinar, você permite consulta de seus dados em bureaus de crédito (Serasa, SPC, Boa Vista) para análise cadastral.

ASSISTÊNCIA 24 HORAS: +55 (21) 96894-9627 — Mecânicos, Elétricos, Remoção, Troca de pneus.
INCIDENTES: 1) Comunicar Polícia Militar (190); 2) Avisar Royal em até 1h; 3) Registrar BO em até 6h; 4) Enviar nº protocolo em até 3 dias úteis.
ATENÇÃO: Devolução após 24h do término configura apropriação indébita.`;
}

// ══ CALENDÁRIO ══
function renderCal(){
  document.getElementById('cal-titulo').textContent = MONTHS[calMonth]+' '+calYear;
  const first = new Date(calYear,calMonth,1).getDay();
  const days  = new Date(calYear,calMonth+1,0).getDate();
  const today = new Date();
  const busy  = {};
  allLocacoes.forEach(l=>{
    for(let d=new Date(l.data_inicio);d<=new Date(l.data_fim);d.setDate(d.getDate()+1)){
      if(d.getFullYear()===calYear&&d.getMonth()===calMonth){
        const k=d.getDate(); if(!busy[k]) busy[k]=[]; busy[k].push(l.veiculos?.tipo||'carro');
      }
    }
  });
  allReservas.filter(r=>r.status==='ativa').forEach(r=>{
    for(let d=new Date(r.data_inicio);d<=new Date(r.data_fim);d.setDate(d.getDate()+1)){
      if(d.getFullYear()===calYear&&d.getMonth()===calMonth){
        const k=d.getDate(); if(!busy[k]) busy[k]=[]; busy[k].push('reserva');
      }
    }
  });
  let html='';
  for(let i=0;i<first;i++) html+=`<div class="cal-day other">${new Date(calYear,calMonth,-first+i+1).getDate()}</div>`;
  for(let d=1;d<=days;d++){
    const isT=d===today.getDate()&&calMonth===today.getMonth()&&calYear===today.getFullYear();
    const types=[...new Set(busy[d]||[])];
    const dots=types.map(t=>`<div class="dot" style="background:${t==='reserva'?'#2563EB':t==='carro'?'#3b82f6':'#f5a623'}"></div>`).join('');
    html+=`<div class="cal-day ${isT?'today':''}" onclick="calSelectDay(${d})"><span>${d}</span>${dots?`<div class="dots">${dots}</div>`:''}</div>`;
  }
  document.getElementById('cal-grid').innerHTML=html;
}
function changeMonth(dir){ calMonth+=dir; if(calMonth>11){calMonth=0;calYear++;} if(calMonth<0){calMonth=11;calYear--;} renderCal(); }

async function calSelectDay(d){
  document.getElementById('cal-sel-date').textContent=`${d} de ${MONTHS[calMonth]}`;
  const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const {data:locs}=await sb.from('locacoes').select('*,veiculos(*)').lte('data_inicio',ds).gte('data_fim',ds).eq('status','ativa');
  const locIds=(locs||[]).map(l=>l.veiculo_id);
  const resIds=allReservas.filter(r=>r.status==='ativa'&&r.data_inicio?.slice(0,10)<=ds&&r.data_fim?.slice(0,10)>=ds).map(r=>r.veiculo_id);
  document.getElementById('cal-veic-list').innerHTML=allVeiculos.map(v=>{
    const b=v.status==='manutencao'?'badge-yellow':locIds.includes(v.id)?'badge-red':resIds.includes(v.id)?'badge-blue':'badge-green';
    const lb=v.status==='manutencao'?'Manutenção':locIds.includes(v.id)?'Alugado':resIds.includes(v.id)?'Reservado':'Disponível';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)"><div style="display:flex;align-items:center;gap:8px"><div class="vi ${v.tipo==='carro'?'vi-car':'vi-moto'}">${v.tipo==='carro'?'🚗':'🏍️'}</div><div><div style="font-size:13px;font-weight:500">${v.marca} ${v.modelo}</div><div style="font-size:11px;color:var(--muted)">${v.placa}</div></div></div><span class="badge ${b}">${lb}</span></div>`;
  }).join('')||'<p style="color:var(--muted2)">Sem veículos.</p>';
}

// Converte reserva → contrato
async function converterReservaContrato(id){
  const r = allReservas.find(x=>x.id===id);
  if(!r) return;
  const veic = allVeiculos.find(v=>v.id===r.veiculo_id);
  goPage('contratos');
  setTimeout(()=>{
    const selCli=document.getElementById('c-cli'); if(selCli) selCli.value=r.cliente_id;
    const selVei=document.getElementById('c-vei');
    if(selVei){
      if(!selVei.querySelector(`option[value="${r.veiculo_id}"]`)&&veic){
        const opt=document.createElement('option');
        opt.value=veic.id; opt.dataset.diaria=veic.diaria; opt.dataset.placa=veic.placa;
        opt.dataset.tipo=veic.tipo; opt.dataset.modelo=`${veic.marca} ${veic.modelo}`;
        opt.textContent=`${veic.marca} ${veic.modelo} — ${veic.placa}`;
        selVei.insertBefore(opt,selVei.firstChild);
      }
      selVei.value=r.veiculo_id;
      autoFillContrato();
    }
    const elIni=document.getElementById('c-ini'); if(elIni) elIni.value=r.data_inicio?.slice(0,10)||'';
    const elFim=document.getElementById('c-fim'); if(elFim) elFim.value=r.data_fim?.slice(0,10)||'';
    const elObs=document.getElementById('c-obs');
    let obsT='Veículo em perfeito estado. Cliente responsável por multas.';
    if(r.valor_pago>0) obsT+=`\nReserva convertida — valor já pago: R$ ${Number(r.valor_pago).toFixed(2).replace('.',',')}`;
    if(r.observacoes) obsT+=`\n${r.observacoes}`;
    if(elObs) elObs.value=obsT;
    window._reservaOrigemId=id;
    window._reservaValorPago=r.valor_pago||0;
    window._reservaVeiculoId=r.veiculo_id;
    if(r.valor_pago>0) notify(`Reserva com R$ ${Number(r.valor_pago).toFixed(2).replace('.',',')} já pago — será abatido do total.`,'success');
    previewContrato();
  },300);
}
