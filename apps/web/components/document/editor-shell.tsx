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
  const { userId, hydrated } = useCurrentUser();

  const isOwner = hydrated && ownerId != null && ownerId === userId;

  // Latest values held in refs so the autosave callback reads fresh data.
  const titleRef = useRef(title);
  titleRef.current = title;
  const contentRef = useRef<JSONContent>(initialContent);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef<string>(JSON.stringify(initialContent));
  const lastSavedTitle = useRef(title);
  const inFlight = useRef<AbortController | null>(null);

  const save = useCallback(async () => {
    const currentContent = contentRef.current;
    const currentTitle = titleRef.current;
    const currentContentStr = JSON.stringify(currentContent);

    if (
      currentContentStr === lastSavedContent.current &&
      currentTitle === lastSavedTitle.current
    ) {
      return;
    }

    // Cancel a superseded in-flight request to avoid stale-save races.
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setSaveState("saving");
    try {
      const patch: { title?: string; content?: unknown; currentUserId?: string } = {};
      if (currentTitle !== lastSavedTitle.current) patch.title = currentTitle;
      if (currentContentStr !== lastSavedContent.current) {
        patch.content = currentContent;
      }
      patch.currentUserId = userId;

      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`save failed: ${res.status}`);
      lastSavedContent.current = currentContentStr;
      lastSavedTitle.current = currentTitle;
      setSaveState("saved");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setSaveState("error");
    }
  }, [documentId]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void save();
    }, 1000);
  }, [save]);

  // Direct editor callback — fires on every Tiptap content change.
  const handleEditorUpdate = useCallback(
    (json: JSONContent) => {
      contentRef.current = json;
      scheduleSave();
    },
    [scheduleSave],
  );

  // Save title changes (debounced) independently of editor content.
  useEffect(() => {
    if (title !== lastSavedTitle.current) scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // Flush a pending save when leaving the editor (e.g. back to dashboard).
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const currentContentStr = JSON.stringify(contentRef.current);
      const currentTitle = titleRef.current;
      if (
        currentContentStr !== lastSavedContent.current ||
        currentTitle !== lastSavedTitle.current
      ) {
        const patch: { title?: string; content?: unknown; currentUserId?: string } = {};
        if (currentTitle !== lastSavedTitle.current) patch.title = currentTitle;
        if (currentContentStr !== lastSavedContent.current) {
          patch.content = contentRef.current;
        }
        patch.currentUserId = userId;
        void fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
          keepalive: true,
        });
      }
    };
  }, [documentId]);

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 shrink-0">
        {/* Back button */}
        <Link href="/dashboard" aria-label="Back to dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {/* Divider */}
        <span className="text-border select-none">|</span>

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
        {isOwner && <ShareDialog documentId={documentId} ownerId={ownerId!} currentUserId={userId} />}
      </div>

      {/* Editor area */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto py-4 px-4 sm:px-5">
        {/* Protected Tiptap editor — integration only; extensions untouched */}
        <TailwindAdvancedEditor
          initialContent={initialContent}
          onUpdate={handleEditorUpdate}
        />
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

          <div className="flex flex-col gap-1">
            {others.map((u) => {
              const alreadyShared = sharedIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {alreadyShared ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      <Check className="h-3 w-3" /> Shared
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
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
