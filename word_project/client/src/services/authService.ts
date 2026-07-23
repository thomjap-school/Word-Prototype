import { API_URL, getToken, authHeaders, parseJsonResponse } from "./http";

export interface UserOut {
  id: number;
  email: string;
  full_name: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
}

export interface ProfileUpdatePayload {
  email?: string;
  full_name?: string;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
}

interface TokenResponse {
  access_token: string;
}

// Levée quand le backend répond 410 : compte marqué supprimé mais encore
// dans le délai de grâce de 3 jours. Le frontend doit alors proposer la
// réactivation plutôt qu'afficher une simple erreur de connexion.
export class AccountPendingDeletionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountPendingDeletionError";
  }
}

// Variante du parseur partagé qui intercepte le 410 (compte en attente de
// suppression) avant l'erreur générique, pour permettre la réactivation.
async function parseErrorOrJson<T>(res: Response): Promise<T> {
  if (res.status === 410) {
    const data = await res.json().catch(() => null);
    throw new AccountPendingDeletionError(
      data?.detail || "Ce compte est en attente de suppression"
    );
  }
  return parseJsonResponse<T>(res);
}

function storeFullName(user: UserOut) {
  localStorage.setItem("fullName", user.full_name || user.email);
}

export async function login(payload: LoginPayload): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseErrorOrJson<TokenResponse>(res);
  localStorage.setItem("token", data.access_token);
  storeFullName(await getCurrentUser());
  return data.access_token;
}

// À appeler quand login() a levé une AccountPendingDeletionError et que
// l'utilisateur confirme vouloir réactiver son compte (mêmes identifiants).
export async function reactivateAccount(payload: LoginPayload): Promise<string> {
  const res = await fetch(`${API_URL}/auth/reactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseErrorOrJson<TokenResponse>(res);
  localStorage.setItem("token", data.access_token);
  storeFullName(await getCurrentUser());
  return data.access_token;
}

export async function register(payload: RegisterPayload): Promise<UserOut> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const user = await parseErrorOrJson<UserOut>(res);
  storeFullName(user);
  return user;
}

export async function loginWithGoogle(credential: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  const data = await parseErrorOrJson<TokenResponse>(res);
  localStorage.setItem("token", data.access_token);
  storeFullName(await getCurrentUser());
  return data.access_token;
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
  return parseErrorOrJson<{ message: string }>(res);
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return parseErrorOrJson<{ message: string }>(res);
}

export async function getCurrentUser(): Promise<UserOut> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  });
  return parseErrorOrJson<UserOut>(res);
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<UserOut> {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const user = await parseErrorOrJson<UserOut>(res);
  storeFullName(user);
  return user;
}

export async function changePassword(payload: PasswordChangePayload): Promise<void> {
  const res = await fetch(`${API_URL}/auth/me/password`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  await parseJsonResponse(res);
}

// Suppression douce du compte courant (délai de grâce de 3 jours,
// réactivable via reactivateAccount()). Déconnecte l'utilisateur localement
// juste après, puisque son compte n'est plus valide pour continuer à naviguer.
export async function deleteAccount(): Promise<void> {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await parseJsonResponse(res);
  logout();
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("fullName");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
