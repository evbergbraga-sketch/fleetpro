// boot.js — Inicialização do sistema

// ══ CREDENCIAIS HARDCODADAS (chave anon é pública por design) ══
const FP_URL = 'https://jjeogfafgbexgxqhubha.supabase.co';
const FP_KEY = 'COLE_SUA_CHAVE_ANON_AQUI';

window.addEventListener('DOMContentLoaded', async()=>{
  // Tenta pegar do localStorage (usuário que já configurou manualmente)
  // Se não tiver, usa as credenciais hardcodadas — pula setup direto
  const url = localStorage.getItem('fp_url') || FP_URL;
  const key = localStorage.getItem('fp_key') || FP_KEY;

  // Salva no localStorage para manter compatibilidade com o restante do sistema
  if(!localStorage.getItem('fp_url')) localStorage.setItem('fp_url', FP_URL);
  if(!localStorage.getItem('fp_key')) localStorage.setItem('fp_key', FP_KEY);

  // Vai direto para o app com loading — NUNCA mostra tela de setup
  goLayer('app');
  sb = createClient(url, key);

  try{
    const {data:{session}, error} = await sb.auth.getSession();
    if(error) throw error;
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
          if(lastPage==='chat' && lastChat){
            setTimeout(()=>abrirChat(lastChat), 500);
          }
        }, 800);
      }
    } else {
      goLayer('login');
    }
  }catch(e){
    // Se falhar, vai para login (não setup)
    goLayer('login');
  }

  sb.auth.onAuthStateChange(async(event, session)=>{
    if(event==='SIGNED_IN' && session?.user) await carregarPerfil(session.user);
    if(event==='SIGNED_OUT') goLayer('login');
  });

  // Reconecta SSE se havia config salva
  const cfg = JSON.parse(localStorage.getItem('fp_evo_cfg')||'{}');
  if(cfg.bridgeUrl && cfg.secret){
    setTimeout(()=> conectarSSE(cfg.bridgeUrl, cfg.secret), 2500);
  }
});
