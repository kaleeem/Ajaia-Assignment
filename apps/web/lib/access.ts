/**
 * Pure application-level access-control rules for the mock-user assessment.
 * These contain no I/O so they can be unit-tested directly.
 *
 * NOTE: The underlying Supabase anon RLS policy is intentionally permissive
 * because no real Supabase Auth is used. This mock layer is NOT production
 * security — it is the assessment's required application-level enforcement.
 */

export type AccessRole = "owner" | "shared" | "none";

/**
 * Determines the current user's relationship to a document.
 * `sharedUserIds` is the set of user ids with a `document_shares` row.
 */
export function resolveAccess(
  ownerId: string,
  userId: string,
  sharedUserIds: string[],
): AccessRole {
  if (ownerId === userId) return "owner";
  if (sharedUserIds.includes(userId)) return "shared";
  return "none";
}

export function canRead(role: AccessRole): boolean {
  return role !== "none";
}

export function canEdit(role: AccessRole): boolean {
  return role !== "none";
}

export function canShare(role: AccessRole): boolean {
  return role === "owner";
}

export function canDelete(role: AccessRole): boolean {
  return role === "owner";
}
