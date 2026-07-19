/**
 * Core document type. Designed to map cleanly to a database record later.
 * Replace mock data with real DB queries without changing component interfaces.
 */

export type DocumentOwnership = "owned" | "shared";

export interface Document {
  id: string;
  title: string;
  /** Display name of the document author */
  owner: string;
  /** ISO 8601 string; use Date object after connecting DB */
  lastUpdated: string;
  /** Whether the current user owns or was shared this document */
  ownership: DocumentOwnership;
  /** Only present when ownership === "shared" */
  sharedBy?: string;
}
