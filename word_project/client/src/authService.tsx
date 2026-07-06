const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface UserOut {
  id: number;
  email: string;
  full_name: string | null;
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

async function parseErrorOrJson(res: Response) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.detail || "Une erreur est survenue");
  }
  return data;
}

export async function login(payload: LoginPayload): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseErrorOrJson(res);
  localStorage.setItem("token", data.access_token);
  return data.access_token;
}

export async function register(payload: RegisterPayload): Promise<UserOut> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseErrorOrJson(res);
}

export async function getCurrentUser(): Promise<UserOut> {
  const token = getToken();
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseErrorOrJson(res);
}

export function logout() {
  localStorage.removeItem("token");
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
