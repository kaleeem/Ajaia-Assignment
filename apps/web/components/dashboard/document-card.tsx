"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ExternalLink, Pencil as RenameIcon, Share2, Trash2, Clock, User } from "lucide-react";
import { Button } from "@/components/tailwind/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/tailwind/ui/popover";
import { cn } from "@/lib/utils";
import type { Document } from "@/lib/types";

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface DocumentCardProps {
  document: Document;
  currentUserId: string;
}

export function DocumentCard({ document: doc, currentUserId }: DocumentCardProps) {
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwned = (doc.ownerId ?? "") === currentUserId;

  const handleOpen = () => {
    router.push(`/documents/${doc.id}`);
  };

  const handleDelete = async () => {
    setPopoverOpen(false);
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}?userId=${encodeURIComponent(currentUserId)}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border p-4 transition-colors cursor-pointer",
        "hover:border-primary/30 hover:bg-accent/40",
        "border-border bg-card"
      )}
      onClick={handleOpen}
    >
      {/* Ownership badge */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            isOwned
              ? "bg-primary/10 text-primary"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          {isOwned ? "Owned" : "Shared"}
        </span>

        {/* Action menu — stops propagation so card click doesn't fire */}
        {isOwned && (
          <div onClick={(e) => e.stopPropagation()}>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Document actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-1" align="end">
                <ActionItem icon={ExternalLink} label="Open" onClick={() => { setPopoverOpen(false); handleOpen(); }} />
                <ActionItem icon={RenameIcon} label="Rename" onClick={() => { setPopoverOpen(false); handleOpen(); }} />
                <ActionItem icon={Share2} label="Share" onClick={() => { setPopoverOpen(false); handleOpen(); }} />
                <div className="my-1 border-t border-border" />
                <ActionItem icon={Trash2} label="Delete" onClick={handleDelete} destructive />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 pr-2">
        {doc.title}
      </h3>

      {/* Metadata */}
      <div className="mt-auto flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {isOwned ? "You" : `Shared by ${doc.owner}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{formatRelativeTime(doc.lastUpdated)}</span>
        </div>
      </div>
    </div>
  );
}

function ActionItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-accent"
      )}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  );
}
