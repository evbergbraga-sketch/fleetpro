// setup.js — Setup Supabase, autenticação e início do app

// ══ SETUP ══
function toggleSQL(){
  const p=document.getElementById('sql-panel');
  p.style.display=p.style.display==='block'?'none':'block';
}
function copySQL(){ navigator.clipboard.writeText(document.getElementById('sql-text').textContent); notify('SQL copiado!','success'); }

function limparSetup(){
  localStorage.removeItem('fp_url'); localStorage.removeItem('fp_key');
  document.getElementById('sb-url').value='';
  document.getElementById('sb-key').value='';
  const e=document.getElementById('setup-err');
  e.innerHTML='Dados limpos. Cole suas credenciais novamente.';
  e.style.cssText='display:block;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);border-radius:8px;padding:10px 12px;font-size:12px;color:var(--blue);line-height:1.5';
}

async function setupConectar(){
  const url=document.getElementById('sb-url').value.trim();
  const key=document.getElementById('sb-key').value.trim();
  const errEl=document.getElementById('setup-err');
  const okEl=document.getElementById('setup-ok');
  const btn=document.getElementById('setup-btn');
  const showErr=(msg)=>{
    errEl.innerHTML=msg;
    errEl.style.cssText='display:block;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:10px 12px;font-size:12px;color:var(--red);line-height:1.5;margin-top:0';
    okEl.style.display='none';
  };
  errEl.style.display='none'; okEl.style.display='none';

  if(!url && !key){ showErr('⚠️ Preencha os dois campos acima: <strong>Project URL</strong> e <strong>chave anon public</strong>.'); return; }
  if(!url){ showErr('⚠️ A <strong>Project URL</strong> está vazia. Formato: <code style="color:var(--accent)">https://xxxx.supabase.co</code>'); return; }
  if(!url.includes('supabase.co')){ showErr('⚠️ A URL parece incorreta. Deve terminar com <code style="color:var(--accent)">.supabase.co</code>'); return; }
  if(!key){ showErr('⚠️ A <strong>chave anon public</strong> está vazia. Deve começar com <code style="color:var(--accent)">eyJ</code>'); return; }
  if(!key.startsWith('eyJ')){ showErr('⚠️ Chave inválida — você colou a chave errada.<br><span style="color:var(--muted)">Use a <strong>anon public</strong>, que começa com <code style="color:var(--accent)">eyJ</code>. Não use a service_role.</span>'); return; }

  btn.textContent='⏳ Conectando...'; btn.disabled=true;
  try{
    sb=createClient(url,key);
    const {error}=await sb.auth.getSession();
    if(error) throw error;
    localStorage.setItem('fp_url',url);
    localStorage.setItem('fp_key',key);
    okEl.innerHTML='✅ Conectado! Redirecionando...';
    okEl.style.cssText='display:block;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:10px 12px;font-size:12px;color:var(--green)';
    btn.textContent='✓ Conectado!';
    setTimeout(()=>goLayer('login'),900);
  }catch(e){
    btn.textContent='⚡ Conectar ao Supabase'; btn.disabled=false;
    let msg=e.message||'Erro desconhecido';
    if(msg.includes('Invalid API key')||msg.includes('apikey')) msg='Chave inválida. Verifique se copiou a <strong>anon public</strong> correta.';
    else if(msg.includes('fetch')||msg.includes('network')) msg='Não foi possível alcançar o Supabase. Verifique a URL.';
    showErr('❌ '+msg+'<br><span style="color:var(--muted);display:block;margin-top:4px">Se ainda não criou as tabelas, use o SQL acima no SQL Editor do Supabase primeiro.</span>');
  }
}

// ══ AUTH ══
function switchTab(t){
  document.getElementById('tab-login').classList.toggle('active',t==='login');
  document.getElementById('tab-register').classList.toggle('active',t==='register');
  document.getElementById('form-login').style.display=t==='login'?'flex':'none';
  document.getElementById('form-register').style.display=t==='register'?'flex':'none';
}

async function fazerLogin(){
  const email=document.getElementById('l-email').value.trim();
  const senha=document.getElementById('l-senha').value;
  const errEl=document.getElementById('login-err');
  errEl.style.display='none';
  if(!email||!senha){errEl.textContent='Preencha email e senha.';errEl.style.display='block';return;}
  const {data,error}=await sb.auth.signInWithPassword({email,password:senha});
  if(error){errEl.textContent='❌ '+error.message;errEl.style.display='block';return;}
  await carregarPerfil(data.user);
}

async function fazerCadastro(){
  const nome=document.getElementById('r-nome').value.trim();
  const email=document.getElementById('r-email').value.trim();
  const senha=document.getElementById('r-senha').value;
  const perfil=document.getElementById('r-perfil').value;
  const errEl=document.getElementById('register-err');
  const okEl=document.getElementById('register-ok');
  errEl.style.display='none'; okEl.style.display='none';
  if(!nome||!email||!senha){errEl.textContent='Preencha todos os campos.';errEl.style.display='block';return;}
  const {error}=await sb.auth.signUp({
    email,password:senha,
    options:{data:{nome,perfil}}
  });
  if(error){errEl.textContent='❌ '+error.message;errEl.style.display='block';return;}
  okEl.textContent='✓ Conta criada! Verifique seu email e depois faça login.';
  okEl.style.display='block';
}

async function esqueceuSenha(){
  const email=document.getElementById('l-email').value.trim();
  if(!email){notify('Digite seu email primeiro','error');return;}
  await sb.auth.resetPasswordForEmail(email);
  notify('Email de recuperação enviado!','success');
}

async function fazerLogout(){
  await sb.auth.signOut();
  currentUser=null; currentPerfil=null;
  goLayer('login');
}

async function carregarPerfil(user){
  currentUser=user;
  const {data}=await sb.from('perfis').select('*').eq('id',user.id).single();
  currentPerfil=data;
  iniciarApp();
}

// ══ APP INIT ══
function iniciarApp(){
  const p=currentPerfil;
  // Sidebar
  const nav=document.getElementById('sidebar-nav');
  const menus=ROLE_MENUS[p.perfil]||ROLE_MENUS.atendente;
  nav.innerHTML=menus.map(m=>{
    if(m.section) return `<div class="nav-section">${m.section}</div>`;
    return `<div class="nav-item" id="nav-${m.id}" onclick="goPage('${m.id}',this)"><span class="icon">${m.icon}</span>${m.label}</div>`;
  }).join('');

  // User info
  document.getElementById('sb-avatar').textContent=(p.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  document.getElementById('sb-nome').textContent=p.nome;
  document.getElementById('sb-role').textContent=ROLE_LABELS[p.perfil];
  const chip=document.getElementById('role-chip');
  chip.textContent=ROLE_LABELS[p.perfil];
  chip.className='role-chip '+p.perfil;

  goLayer('app');
  goPage('dashboard');
  carregarTudo();
}

