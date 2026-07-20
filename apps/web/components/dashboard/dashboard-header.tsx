"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/tailwind/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

export function DashboardHeader() {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const [creating, setCreating] = useState(false);

  const handleNewDocument = async () => {
    // Prevent double-click from creating two documents.
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: userId }),
      });
      if (!res.ok) {
        let errMsg = "Failed to create document";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) errMsg = body.error;
          console.error("[CREATE_DOCUMENT_FAILED]", { status: res.status, error: body.error, userId });
        } catch {
          console.error("[CREATE_DOCUMENT_FAILED]", { status: res.status, userId });
        }
        toast.error(errMsg);
        return;
      }
      const { id } = (await res.json()) as { id: string };
      router.push(`/documents/${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      console.error("[CREATE_DOCUMENT_FAILED]", { error: msg, userId });
      toast.error("Failed to create document. Please check your connection and try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Documents
      </h1>

      <div className="flex items-center gap-2">
        {/* Search — UI only for now */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            id="document-search"
            type="text"
            placeholder="Search documents…"
            className="h-9 rounded-md border border-input bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-48"
          />
        </div>

        <Button
          id="new-document-btn"
          onClick={handleNewDocument}
          disabled={creating}
          className="gap-2 shrink-0"
          size="sm"
        >
          {creating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Document
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
