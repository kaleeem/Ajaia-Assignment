import { NextResponse } from "next/server";
import { grantShare, listShares } from "@/lib/documents";
import { DEFAULT_USER_ID, CURRENT_USER_STORAGE_KEY } from "@/lib/users";

interface Params {
  params: Promise<{ id: string }>;
}

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
 * GET /api/documents/[id]/shares?userId=...
 * Lists users who currently have access. Owner-only in practice (the editor
 * only renders the Share dialog for the owner).
 */
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const currentUserId = resolveUserId(req);

  try {
    const shares = await listShares(id);
    void currentUserId;
    return NextResponse.json({ shares });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/documents/[id]/shares
 * Grants access to another seeded user. Owner-only + no self-share.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const cookieUser = resolveUserId(req);

  let body: { userId?: string; currentUserId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ownerId = body.currentUserId ?? cookieUser;
  const targetUserId = body.userId;

  if (!targetUserId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const share = await grantShare(id, ownerId, targetUserId);
    return NextResponse.json({ share });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    let status = 500;
    if (message.includes("yourself")) status = 400;
    else if (message.includes("owner")) status = 403;
    return NextResponse.json({ error: message }, { status });
  }
}
