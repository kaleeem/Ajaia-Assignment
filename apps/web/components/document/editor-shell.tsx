"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Check, Loader2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/tailwind/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/tailwind/ui/dialog";
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { emptyEditorContent } from "@/lib/content";
import type { JSONContent } from "novel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { MOCK_USERS } from "@/lib/users";

type SaveState = "saved" | "saving" | "error";

interface EditorShellProps {
  documentId: string;
  initialTitle?: string;
  /** Tiptap JSON document loaded from the DB (or empty for new docs). */
  initialContent?: JSONContent;
  /** Owner of the document (server-provided). Null when not yet loaded. */
  ownerId?: string | null;
}

export function EditorShell({
  documentId,
  initialTitle = "Untitled Document",
  initialContent = emptyEditorContent,
  ownerId,
}: EditorShellProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const { userId, user, hydrated } = useCurrentUser();

  const isOwner = hydrated && ownerId != null && ownerId === userId;

  // ─── Refs ────────────────────────────────────────────────────────────────
  // Use a ref for userId so the save callback always reads the latest value
  // without needing to be recreated. This is the fix for the Sarah/Marcus
  // save-error bug: the previous code captured the stale DEFAULT_USER_ID
  // ("user-1") at mount time before hydration could update userId.
  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const titleRef = useRef(title);
  titleRef.current = title;
  const contentRef = useRef<JSONContent>(initialContent);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef<string>(JSON.stringify(initialContent));
  const lastSavedTitle = useRef(title);
  const inFlight = useRef<AbortController | null>(null);

  // ─── Save ────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    const currentContent = contentRef.current;
    const currentTitle = titleRef.current;
    const currentContentStr = JSON.stringify(currentContent);

    // Nothing changed — skip.
    if (
      currentContentStr === lastSavedContent.current &&
      currentTitle === lastSavedTitle.current
    ) {
      return;
    }

    // Always read from ref so we get the post-hydration userId, not the
    // stale default captured at mount time.
    const actorId = userIdRef.current;

    // Cancel any superseded in-flight request to avoid stale-save races.
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setSaveState("saving");
    try {
      const patch: { title?: string; content?: unknown; currentUserId: string } = {
        currentUserId: actorId,
      };
      if (currentTitle !== lastSavedTitle.current) patch.title = currentTitle;
      if (currentContentStr !== lastSavedContent.current) {
        patch.content = currentContent;
      }

      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errBody: { error?: string } = {};
        try { errBody = await res.json(); } catch { /* ignore */ }
        const errMsg = errBody.error ?? `HTTP ${res.status}`;
        console.error("[SAVE_DOCUMENT_FAILED]", { documentId, actor: actorId, status: res.status, error: errMsg });
        throw new Error(`save failed: ${res.status} — ${errMsg}`);
      }
      lastSavedContent.current = currentContentStr;
      lastSavedTitle.current = currentTitle;
      setSaveState("saved");
    } catch (err) {
      // AbortError is intentional (superseded request) — not a real error.
      if ((err as Error).name === "AbortError") return;
      console.error("[SAVE_DOCUMENT_FAILED]", { documentId, error: (err as Error).message });
      setSaveState("error");
      toast.error("Autosave failed — your changes may not have been saved.", { id: "autosave-error", duration: 4000 });
    }
  }, [documentId]);
  // NOTE: documentId is the only dep needed. userId is read via ref above.

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void save();
    }, 1200);
  }, [save]);

  // Direct editor callback — fires on every Tiptap content change.
  const handleEditorUpdate = useCallback(
    (json: JSONContent) => {
      contentRef.current = json;
      scheduleSave();
    },
    [scheduleSave],
  );

  // Save title changes (debounced) when title changes.
  // Use a layout effect here so the ref is current before the comparison.
  useEffect(() => {
    if (title !== lastSavedTitle.current) scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // Flush any pending save when unmounting (navigating away).
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const currentContentStr = JSON.stringify(contentRef.current);
      const currentTitle = titleRef.current;
      if (
        currentContentStr !== lastSavedContent.current ||
        currentTitle !== lastSavedTitle.current
      ) {
        const patch: { title?: string; content?: unknown; currentUserId: string } = {
          currentUserId: userIdRef.current,
        };
        if (currentTitle !== lastSavedTitle.current) patch.title = currentTitle;
        if (currentContentStr !== lastSavedContent.current) {
          patch.content = contentRef.current;
        }
        void fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
          keepalive: true,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // Initials for the user avatar in the top bar
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 shrink-0">
        {/* Back button */}
        <Link href="/dashboard" aria-label="Back to dashboard">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-medium">Back</span>
          </Button>
        </Link>

        {/* Divider */}
        <div className="h-4 w-px bg-border shrink-0" />

        {/* Editable document title */}
        <input
          id="document-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none truncate min-w-0"
          placeholder="Untitled Document"
          aria-label="Document title"
        />

        {/* Save status */}
        <SaveStatusBadge state={saveState} />

        {/* Share button — owner only */}
        {isOwner && (
          <ShareDialog documentId={documentId} ownerId={ownerId!} currentUserId={userId} />
        )}

        {/* Current user avatar — subtle indicator */}
        {hydrated && (
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold select-none ml-1"
            title={user.name}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Editor area — centered, comfortable reading width */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto py-8 px-4">
        <div className="w-full max-w-3xl">
          {/* Protected Tiptap editor — integration only; extensions untouched */}
          <TailwindAdvancedEditor
            initialContent={initialContent}
            onUpdate={handleEditorUpdate}
          />
        </div>
      </div>
    </div>
  );
}

function ShareDialog({
  documentId,
  ownerId,
  currentUserId,
}: {
  documentId: string;
  ownerId: string;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [sharedIds, setSharedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const loadShares = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/documents/${documentId}/shares?userId=${encodeURIComponent(currentUserId)}`,
      );
      if (res.ok) {
        const { shares } = (await res.json()) as { shares: { user_id: string }[] };
        setSharedIds(shares.map((s) => s.user_id));
      }
    } catch {
      /* ignore */
    }
  }, [documentId, currentUserId]);

  useEffect(() => {
    if (open) void loadShares();
  }, [open, loadShares]);

  const handleShare = async (targetUserId: string, name: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, currentUserId }),
      });
      if (!res.ok) {
        const { error } = (await res.json()) as { error?: string };
        throw new Error(error ?? "Failed to share");
      }
      toast.success(`Shared with ${name}`);
      await loadShares();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const others = MOCK_USERS.filter((u) => u.id !== ownerId);

  return (
    <>
      <Button
        id="share-document-btn"
        variant="outline"
        size="sm"
        className="gap-1.5 shrink-0 h-8"
        onClick={() => setOpen(true)}
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share document</DialogTitle>
            <DialogDescription>
              Only you (the owner) can grant access. Shared users get edit access.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {others.map((u) => {
              const alreadyShared = sharedIds.includes(u.id);
              const initials = u.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold select-none">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {u.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  {alreadyShared ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary shrink-0">
                      <Check className="h-3 w-3" />
                      Shared
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      className="shrink-0"
                      onClick={() => handleShare(u.id, u.name)}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Share"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SaveStatusBadge({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Saving…</span>
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="flex items-center gap-1 text-xs text-destructive shrink-0">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Error</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
      <Check className="h-3.5 w-3.5" />
      <span>Saved</span>
    </div>
  );
}
