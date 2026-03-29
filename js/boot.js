// boot.js — Inicialização do sistema
window.addEventListener('DOMContentLoaded', async()=>{
  const url = localStorage.getItem('fp_url');
  const key = localStorage.getItem('fp_key');
  if(!url||!key){ goLayer('setup'); return; }

  sb = createClient(url, key, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:false }
  });

  try{
    const {data:{session}, error} = await sb.auth.getSession();
    if(error) throw error;
    if(session?.user){
      await carregarPerfil(session.user);
      // Restaura o chat que estava aberto antes do reload
      const lastChat = sessionStorage.getItem('fp_last_chat');
      if(lastChat){
        sessionStorage.removeItem('fp_last_chat');
        setTimeout(()=>{
          goPage('chat');
          setTimeout(()=>abrirChat(lastChat), 500);
        }, 1000);
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
