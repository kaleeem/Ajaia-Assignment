/**
 * Seeded mock users for the timed assessment.
 *
 * This is intentionally NOT real authentication. There are no passwords,
 * no OAuth, and no Supabase Auth. The "current user" is just a client-side
 * selection stored in localStorage and used to drive ownership + sharing.
 */

export interface MockUser {
  id: string;
  name: string;
  email: string;
}

export const MOCK_USERS: MockUser[] = [
  { id: "user-1", name: "Kaleem", email: "kaleem@ajaia.demo" },
  { id: "user-2", name: "Sarah Chen", email: "sarah@ajaia.demo" },
  { id: "user-3", name: "Marcus Webb", email: "marcus@ajaia.demo" },
];

export const DEFAULT_USER_ID = "user-1";

export const CURRENT_USER_STORAGE_KEY = "ajaia-current-user-id";

export function getUserById(id: string | null | undefined): MockUser | undefined {
  if (!id) return undefined;
  return MOCK_USERS.find((u) => u.id === id);
}

/** Display name lookup used by document cards / metadata. */
export function userName(id: string | null | undefined): string {
  return getUserById(id)?.name ?? "Unknown";
}
