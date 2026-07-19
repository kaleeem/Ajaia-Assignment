"use client";

import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/tailwind/ui/button";

export function DashboardHeader() {
  const router = useRouter();

  const handleNewDocument = () => {
    // Generate a temporary ID until real persistence is wired up
    const tempId = `new-${Math.random().toString(36).slice(2, 9)}`;
    router.push(`/documents/${tempId}`);
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
          className="gap-2 shrink-0"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Document
        </Button>
      </div>
    </div>
  );
}
