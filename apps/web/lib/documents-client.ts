/**
 * Client-side document creation. Calls the existing POST /api/documents route
 * (which uses the server Supabase client) so we never import server-only
 * Supabase code into client components.
 */

import type { JSONContent } from "novel";
import { emptyEditorContent } from "./content";

export interface CreatedDocument {
  id: string;
  title: string;
  content: unknown;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export async function createDocument(
  ownerId: string,
  title = "Untitled Document",
  content: unknown = emptyEditorContent,
): Promise<CreatedDocument> {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId, title, content }),
  });
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(error ?? "Failed to create document");
  }
  const { id } = (await res.json()) as { id: string };
  return {
    id,
    title,
    content,
    owner_id: ownerId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
