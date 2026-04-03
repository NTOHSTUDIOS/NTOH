import { supabase } from "./supabase";

const TOKEN_KEY = "ntoh_token";
const EMAIL_KEY = "ntoh_email";
const NAME_KEY = "ntoh_name";

// Função para verificar se o usuário está logado (síncrona para UI rápida)
export function isLoggedIn(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

// Função para obter o e-mail do usuário logado
export function getUserEmail(): string {
  return localStorage.getItem(EMAIL_KEY) || "";
}

// Função para obter o nome do usuário logado
export function getUserName(): string {
  return localStorage.getItem(NAME_KEY) || "";
}

// Função auxiliar para gerar nome a partir do e-mail
function deriveNameFromEmail(email: string): string {
  const base = (email.split("@")[0] || "").trim();
  if (!base) return "";
  return base
    .split(".")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// LOGIN REAL COM SUPABASE
export async function login(email: string, password: string): Promise<void> {
  if (!email || !password) {
    throw new Error("Email e senha são obrigatórios");
  }

  // 1. Tentar fazer login no Supabase Real
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password
  });

  if (error) {
    // Erros comuns: 'Invalid login credentials'
    throw new Error(error.message === "Invalid login credentials" 
      ? "E-mail ou senha incorretos" 
      : error.message);
  }

  if (data.user && data.session) {
    const userEmail = data.user.email || "";
    const userName = deriveNameFromEmail(userEmail);

    // 2. Salvar dados no localStorage para persistência da UI
    localStorage.setItem(TOKEN_KEY, data.session.access_token);
    localStorage.setItem(EMAIL_KEY, userEmail);
    localStorage.setItem(NAME_KEY, userName);
  }
}

// LOGOUT REAL COM SUPABASE
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(NAME_KEY);
  window.location.href = "/login";
}

// Função extra para garantir que a sessão esteja sempre sincronizada
export async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    logout();
    return null;
  }
  return session;
}