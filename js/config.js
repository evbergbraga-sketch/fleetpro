// config.js — Variáveis globais e configuração de perfis
const {createClient} = supabase;
let sb = null;
let currentUser = null, currentPerfil = null;
let allVeiculos=[], allClientes=[], allLocacoes=[], allManutencoes=[], allPerfis=[], allReservas=[], allLocacoesCompletas=[];
let histVeiculoId = null, chatMsgs = {}, activeChatId = null;
let calYear=new Date().getFullYear(), calMonth=2;
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
