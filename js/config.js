// config.js — Variáveis globais e configuração de perfis
const {createClient} = supabase;
let sb = null;
let currentUser = null, currentPerfil = null;
let allVeiculos=[], allClientes=[], allLocacoes=[], allManutencoes=[], allPerfis=[], allReservas=[], allLocacoesCompletas=[];
let histVeiculoId = null, chatMsgs = {}, activeChatId = null;
let calYear=new Date().getFullYear(), calMonth=new Date().getMonth();
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ══ SVG ICONS ══
const ICONS = {
  dashboard: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  carros:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l3-4h8l3 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17" r="2.5"/><circle cx="16.5" cy="17" r="2.5"/><path d="M5 9h14"/></svg>`,
  motos:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h-5L7 17"/><path d="M15 6l3 5.5"/><path d="M15 6l2-3h3"/><path d="M10 6l2 5"/></svg>`,
  historico: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3"/><path d="M3.05 11a9 9 0 1 0 .5-4"/><path d="M3 3v4h4"/></svg>`,
  clientes:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  reservas:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  locacoes:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  contratos: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  calendario:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>`,
  chat:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  usuarios:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
  investidores:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  rastreador:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  veiculos:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
};

// ══ ROLES CONFIG ══
const ROLE_MENUS = {
  admin: [
    {section:'Principal'},
    {id:'dashboard',   icon:ICONS.dashboard,    label:'Dashboard'},
    {section:'Frota'},
    {id:'carros',      icon:ICONS.carros,        label:'Carros'},
    {id:'motos',       icon:ICONS.motos,         label:'Motos'},
    {id:'historico',   icon:ICONS.historico,     label:'Histórico'},
    {section:'Clientes'},
    {id:'clientes',    icon:ICONS.clientes,      label:'Clientes'},
    {id:'reservas',    icon:ICONS.reservas,      label:'Reservas'},
    {id:'locacoes',    icon:ICONS.locacoes,      label:'Locações'},
    {id:'contratos',   icon:ICONS.contratos,     label:'Contratos'},
    {section:'Operações'},
    {id:'calendario',  icon:ICONS.calendario,    label:'Calendário'},
    {id:'chat',        icon:ICONS.chat,          label:'Chat WhatsApp'},
    {section:'Admin'},
    {id:'usuarios',    icon:ICONS.usuarios,      label:'Usuários'},
    {id:'investidores',icon:ICONS.investidores,  label:'Investidores'},
  ],
  atendente: [
    {section:'Principal'},
    {id:'dashboard',   icon:ICONS.dashboard,    label:'Dashboard'},
    {section:'Frota'},
    {id:'carros',      icon:ICONS.carros,        label:'Carros'},
    {id:'motos',       icon:ICONS.motos,         label:'Motos'},
    {section:'Clientes'},
    {id:'clientes',    icon:ICONS.clientes,      label:'Clientes'},
    {id:'reservas',    icon:ICONS.reservas,      label:'Reservas'},
    {id:'locacoes',    icon:ICONS.locacoes,      label:'Locações'},
    {id:'contratos',   icon:ICONS.contratos,     label:'Contratos'},
    {section:'Operações'},
    {id:'calendario',  icon:ICONS.calendario,    label:'Calendário'},
    {id:'chat',        icon:ICONS.chat,          label:'Chat WhatsApp'},
  ],
  investidor: [
    {section:'Acesso'},
    {id:'investidores',icon:ICONS.dashboard,    label:'Dashboard',      invPage:'inv-dashboard'},
    {id:'investidores',icon:ICONS.veiculos,     label:'Meus Veículos',  invPage:'inv-veiculos'},
    {id:'investidores',icon:ICONS.rastreador,   label:'Rastreador',     invPage:'inv-rastreador'},
  ],
};

const ROLE_LABELS = {admin:'Administrador', atendente:'Atendente', investidor:'Investidor'};

// ══ LAYERS ══

// ══ CPF — VALIDAÇÃO E MÁSCARA ══
function validarCPF(cpf){
  cpf = cpf.replace(/\D/g,'');
  if(cpf.length !== 11) return false;
  if(/^(\d){10}$/.test(cpf)) return false;
  let s = 0;
  for(let i=0;i<9;i++) s += parseInt(cpf[i])*(10-i);
  let r = (s*10)%11; if(r===10||r===11) r=0;
  if(r !== parseInt(cpf[9])) return false;
  s = 0;
  for(let i=0;i<10;i++) s += parseInt(cpf[i])*(11-i);
  r = (s*10)%11; if(r===10||r===11) r=0;
  return r === parseInt(cpf[10]);
}

function maskCPF(input){
  let v = input.value.replace(/\D/g,'').slice(0,11);
  if(v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/,'$1.$2.$3-$4');
  else if(v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/,'$1.$2.$3');
  else if(v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/,'$1.$2');
  input.value = v;
  const raw = v.replace(/\D/g,'');
  if(raw.length===11){
    input.style.borderColor = validarCPF(raw) ? '#16a34a' : '#dc2626';
  } else {
    input.style.borderColor = '';
  }
}

function checarCPF(valor, campo='CPF'){
  const raw = valor.replace(/\D/g,'');
  if(!raw) return true;
  if(raw.length !== 11){ notify(campo+' deve ter 11 dígitos','error'); return false; }
  if(!validarCPF(raw)){ notify(campo+' inválido','error'); return false; }
  return true;
}

function validarCNPJ(cnpj){
  cnpj = cnpj.replace(/\D/g,'');
  if(cnpj.length !== 14) return false;
  if(/^(\d){13}$/.test(cnpj)) return false;
  let t = cnpj.length - 2, d = cnpj.substring(t), n = cnpj.substring(0,t);
  let s = 0, p = t - 7, c = t;
  for(let i=t;i>=1;i--){ s += parseInt(n.charAt(t-i)) * c--; if(c<2) c=9; }
  let r = s%11<2?0:11-s%11;
  if(r !== parseInt(d.charAt(0))) return false;
  t++; n = cnpj.substring(0,t); s=0; p=t-7; c=t;
  for(let i=t;i>=1;i--){ s += parseInt(n.charAt(t-i)) * c--; if(c<2) c=9; }
  r = s%11<2?0:11-s%11;
  return r === parseInt(d.charAt(1));
}

function maskCpfCnpj(input){
  let v = input.value.replace(/\D/g,'').slice(0,14);
  if(v.length <= 11){
    if(v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/,'$1.$2.$3-$4');
    else if(v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/,'$1.$2.$3');
    else if(v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/,'$1.$2');
  } else {
    v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/,'$1.$2.$3/$4-$5');
  }
  input.value = v;
  const raw = v.replace(/\D/g,'');
  if(raw.length===11) input.style.borderColor = validarCPF(raw)?'#16a34a':'#dc2626';
  else if(raw.length===14) input.style.borderColor = validarCNPJ(raw)?'#16a34a':'#dc2626';
  else input.style.borderColor = '';
}

function checarCpfCnpj(valor, campo='CPF/CNPJ'){
  const raw = valor.replace(/\D/g,'');
  if(!raw) return true;
  if(raw.length===11){
    if(!validarCPF(raw)){ notify(campo+' inválido','error'); return false; }
  } else if(raw.length===14){
    if(!validarCNPJ(raw)){ notify(campo+' inválido','error'); return false; }
  } else {
    notify(campo+' deve ter 11 (CPF) ou 14 (CNPJ) dígitos','error'); return false;
  }
  return true;
}

// ══ URL ASSINADA PARA MÍDIA ══
const _urlCache = {};

async function _getSignedUrl(url){
  if(!url) return url;
  if(!url.includes('supabase.co/storage')) return url;
  if(_urlCache[url] && _urlCache[url].exp > Date.now()) return _urlCache[url].signed;
  const cfg = JSON.parse(localStorage.getItem('fp_evo_cfg')||'{}');
  const bridge = (cfg.bridgeUrl||'https://bridge.ruahsystems.com.br').replace(/\/$/,'');
  const bucket = url.includes('wpp-media') ? 'wpp-media' : 'checklists';
  try{
    const r = await fetch(`${bridge}/media-url?bucket=${bucket}&path=${encodeURIComponent(url)}&secret=FleetPro2025`);
    const data = await r.json();
    if(data.ok && data.url){
      _urlCache[url] = { signed: data.url, exp: Date.now() + 3500000 };
      return data.url;
    }
  }catch(_){}
  return url;
}
