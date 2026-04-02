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
    sb=createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
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
  document.getElementById('tab-login').classList.add('active');
  const tabReg = document.getElementById('tab-register');
  if(tabReg) tabReg.classList.remove('active');
  document.getElementById('form-login').style.display='flex';
  const formReg = document.getElementById('form-register');
  if(formReg) formReg.style.display='none';
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
  notify('Criação de conta desativada. Solicite acesso ao administrador.','error');
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
  const nav=document.getElementById('sidebar-nav');
  const menus=ROLE_MENUS[p.perfil]||ROLE_MENUS.atendente;
  nav.innerHTML=menus.map(m=>{
    if(m.section) return `<div class="nav-section">${m.section}</div>`;
    return `<div class="nav-item" id="nav-${m.id}" data-inv-page="${m.invPage||''}" onclick="${m.invPage?`goInvPage('${m.invPage}');goPage('${m.id}',this)`:`goPage('${m.id}',this)`}"><span class="icon">${m.icon}</span>${m.label}</div>`;
  }).join('');

  document.getElementById('sb-avatar').textContent=(p.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  document.getElementById('sb-nome').textContent=p.nome;
  document.getElementById('sb-role').textContent=ROLE_LABELS[p.perfil];
  const chip=document.getElementById('role-chip');
  chip.textContent=ROLE_LABELS[p.perfil];
  chip.className='role-chip '+p.perfil;

  goLayer('app');

  if(p.perfil === 'investidor'){
    // Investidor: carrega dados PRIMEIRO, só depois renderiza o painel
    _invPage = 'inv-dashboard';
    goPage('investidores'); // mostra a página (vai aparecer loading)
    carregarTudo().then(()=>{
      renderInvestidores(); // re-renderiza com dados completos
    });
  } else {
    goPage('dashboard');
    carregarTudo();
  }

  // ── Inject botão hamburguer no topbar (mobile) ──
  _injectHamburguer();
}

// ══ HAMBURGUER MOBILE ══
function _injectHamburguer(){
  if(document.getElementById('btn-hamburguer')) return;
  const topbar = document.querySelector('.topbar');
  if(!topbar) return;

  // Botão hamburguer
  const btn = document.createElement('button');
  btn.id = 'btn-hamburguer';
  btn.className = 'topbar-btn';
  btn.innerHTML = '☰';
  btn.title = 'Menu';
  btn.style.cssText = 'display:none;font-size:18px;';
  btn.onclick = toggleSidebar;
  topbar.insertBefore(btn, topbar.firstChild);

  // Overlay escuro atrás da sidebar
  const overlay = document.createElement('div');
  overlay.id = 'sidebar-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99;display:none;';
  overlay.onclick = closeSidebar;
  document.body.appendChild(overlay);

  // Mostra o botão só em mobile via resize
  function checkMobile(){
    const isMobile = window.innerWidth <= 768;
    btn.style.display = isMobile ? 'flex' : 'none';
    // No mobile, sidebar começa fechada
    if(isMobile){
      document.querySelector('.sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay').style.display = 'none';
    }
  }
  checkMobile();
  window.addEventListener('resize', checkMobile);
}

function toggleSidebar(){
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if(!sidebar) return;
  const isOpen = sidebar.classList.toggle('open');
  if(overlay) overlay.style.display = isOpen ? 'block' : 'none';
}

function closeSidebar(){
  document.querySelector('.sidebar')?.classList.remove('open');
  const overlay = document.getElementById('sidebar-overlay');
  if(overlay) overlay.style.display = 'none';
}

// Fecha sidebar ao clicar em item de menu no mobile
document.addEventListener('click', e=>{
  if(window.innerWidth > 768) return;
  if(e.target.closest('.nav-item')){
    closeSidebar();
  }
});

