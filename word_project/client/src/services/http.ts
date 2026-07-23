// Point d'entrée unique de l'API REST : URL de base, en-têtes authentifiés et
// parseur de réponse partagés par authService et documentService.

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function parseJsonResponse<T = unknown>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.detail || "Une erreur est survenue");
  }
  return data as T;
}
