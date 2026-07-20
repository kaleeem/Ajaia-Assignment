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
  // Diagnostic: confirm env vars are available (boolean only — no values logged)
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseUrl || !hasSupabaseKey) {
    console.error("[CREATE_DOCUMENT_FAILED] Missing Supabase env vars", {
      hasSupabaseUrl,
      hasSupabaseKey,
    });
    return NextResponse.json(
      { error: "Server configuration error: missing database credentials." },
      { status: 500 },
    );
  }

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
    console.error("[CREATE_DOCUMENT_FAILED]", { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
