/**
 * Core document type used by the UI (dashboard + cards).
 * Maps cleanly to a database record via `toDocument`.
 */

export type DocumentOwnership = "owned" | "shared";

export interface Document {
  id: string;
  title: string;
  /** Display name of the document author */
  owner: string;
  /** Owner user id (used for access checks + display) */
  ownerId?: string;
  /** ISO 8601 string; use Date object after connecting DB */
  lastUpdated: string;
  /** Whether the current user owns or was shared this document */
  ownership: DocumentOwnership;
  /** Only present when ownership === "shared" */
  sharedBy?: string;
}

/**
 * Row shape stored in the Supabase `documents` table.
 * `content` is JSONB so Tiptap formatting survives reload.
 */
export interface DocumentRow {
  id: string;
  title: string;
  /** Tiptap JSON document */
  content: unknown;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/** Fixed mock owner until real auth/sharing lands. */
export const MOCK_OWNER_ID = "user-1";

/**
 * Convert a DB row into the UI-facing `Document` shape.
 * `sharedBy` is omitted for owned docs.
 */
export function toDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    title: row.title,
    owner: "You",
    ownerId: row.owner_id,
    lastUpdated: row.updated_at,
    ownership: "owned",
  };
}
