import type { Document } from "./types";

/**
 * Mock document data for UI development.
 * Replace this export with a real data-fetching function (e.g. Supabase query)
 * without needing to change any component code.
 */
export const mockDocuments: Document[] = [
  {
    id: "doc-1a2b3c",
    title: "Product Requirements — Q3 2025",
    owner: "You",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 min ago
    ownership: "owned",
  },
  {
    id: "doc-4d5e6f",
    title: "Engineering Architecture Spec",
    owner: "You",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hrs ago
    ownership: "owned",
  },
  {
    id: "doc-7g8h9i",
    title: "Design System Guidelines",
    owner: "Sarah Chen",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    ownership: "shared",
    sharedBy: "Sarah Chen",
  },
  {
    id: "doc-j0k1l2",
    title: "2025 Roadmap & OKRs",
    owner: "Marcus Webb",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    ownership: "shared",
    sharedBy: "Marcus Webb",
  },
  {
    id: "doc-m3n4o5",
    title: "Meeting Notes — Weekly Sync",
    owner: "You",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    ownership: "owned",
  },
];
