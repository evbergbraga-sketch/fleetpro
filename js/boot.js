// boot.js — Inicialização do sistema
window.addEventListener('DOMContentLoaded', async()=>{
  const url = localStorage.getItem('fp_url');
  const key = localStorage.getItem('fp_key');

  // Sem credenciais — mostra setup
  if(!url||!key){ goLayer('setup'); return; }

  // Já tem credenciais — vai direto para app sem piscar setup
  goLayer('app');

  sb = createClient(url, key, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:false }
  });

  try{
    const {data:{session}} = await sb.auth.getSession();
    if(session?.user){
      await carregarPerfil(session.user);
      // Restaura página que estava aberta antes do reload
      const lastPage = sessionStorage.getItem('fp_last_page');
      const lastChat = sessionStorage.getItem('fp_last_chat');
      sessionStorage.removeItem('fp_last_page');
      sessionStorage.removeItem('fp_last_chat');
      if(lastPage){
        setTimeout(()=>{
          goPage(lastPage);
          if(lastPage === 'chat' && lastChat){
            setTimeout(()=>abrirChat(lastChat), 500);
          }
        }, 800);
      }
    } else {
      // Sem sessão — vai para login (mas NÃO apaga as credenciais do Supabase)
      goLayer('login');
    }
  }catch(e){
    console.warn('boot erro:', e.message);
    // NUNCA apaga fp_url e fp_key — só vai para login
    goLayer('login');
  }

  sb.auth.onAuthStateChange(async(event, session)=>{
    if(event==='SIGNED_IN' && session?.user) await carregarPerfil(session.user);
    if(event==='SIGNED_OUT') goLayer('login');
  });

  // Conecta SSE após dados carregarem
  const cfg = JSON.parse(localStorage.getItem('fp_evo_cfg')||'{}');
  if(cfg.bridgeUrl && cfg.secret){
    setTimeout(()=> conectarSSE(cfg.bridgeUrl, cfg.secret), 2500);
  }
});
