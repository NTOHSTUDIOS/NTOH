// client/src/lib/auth.ts
const TOKEN_KEY = "ntoh_token";
const EMAIL_KEY = "ntoh_email";
const NAME_KEY = "ntoh_name";

export function isLoggedIn(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getUserEmail(): string {
  return localStorage.getItem(EMAIL_KEY) || "";
}

export function getUserName(): string {
  return localStorage.getItem(NAME_KEY) || "";
}

function deriveNameFromEmail(email: string): string {
  const base = (email.split("@")[0] || "").trim();
  if (!base) return "";

  // "joao.marcussi" -> "Joao Marcussi"
  return base
    .split(".")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function login(email: string, password: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!email || !password) {
    throw new Error("Email e senha são obrigatórios");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const name = deriveNameFromEmail(normalizedEmail);

  localStorage.setItem(TOKEN_KEY, `mock_token_${Date.now()}`);
  localStorage.setItem(EMAIL_KEY, normalizedEmail);
  localStorage.setItem(NAME_KEY, name);
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(NAME_KEY);
}