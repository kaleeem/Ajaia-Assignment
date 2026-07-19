import { createClient } from "./supabase/server";
import { emptyEditorContent } from "./content";
import {
  MOCK_OWNER_ID,
  toDocument,
  type Document,
  type DocumentRow,
} from "./types";
import { userName } from "./users";

/**
 * Server-side data access for documents backed by Supabase.
 * All functions run on the server (Server Components, Route Handlers).
 */

const TABLE = "documents";
const SHARES_TABLE = "document_shares";

export async function listOwnedDocuments(ownerId = MOCK_OWNER_ID): Promise<Document[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load documents: ${error.message}`);
  }

  return (data as DocumentRow[]).map(toDocument);
}

export async function listSharedDocuments(userId: string): Promise<Document[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from(SHARES_TABLE)
    .select("document:documents(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load shared documents: ${error.message}`);
  }

  const rows = (data as unknown as { document: DocumentRow }[])
    .map((r) => r.document)
    .filter((d): d is DocumentRow => Boolean(d))
    .map((row) => ({
      ...toDocument(row),
      owner: userName(row.owner_id),
      ownership: "shared" as const,
      sharedBy: userName(row.owner_id),
    }));

  return rows;
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load document: ${error.message}`);
  }

  return (data as DocumentRow) ?? null;
}

/**
 * Access-checked load: returns the document only if `userId` owns it OR
 * has a `document_shares` row. Returns null otherwise (treated as 404 at
 * the API/route layer). This is application-level access control — the
 * underlying anon RLS policy stays permissive because no real Supabase
 * Auth is used in this assessment.
 */
export async function getDocumentForUser(
  id: string,
  userId: string,
): Promise<DocumentRow | null> {
  const doc = await getDocument(id);
  if (!doc) return null;
  if (doc.owner_id === userId) return doc;

  const supabase = createClient();
  const { count, error } = await supabase
    .from(SHARES_TABLE)
    .select("*", { count: "exact", head: true })
    .eq("document_id", id)
    .eq("user_id", userId);

  // If the shares table is unavailable, fail closed (deny access).
  if (error) return null;
  return count && count > 0 ? doc : null;
}

export async function createDocument(
  ownerId = MOCK_OWNER_ID,
  title = "Untitled Document",
  content: unknown = emptyEditorContent,
): Promise<DocumentRow> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ title, content, owner_id: ownerId })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create document: ${error.message}`);
  }

  return data as DocumentRow;
}

export async function updateDocument(
  id: string,
  patch: { title?: string; content?: unknown },
): Promise<DocumentRow> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update document: ${error.message}`);
  }

  return data as DocumentRow;
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Sharing
// ---------------------------------------------------------------------------

export interface DocumentShare {
  id: string;
  document_id: string;
  user_id: string;
  created_at: string;
}

/** Returns the seeded users who currently have access (excluding the owner). */
export async function listShares(documentId: string): Promise<DocumentShare[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from(SHARES_TABLE)
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load shares: ${error.message}`);
  }

  return data as DocumentShare[];
}

/**
 * Grants access to `targetUserId`. Owner-only (enforced by the caller).
 * No-op if a share already exists (unique constraint on document_id+user_id).
 */
export async function grantShare(
  documentId: string,
  ownerId: string,
  targetUserId: string,
): Promise<DocumentShare> {
  if (targetUserId === ownerId) {
    throw new Error("You cannot share a document with yourself.");
  }

  const supabase = createClient();

  // Verify ownership before granting.
  const { data: doc, error: docError } = await supabase
    .from(TABLE)
    .select("owner_id")
    .eq("id", documentId)
    .maybeSingle();

  if (docError) {
    throw new Error(`Failed to verify ownership: ${docError.message}`);
  }
  if (!doc || doc.owner_id !== ownerId) {
    throw new Error("Only the document owner can share it.");
  }

  const { data, error } = await supabase
    .from(SHARES_TABLE)
    .upsert(
      { document_id: documentId, user_id: targetUserId },
      { onConflict: "document_id,user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to share document: ${error.message}`);
  }

  return data as DocumentShare;
}
