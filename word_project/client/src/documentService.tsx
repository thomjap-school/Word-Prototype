import { getToken } from "./authService";
import type { JSONContent } from "@tiptap/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface DocumentSummary {
  id: number;
  title: string;
  updated_at: string | null;
  created_at: string;
}

export interface DocumentOut {
  id: number;
  title: string;
  content: JSONContent | null;
  created_at: string;
  updated_at: string | null;
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseErrorOrJson(res: Response) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.detail || "Une erreur est survenue");
  }
  return data;
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  const res = await fetch(`${API_URL}/documents`, {
    headers: authHeaders(),
  });
  return parseErrorOrJson(res);
}

export async function getDocument(id: number): Promise<DocumentOut> {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    headers: authHeaders(),
  });
  return parseErrorOrJson(res);
}

export async function createDocument(
  title: string,
  content: JSONContent
): Promise<DocumentOut> {
  const res = await fetch(`${API_URL}/documents`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title, content }),
  });
  return parseErrorOrJson(res);
}

export async function updateDocument(
  id: number,
  payload: { title?: string; content?: JSONContent }
): Promise<DocumentOut> {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseErrorOrJson(res);
}

export async function deleteDocument(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || "Une erreur est survenue");
  }
}