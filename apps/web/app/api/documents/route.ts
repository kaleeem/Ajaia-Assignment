import { NextResponse } from "next/server";
import { createDocument } from "@/lib/documents";
import { DEFAULT_USER_ID } from "@/lib/users";
import { emptyEditorContent } from "@/lib/content";

/**
 * POST /api/documents
 * Creates a new document owned by the (mock) current user and returns its id.
 * Accepts optional `title` and `content` (used by file import).
 */
export async function POST(req: Request) {
  try {
    let ownerId = DEFAULT_USER_ID;
    let title = "Untitled Document";
    let content: unknown = emptyEditorContent;

    try {
      const body = (await req.json()) as {
        ownerId?: string;
        title?: string;
        content?: unknown;
      };
      if (body.ownerId) ownerId = body.ownerId;
      if (typeof body.title === "string" && body.title.trim()) title = body.title.trim();
      if (body.content !== undefined) content = body.content;
    } catch {
      // No body — fall back to defaults.
    }

    const doc = await createDocument(ownerId, title, content);
    return NextResponse.json({ id: doc.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