// ══ ALTERAR SENHA (usuário logado) ══
async function alterarSenha(){
  const atual  = document.getElementById('p-senha-atual')?.value;
  const nova   = document.getElementById('p-senha-nova')?.value;
  const conf   = document.getElementById('p-senha-conf')?.value;
  const errEl  = document.getElementById('p-senha-err');
  const okEl   = document.getElementById('p-senha-ok');

  if(errEl) errEl.style.display='none';
  if(okEl)  okEl.style.display='none';

  if(!nova||!conf){ _senhaErr('Preencha todos os campos.',errEl); return; }
  if(nova.length<6){ _senhaErr('A nova senha deve ter pelo menos 6 caracteres.',errEl); return; }
  if(nova!==conf){ _senhaErr('A confirmação não coincide com a nova senha.',errEl); return; }

  const btn = document.getElementById('btn-alterar-senha');
  if(btn){ btn.disabled=true; btn.textContent='Salvando...'; }

  try{
    // Reautentica com a senha atual primeiro
    const {error:reErr} = await sb.auth.signInWithPassword({
      email: currentUser.email, password: atual
    });
    if(reErr){ _senhaErr('Senha atual incorreta.',errEl); return; }

    // Atualiza para a nova senha
    const {error} = await sb.auth.updateUser({password: nova});
    if(error) throw error;

    if(okEl){ okEl.textContent='✅ Senha alterada com sucesso!'; okEl.style.display='block'; }
    notify('Senha alterada com sucesso!','success');
    ['p-senha-atual','p-senha-nova','p-senha-conf'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });
  }catch(e){
    _senhaErr('Erro: '+e.message, errEl);
  }finally{
    if(btn){ btn.disabled=false; btn.textContent='🔒 Alterar senha'; }
  }
}

function abrirMinhaConta(){
  const p = currentPerfil;
  const u = currentUser;
  if(!p||!u) return;
  const ini = (p.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const el = document.getElementById('mc-avatar'); if(el) el.textContent=ini;
  const nm = document.getElementById('mc-nome-display'); if(nm) nm.textContent=p.nome||'—';
  const em = document.getElementById('mc-email-display'); if(em) em.textContent=u.email||'—';
  const rl = document.getElementById('mc-role-display');
  if(rl){ rl.innerHTML=`<span class="role-chip ${p.perfil}" style="font-size:10px">${ROLE_LABELS[p.perfil]||p.perfil}</span>`; }
  // Limpa campos
  ['p-senha-atual','p-senha-nova','p-senha-conf'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const errEl=document.getElementById('p-senha-err'); if(errEl) errEl.style.display='none';
  const okEl=document.getElementById('p-senha-ok');   if(okEl)  okEl.style.display='none';
  document.getElementById('m-minha-conta').classList.add('show');
}

function _senhaErr(msg, el){
  if(!el) return;
  el.textContent=msg; el.style.display='block';
}

// Toggle mostrar/ocultar senha
function toggleSenhaVisivel(inputId, btnId){
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  if(!input) return;
  const visivel = input.type==='text';
  input.type = visivel ? 'password' : 'text';
  if(btn) btn.textContent = visivel ? '👁️' : '🙈';
}

// ══ CRIAR USUÁRIO (só admin) ══
async function criarUsuarioAdmin(){
  if(currentPerfil?.perfil !== 'admin'){
    notify('Apenas administradores podem criar usuários.','error');
    return;
  }
  const nome  = document.getElementById('r-nome')?.value.trim();
  const email = document.getElementById('r-email')?.value.trim();
  const senha = document.getElementById('r-senha')?.value;
  const perfil= document.getElementById('r-perfil')?.value;
  const errEl = document.getElementById('register-err');
  const okEl  = document.getElementById('register-ok');
  if(errEl) errEl.style.display='none';
  if(okEl)  okEl.style.display='none';

  if(!nome||!email||!senha){
    if(errEl){errEl.textContent='Preencha todos os campos.';errEl.style.display='block';}
    return;
  }
  const {error}=await sb.auth.signUp({
    email, password:senha,
    options:{data:{nome,perfil}}
  });
  if(error){
    if(errEl){errEl.textContent='❌ '+error.message;errEl.style.display='block';}
    return;
  }
  if(okEl){okEl.textContent='✓ Usuário criado! Peça para ele confirmar o email.';okEl.style.display='block';}
  notify('Usuário '+nome+' criado com sucesso!','success');
  ['r-nome','r-email','r-senha'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
}

// ══ ALTERAR SENHA ══

// ══ MODAL MEU PERFIL ══
function abrirModalMeuPerfil(){
  const p = currentPerfil;
  const u = currentUser;
  if(!p||!u) return;

  const ini = (p.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const av = document.getElementById('mp-avatar'); if(av) av.textContent=ini;
  const nm = document.getElementById('mp-nome');   if(nm) nm.textContent=p.nome||'—';
  const em = document.getElementById('mp-email');  if(em) em.textContent=u.email||'—';
  const ro = document.getElementById('mp-role');   if(ro){ ro.textContent=ROLE_LABELS[p.perfil]||p.perfil; ro.className='role-chip '+p.perfil; }

  // Limpa campos e feedbacks
  ['nova-senha','conf-senha'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  ['senha-err','senha-ok'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });

  document.getElementById('m-meu-perfil').classList.add('show');
}
