// boot.js — Inicialização do sistema
window.addEventListener('DOMContentLoaded', async()=>{
  const url = localStorage.getItem('fp_url');
  const key = localStorage.getItem('fp_key');
  if(!url||!key){ goLayer('setup'); return; }

  sb = createClient(url, key);
  try{
    const {data:{session}, error} = await sb.auth.getSession();
    if(error) throw error;
    if(session?.user){
      await carregarPerfil(session.user);
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

  // Reconecta SSE se havia config salva
  const cfg = JSON.parse(localStorage.getItem('fp_evo_cfg')||'{}');
  if(cfg.bridgeUrl && cfg.secret){
    setTimeout(()=> conectarSSE(cfg.bridgeUrl, cfg.secret), 1000);
  }
});
