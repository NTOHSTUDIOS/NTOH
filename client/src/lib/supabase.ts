import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Configuração robusta do cliente para gerenciar a sessão do usuário
// Isso garante que o Token (JWT) do usuário logado seja enviado em cada requisição
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Mantém o usuário logado mesmo após atualizar a página
    autoRefreshToken: true, // Renova o token automaticamente antes de expirar
    detectSessionInUrl: true // Detecta logins via URL (como recuperação de senha)
  }
})

// Debug apenas em desenvolvimento
if (import.meta.env.DEV) {
  console.log("Supabase Client inicializado com gerenciamento de sessão.");
}