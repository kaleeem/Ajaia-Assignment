import { NextResponse } from "next/server";
import {
  deleteDocument,
  getDocumentForUser,
  updateDocument,
} from "@/lib/documents";
import { canDelete, resolveAccess } from "@/lib/access";
import { DEFAULT_USER_ID, CURRENT_USER_STORAGE_KEY } from "@/lib/users";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Reads the mock current-user id. Prefers an explicit `userId` query param
 * sent by the client (reliable), then falls back to the cookie set by the
 * client switcher, then the default mock user.
 */
function resolveUserId(req: Request): string {
  const url = new URL(req.url);
  const explicit = url.searchParams.get("userId");
  if (explicit) return explicit;

  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CURRENT_USER_STORAGE_KEY}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : DEFAULT_USER_ID;
}

/**
 * GET /api/documents/[id]
 * Returns the full document only if the current user owns it or it was shared
 * with them. Otherwise 404 (application-level access control).
 */
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const currentUserId = resolveUserId(req);

  try {
    const doc = await getDocumentForUser(id, currentUserId);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[FETCH_DOCUMENT_FAILED]", { id, currentUserId, error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/documents/[id]
 * Debounced autosave target — persists title and/or Tiptap JSON content.
 * Allowed for the owner OR a user with a share (edit access).
 */
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const currentUserId = resolveUserId(req);

  let body: { title?: string; content?: unknown; currentUserId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const actor = body.currentUserId ?? currentUserId;

  const patch: { title?: string; content?: unknown } = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (body.content !== undefined) patch.content = body.content;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const doc = await getDocumentForUser(id, actor);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    const updated = await updateDocument(id, patch);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[SAVE_DOCUMENT_FAILED]", { id, actor, error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/[id]
 * Removes a document. Owner-only action.
 */
export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const currentUserId = resolveUserId(req);

  try {
    const doc = await getDocumentForUser(id, currentUserId);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    const role = resolveAccess(doc.owner_id, currentUserId, []);
    if (!canDelete(role)) {
      return NextResponse.json(
        { error: "Only the owner can delete this document." },
        { status: 403 },
      );
    }
    await deleteDocument(id);
    return NextResponse.json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[DELETE_DOCUMENT_FAILED]", { id, currentUserId, error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
