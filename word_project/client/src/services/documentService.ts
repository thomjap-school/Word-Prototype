import type { JSONContent } from "@tiptap/react";
import { API_URL, authHeaders, parseJsonResponse } from "./http";

export interface DocumentSummary {
  id: number;
  title: string;
  updated_at: string | null;
  created_at: string;
}

export interface Collaborator {
  id: number;
  email: string;
  full_name: string | null;
}

export interface DocumentOut {
  id: number;
  title: string;
  content: JSONContent | null;
  created_at: string;
  updated_at: string | null;
  owner_id: number;
  collaborators: Collaborator[];
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  const res = await fetch(`${API_URL}/documents`, {
    headers: authHeaders(),
  });
  return parseJsonResponse<DocumentSummary[]>(res);
}

export async function getDocument(id: number): Promise<DocumentOut> {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    headers: authHeaders(),
  });
  return parseJsonResponse<DocumentOut>(res);
}

export async function createDocument(title: string): Promise<DocumentOut> {
  const res = await fetch(`${API_URL}/documents`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });
  return parseJsonResponse<DocumentOut>(res);
}

export async function updateDocumentTitle(
  id: number,
  title: string
): Promise<DocumentOut> {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });
  return parseJsonResponse<DocumentOut>(res);
}

export async function updateDocumentContent(
  id: number,
  content: JSONContent
): Promise<DocumentOut> {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  return parseJsonResponse<DocumentOut>(res);
}

export async function deleteDocument(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await parseJsonResponse(res);
}

export async function inviteCollaborator(
  id: number,
  email: string
): Promise<DocumentOut> {
  const res = await fetch(`${API_URL}/documents/${id}/invite`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  return parseJsonResponse<DocumentOut>(res);
}

export async function removeCollaborator(
  id: number,
  userId: number
): Promise<DocumentOut> {
  const res = await fetch(`${API_URL}/documents/${id}/collaborators/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parseJsonResponse<DocumentOut>(res);
}

export async function generateShareLink(id: number): Promise<string> {
  const res = await fetch(`${API_URL}/documents/${id}/share-link`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await parseJsonResponse<{ share_token: string }>(res);
  return `${window.location.origin}/join/${data.share_token}`;
}

export async function joinViaShareLink(token: string): Promise<DocumentOut> {
  const res = await fetch(`${API_URL}/documents/join/${token}`, {
    method: "POST",
    headers: authHeaders(),
  });
  return parseJsonResponse<DocumentOut>(res);
}
