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

export interface ProfileUpdatePayload {
  email?: string;
  full_name?: string;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
}

async function parseErrorOrJson(res: Response) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.detail || "Une erreur est survenue");
  }
  return data;
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
  const data = await parseErrorOrJson(res);
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
  const user = await parseErrorOrJson(res);
  storeFullName(user);
  return user;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getCurrentUser(): Promise<UserOut> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  });
  return parseErrorOrJson(res);
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<UserOut> {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const user = await parseErrorOrJson(res);
  storeFullName(user);
  return user;
}

export async function changePassword(payload: PasswordChangePayload): Promise<void> {
  const res = await fetch(`${API_URL}/auth/me/password`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || "Une erreur est survenue");
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("fullName");
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
