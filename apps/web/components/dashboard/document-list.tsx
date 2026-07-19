import { FileText } from "lucide-react";
import { DocumentCard } from "./document-card";
import type { Document } from "@/lib/types";

interface DocumentListProps {
  documents: Document[];
  currentUserId: string;
  filter?: "all" | "owned" | "shared";
}

interface EmptyStateProps {
  title: string;
  description: string;
}

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
      </div>
    </div>
  );
}

export function DocumentList({
  documents,
  currentUserId,
  filter = "all",
}: DocumentListProps) {
  const owned = documents.filter((d) => (d.ownerId ?? "") === currentUserId);
  const shared = documents.filter((d) => (d.ownerId ?? "") !== currentUserId);

  const visibleOwned = filter === "shared" ? [] : owned;
  const visibleShared = filter === "owned" ? [] : shared;

  const hasOwned = visibleOwned.length > 0;
  const hasShared = visibleShared.length > 0;

  // Empty states — contextual to the active filter
  if (!hasOwned && !hasShared) {
    if (filter === "owned") {
      return (
        <EmptyState
          title="No owned documents"
          description="Documents you create will appear here."
        />
      );
    }
    if (filter === "shared") {
      return (
        <EmptyState
          title="No shared documents"
          description="Documents shared with you will appear here."
        />
      );
    }
    // filter === "all" — no documents at all
    return (
      <EmptyState
        title="No documents yet"
        description="Create your first document to get started."
      />
    );
  }

  return (
    <div className="space-y-8">
      {hasOwned && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {filter === "owned" ? "Owned by Me" : "My Documents"}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleOwned.map((doc) => (
              <DocumentCard key={doc.id} document={doc} currentUserId={currentUserId} />
            ))}
          </div>
        </section>
      )}

      {hasShared && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Shared with Me
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleShared.map((doc) => (
              <DocumentCard key={doc.id} document={doc} currentUserId={currentUserId} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
