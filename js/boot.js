// boot.js — Inicialização do sistema
window.addEventListener('DOMContentLoaded', async()=>{
  const url = localStorage.getItem('fp_url');
  const key = localStorage.getItem('fp_key');
  if(!url||!key){ goLayer('setup'); return; }

  // Já tem config — mostra app direto, sem piscar tela de setup
  goLayer('app');

  sb = createClient(url, key, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:false }
  });

  try{
    const {data:{session}, error} = await sb.auth.getSession();
    if(error) throw error;
    if(session?.user){
      await carregarPerfil(session.user);
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
      // Restaura página e chat que estavam abertos antes do reload
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
      goLayer('login');
    }
  }catch(e){
    localStorage.removeItem('fp_url');
    localStorage.removeItem('fp_key');
    goLayer('setup');
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
