// config.js — Variáveis globais e configuração de perfis
const {createClient} = supabase;
let sb = null;
let currentUser = null, currentPerfil = null;
let allVeiculos=[], allClientes=[], allLocacoes=[], allManutencoes=[], allPerfis=[], allReservas=[], allLocacoesCompletas=[];
let histVeiculoId = null, chatMsgs = {}, activeChatId = null;
let calYear=new Date().getFullYear(), calMonth=new Date().getMonth();
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
// ══ ROLES CONFIG ══
const ROLE_MENUS = {
  admin: [
    {section:'Principal'},
    {id:'dashboard', icon:'⊞', label:'Dashboard'},
    {section:'Frota'},
    {id:'carros',    icon:'🚗', label:'Carros'},
    {id:'motos',     icon:'🏍️', label:'Motos'},
    {id:'historico', icon:'📋', label:'Histórico'},
    {section:'Clientes'},
    {id:'clientes',  icon:'👤', label:'Clientes'},
    {id:'reservas',  icon:'🗓️', label:'Reservas'},
    {id:'locacoes',  icon:'📋', label:'Locações'},
    {id:'contratos', icon:'📄', label:'Contratos'},
    {section:'Operações'},
    {id:'calendario',icon:'📅', label:'Calendário'},
    {id:'chat',      icon:'💬', label:'Chat WhatsApp'},
    {section:'Admin'},
    {id:'usuarios',  icon:'🔑', label:'Usuários'},
    {id:'investidores',icon:'📊',label:'Investidores'},
  ],
  atendente: [
    {section:'Principal'},
    {id:'dashboard', icon:'⊞', label:'Dashboard'},
    {section:'Frota'},
    {id:'carros',    icon:'🚗', label:'Carros'},
    {id:'motos',     icon:'🏍️', label:'Motos'},
    {section:'Clientes'},
    {id:'clientes',  icon:'👤', label:'Clientes'},
    {id:'reservas',  icon:'🗓️', label:'Reservas'},
    {id:'locacoes',  icon:'📋', label:'Locações'},
    {id:'contratos', icon:'📄', label:'Contratos'},
    {section:'Operações'},
    {id:'calendario',icon:'📅', label:'Calendário'},
    {id:'chat',      icon:'💬', label:'Chat WhatsApp'},
  ],
  investidor: [
    {section:'Acesso'},
    {id:'investidores',icon:'📊',label:'Dashboard',      invPage:'inv-dashboard'},
    {id:'investidores',icon:'🏍️',label:'Meus Veículos',  invPage:'inv-veiculos'},
    {id:'investidores',icon:'📍',label:'Rastreador',     invPage:'inv-rastreador'},
  ],
};
const ROLE_LABELS = {admin:'Administrador', atendente:'Atendente', investidor:'Investidor'};
// ══ LAYERS ══

// ══ CPF — VALIDAÇÃO E MÁSCARA ══
function validarCPF(cpf){
  cpf = cpf.replace(/\D/g,'');
  if(cpf.length !== 11) return false;
  if(/^(\d){10}$/.test(cpf)) return false; // todos iguais ex: 111.111.111-11
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
  // Feedback visual
  const raw = v.replace(/\D/g,'');
  if(raw.length===11){
    input.style.borderColor = validarCPF(raw) ? '#16a34a' : '#dc2626';
  } else {
    input.style.borderColor = '';
  }
}

function checarCPF(valor, campo='CPF'){
  const raw = valor.replace(/\D/g,'');
  if(!raw) return true; // campo opcional vazio OK
  if(raw.length !== 11){ notify(campo+' deve ter 11 dígitos','error'); return false; }
  if(!validarCPF(raw)){ notify(campo+' inválido','error'); return false; }
  return true;
}
