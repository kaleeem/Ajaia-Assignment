"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Check } from "lucide-react";
import { Button } from "@/components/tailwind/ui/button";
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";

interface EditorShellProps {
  documentId: string;
  /** Default title — can be replaced with DB-loaded value later */
  initialTitle?: string;
}

export function EditorShell({ documentId, initialTitle = "Untitled Document" }: EditorShellProps) {
  const [title, setTitle] = useState(initialTitle);

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
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Check className="h-3.5 w-3.5" />
          <span>Saved</span>
        </div>

        {/* Share button */}
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0 h-8">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
      </div>

      {/* Editor area */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto py-4 px-4 sm:px-5">
        {/* Protected Tiptap editor — UNTOUCHED */}
        <TailwindAdvancedEditor />
      </div>
    </div>
  );
}
